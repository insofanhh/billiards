import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import { discountCodesApi } from '../api/discountCodes';
import type { Service } from '../types';
import { echo } from '../echo';
import { useNotification } from '../contexts/NotificationContext';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';
import { clearClientActiveOrder, isClientOrderContinuable, persistClientActiveOrderFromOrder } from '../utils/clientActiveOrder';


export function ClientOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [showAddService, setShowAddService] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [guestName] = useState(getTemporaryUserName);

  const { data: order, isLoading } = useQuery({
    queryKey: ['client-order', id],
    queryFn: () => ordersApi.getById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (order?.table?.code) {
      localStorage.setItem('last_client_table_code', order.table.code);
    }
  }, [order?.table?.code]);

  useEffect(() => {
    if (!order) return;
    if (isClientOrderContinuable(order.status)) {
      persistClientActiveOrderFromOrder(order);
    } else {
      clearClientActiveOrder();
    }
  }, [order]);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const orderCustomerName = order?.customer_name || null;
  const canApplyDiscount = order ? order.total_before_discount > 0 && !hasSuccessfulTransaction : false;

  const { data: savedDiscounts } = useQuery({
    queryKey: ['saved-discounts'],
    queryFn: discountCodesApi.getSavedDiscounts,
    enabled: !!localStorage.getItem('auth_token') && !!order,
  });

  const requestEndMutation = useMutation({
    mutationFn: () => ordersApi.requestEnd(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      showNotification('Đã kết thúc giờ chơi. Vui lòng thanh toán.');
    },
  });

  const hasSelected = useMemo(() => Object.keys(selected).length > 0, [selected]);

  const categories = useMemo(() => {
    if (!services) return [];
    const categoryMap = new Map<number, { id: number; name: string; slug?: string; sort_order?: number }>();
    services.forEach((service) => {
      if (service.category_service) {
        const cat = service.category_service;
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, cat);
        }
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [services]);

  const servicesByCategory = useMemo(() => {
    if (!services) return new Map<number, Service[]>();
    const map = new Map<number, Service[]>();
    services.forEach((service) => {
      const catId = service.category_service?.id || 0;
      if (!map.has(catId)) {
        map.set(catId, []);
      }
      map.get(catId)!.push(service);
    });
    return map;
  }, [services]);

  const displayedServices = useMemo(() => {
    if (!services) return [];
    if (selectedCategory === null) {
      return services;
    }
    return servicesByCategory.get(selectedCategory) || [];
  }, [services, selectedCategory, servicesByCategory]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategory === null) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      showNotification('Đã gửi yêu cầu thanh toán. Vui lòng đợi nhân viên xác nhận.');
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: (code: string) => ordersApi.applyDiscount(Number(id!), code),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['client-order', id], updatedOrder);
      setDiscountFeedback({ type: 'success', message: 'Áp dụng mã giảm giá thành công.' });
      showNotification('Áp dụng mã giảm giá thành công!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể áp dụng mã giảm giá.';
      setDiscountFeedback({ type: 'error', message });
    },
  });

  const pendingTransaction = order?.transactions?.find((t: any) => t.status === 'pending') ?? null;
  const hasPendingTransaction = !!pendingTransaction;
  const canSelectPaymentMethod = !hasSuccessfulTransaction && (!pendingTransaction || !pendingTransaction.method);

  const cancelRequestMutation = useMutation({
    mutationFn: () => ordersApi.cancelRequest(Number(id!)),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['client-order', id], updatedOrder);
      showNotification('Đã hủy yêu cầu mở bàn.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể hủy yêu cầu mở bàn.';
      showNotification(message);
    },
  });

  useEffect(() => {
    if (order?.applied_discount?.code) {
      setDiscountCodeInput(order.applied_discount.code);
    }
  }, [order?.applied_discount?.code]);

  useEffect(() => {
    if (!id || !order) return;

    const userId = order.user_id;
    if (!userId) return;

    const userChannel = echo.private(`user.${userId}`);
    const ordersChannel = echo.channel('orders');

    const handleOrderApproved = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      }
    };

    userChannel.listen('.order.approved', handleOrderApproved);
    ordersChannel.listen('.order.approved', handleOrderApproved);

    const handleOrderRejected = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      }
    };

    const handleOrderEndApproved = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      }
    };

    const handleOrderEndRejected = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      }
    };

    userChannel.listen('.order.rejected', handleOrderRejected);
    ordersChannel.listen('.order.rejected', handleOrderRejected);

    userChannel.listen('.order.end.approved', handleOrderEndApproved);
    ordersChannel.listen('.order.end.approved', handleOrderEndApproved);

    userChannel.listen('.order.end.rejected', handleOrderEndRejected);
    ordersChannel.listen('.order.end.rejected', handleOrderEndRejected);

    const handleTransactionConfirmed = (data: any) => {
      if (data.transaction?.order_id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
        queryClient.refetchQueries({ queryKey: ['client-order', id] });
        setTimeout(() => {
          const bill = document.getElementById('client-bill');
          if (bill) {
            bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            setTimeout(() => {
              const billRetry = document.getElementById('client-bill');
              if (billRetry) {
                billRetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 500);
          }
        }, 300);
      }
    };

    const handleOrderServiceAdded = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
        queryClient.refetchQueries({ queryKey: ['client-order', id] });
      }
    };

    const handleOrderServiceUpdated = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
        queryClient.refetchQueries({ queryKey: ['client-order', id] });
      }
    };

    const handleOrderServiceRemoved = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
        queryClient.refetchQueries({ queryKey: ['client-order', id] });
      }
    };

    userChannel.listen('.transaction.confirmed', handleTransactionConfirmed);
    ordersChannel.listen('.transaction.confirmed', handleTransactionConfirmed);
    userChannel.listen('.order.service.added', handleOrderServiceAdded);
    ordersChannel.listen('.order.service.added', handleOrderServiceAdded);
    userChannel.listen('.order.service.updated', handleOrderServiceUpdated);
    ordersChannel.listen('.order.service.updated', handleOrderServiceUpdated);
    userChannel.listen('.order.service.removed', handleOrderServiceRemoved);
    ordersChannel.listen('.order.service.removed', handleOrderServiceRemoved);

    return () => {
      userChannel.stopListening('.order.approved');
      userChannel.stopListening('.order.rejected');
      userChannel.stopListening('.order.end.approved');
      userChannel.stopListening('.order.end.rejected');
      userChannel.stopListening('.transaction.confirmed');
      userChannel.stopListening('.order.service.added');
      userChannel.stopListening('.order.service.updated');
      userChannel.stopListening('.order.service.removed');
      ordersChannel.stopListening('.order.approved');
      ordersChannel.stopListening('.order.rejected');
      ordersChannel.stopListening('.order.end.approved');
      ordersChannel.stopListening('.order.end.rejected');
      ordersChannel.stopListening('.transaction.confirmed');
      ordersChannel.stopListening('.order.service.added');
      ordersChannel.stopListening('.order.service.updated');
      ordersChannel.stopListening('.order.service.removed');
      echo.leave(`user.${userId}`);
      echo.leave('orders');
    };
  }, [id, order, queryClient]);

  useEffect(() => {
    if (hasSuccessfulTransaction) {
      setTimeout(() => {
        const bill = document.getElementById('client-bill');
        if (bill) bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [hasSuccessfulTransaction]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#13ec6d]"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Không tìm thấy đơn hàng</div>;
  }
  const appliedDiscountLabel = order.applied_discount
    ? order.applied_discount.discount_type === 'percent'
      ? `${order.applied_discount.discount_value}%`
      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.applied_discount.discount_value)
    : '';

  const handleApplyDiscount = () => {
    if (!canApplyDiscount) return;
    const trimmed = discountCodeInput.trim();
    if (!trimmed) return;
    setDiscountFeedback(null);
    applyDiscountMutation.mutate(trimmed.toUpperCase());
  };

  const handleApplySavedDiscount = (code: string) => {
    if (!canApplyDiscount) return;
    setDiscountCodeInput(code);
    setDiscountFeedback(null);
    applyDiscountMutation.mutate(code.toUpperCase());
  };

  const formatDiscountValue = (discount: any) => {
    if (discount.discount_type === 'percent') {
      return `${discount.discount_value}%`;
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.discount_value);
  };

  const isDiscountAvailable = (discount: any) => {
    if (!order || !canApplyDiscount) return false;
    const now = new Date();
    if (discount.end_at && new Date(discount.end_at) < now) return false;
    if (discount.start_at && new Date(discount.start_at) > now) return false;
    if (discount.usage_limit && discount.used_count && discount.used_count >= discount.usage_limit) return false;
    if (discount.min_spend && order.total_before_discount < discount.min_spend) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        onVouchersClick={() => navigate('/client/vouchers')}
      />
      <div className="max-w-4xl mx-auto py-12 px-4">
        {!hasSuccessfulTransaction ? (
          <div className="bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-5 backdrop-blur-sm transition-colors duration-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn hàng {order.order_code}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Bàn: {order.table.name}</p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${order.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : order.status === 'completed'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    : order.status === 'pending_end'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                  {order.status === 'active'
                    ? 'Đang sử dụng'
                    : order.status === 'completed'
                      ? 'Hoàn thành'
                      : order.status === 'pending_end'
                        ? 'Chờ duyệt kết thúc'
                        : order.status === 'cancelled'
                          ? 'Đã hủy'
                          : 'Chờ duyệt'}
                </span>
              </div>
            </div>

            {order.status === 'active' && (
              <div className="mb-6">
                <button
                  onClick={() => requestEndMutation.mutate()}
                  disabled={requestEndMutation.isPending}
                  className="w-full py-3 px-6 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
                >
                  {requestEndMutation.isPending ? 'Đang gửi yêu cầu...' : 'Kết thúc giờ chơi'}
                </button>
              </div>
            )}

            {order.status === 'pending_end' && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-xl">
                <p className="text-orange-800 dark:text-orange-400 font-medium">Yêu cầu kết thúc giờ chơi đã được gửi. Vui lòng đợi nhân viên xác nhận.</p>
              </div>
            )}

            {order.status === 'pending' && (
              <div className="mb-6 space-y-3">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl">
                  <p className="text-yellow-800 dark:text-yellow-400 font-medium">Yêu cầu mở bàn đang chờ nhân viên duyệt.</p>
                </div>
                <button
                  onClick={() => cancelRequestMutation.mutate()}
                  disabled={cancelRequestMutation.isPending}
                  className="w-full py-3 px-6 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
                >
                  {cancelRequestMutation.isPending ? 'Đang hủy yêu cầu...' : 'Hủy yêu cầu mở bàn'}
                </button>
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                <p className="text-red-800 dark:text-red-400 font-medium">Yêu cầu mở bàn đã bị hủy. Vui lòng tạo yêu cầu mới nếu bạn vẫn muốn chơi.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bắt đầu</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}
                </p>
              </div>
              {order.end_at && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kết thúc</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </p>
                </div>
              )}
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Dịch vụ đã gọi</h3>
                <div className="space-y-2">
                  {(() => {
                    const sortedItems = [...order.items].sort((a, b) => {
                      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return timeA - timeB;
                    });

                    const groupedItems = sortedItems.reduce((acc: Record<number, Array<typeof sortedItems[0]>>, item) => {
                      const serviceId = item.service.id;
                      if (!acc[serviceId]) {
                        acc[serviceId] = [];
                      }
                      acc[serviceId].push(item);
                      return acc;
                    }, {});

                    return Object.values(groupedItems).map((items) => {
                      const firstItem = items[0];
                      if (!firstItem) return null;

                      const totalQty = items.reduce((sum, item) => {
                        const qty = Number(item.qty) || 0;
                        return sum + qty;
                      }, 0);

                      const totalPrice = items.reduce((sum, item) => {
                        if (!item.total_price && item.total_price !== 0) {
                          const calculatedPrice = (Number(item.unit_price) || 0) * (Number(item.qty) || 0);
                          return sum + calculatedPrice;
                        }
                        const price = Number(item.total_price) || 0;
                        return sum + price;
                      }, 0);

                      return (
                        <div key={firstItem.service.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/5">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{firstItem.service.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Số lượng: {totalQty}</p>
                          </div>
                          <p className="font-semibold ml-4 text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                          </p>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}
                </div>
              </div>
            )}

            {order.status === 'active' && (
              <div className="mb-6">
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="w-full py-2 px-4 border border-blue-600 dark:border-[#13ec6d] text-blue-600 dark:text-[#13ec6d] rounded-xl hover:bg-blue-50 dark:hover:bg-[#13ec6d]/10 transition-colors"
                >
                  {showAddService ? 'Ẩn danh sách dịch vụ' : 'Gọi thêm dịch vụ'}
                </button>

                {showAddService && services && categories.length > 0 && (
                  <div className="mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-200 dark:border-white/10 no-scrollbar">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-4 py-2 whitespace-nowrap rounded-t-md transition-colors ${selectedCategory === category.id
                            ? 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-medium'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                      {displayedServices.map((service: Service) => {
                        const availableQuantity = service.inventory_quantity ?? 0;
                        const qty = selected[service.id] || 0;
                        const isOutOfStock = availableQuantity <= 0;
                        const cardClasses = `bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-3 flex flex-col transition-all hover:shadow-md ${isOutOfStock ? 'opacity-50' : ''
                          }`;

                        const handleIncrease = () => {
                          if (isOutOfStock) {
                            showNotification('Dịch vụ này đã hết hàng.');
                            return;
                          }
                          if (qty >= availableQuantity) {
                            showNotification('Số lượng dịch vụ trong kho đã đến giới hạn.');
                            return;
                          }
                          setSelected((s) => ({ ...s, [service.id]: (s[service.id] || 0) + 1 }));
                        };

                        return (
                          <div key={service.id} className={cardClasses}>
                            {service.image && (
                              <img
                                src={service.image}
                                alt={service.name}
                                className="w-full h-32 object-cover rounded-lg mb-2 bg-gray-100 dark:bg-white/10"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1 text-gray-900 dark:text-white">{service.name}</p>
                              {service.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{service.description}</p>
                              )}
                              <p className="font-semibold text-blue-600 dark:text-[#13ec6d] mb-2">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                              </p>
                              {isOutOfStock && (
                                <p className="text-xs mb-2 text-red-600 dark:text-red-400">Hết hàng</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center space-x-2 w-full justify-between">
                                <button
                                  onClick={() => {
                                    if (qty <= 0) return;
                                    setSelected((s) => {
                                      const current = s[service.id] || 0;
                                      const next = Math.max(0, current - 1);
                                      const copy = { ...s };
                                      if (next === 0) delete copy[service.id]; else copy[service.id] = next;
                                      return copy;
                                    });
                                  }}
                                  disabled={qty <= 0}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${qty <= 0
                                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white'
                                    }`}
                                >
                                  −
                                </button>
                                <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{qty}</span>
                                <button
                                  onClick={handleIncrease}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition-colors ${isOutOfStock || qty >= availableQuantity
                                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 dark:bg-[#13ec6d] hover:bg-blue-700 dark:hover:bg-[#10d863] text-white dark:text-zinc-900'
                                    }`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={async () => {
                        if (!hasSelected || isSubmitting) return;
                        const entries = Object.entries(selected).map(([serviceId, qty]) => ({
                          serviceId: Number(serviceId),
                          qty,
                        }));
                        const exceededEntry = entries.find((entry) => {
                          const matched = services?.find((svc) => svc.id === entry.serviceId);
                          const available = matched?.inventory_quantity ?? 0;
                          return available <= 0 || entry.qty > available;
                        });
                        if (exceededEntry) {
                          showNotification('Số lượng dịch vụ trong kho đã đến giới hạn.');
                          return;
                        }
                        setIsSubmitting(true);
                        try {
                          await Promise.all(
                            entries.map((e) =>
                              ordersApi.addService(Number(id!), { service_id: e.serviceId, qty: e.qty }),
                            ),
                          );
                          setSelected({});
                          queryClient.invalidateQueries({ queryKey: ['client-order', id] });
                          showNotification('Đã gửi yêu cầu gọi dịch vụ. Nhân viên sẽ xử lý ngay.');
                        } catch (error) {
                          showNotification('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={!hasSelected || isSubmitting}
                      className={`mt-4 w-full py-3 px-4 rounded-xl text-white font-medium transition-colors shadow-lg ${hasSelected && !isSubmitting
                        ? 'bg-blue-600 dark:bg-[#13ec6d] hover:bg-blue-700 dark:hover:bg-[#10d863] dark:text-zinc-900 shadow-blue-500/20 dark:shadow-green-500/20'
                        : 'bg-gray-300 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed shadow-none'
                        }`}
                    >
                      {isSubmitting ? 'Đang gửi yêu cầu...' : 'Đặt dịch vụ'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {order.status === 'completed' && (
              <div>
                <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-transparent dark:border-white/5">
                  {order.total_before_discount > 0 && (
                    <>
                      {savedDiscounts && savedDiscounts.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Voucher đã lưu trong ví</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            {savedDiscounts.map((discount) => {
                              const available = isDiscountAvailable(discount);
                              const isApplied = order.applied_discount?.code === discount.code;
                              return (
                                <button
                                  key={discount.id}
                                  onClick={() => {
                                    if (available && !isApplied) {
                                      handleApplySavedDiscount(discount.code);
                                    }
                                  }}
                                  disabled={!available || applyDiscountMutation.isPending || isApplied}
                                  className={`p-3 rounded-xl border text-left transition ${isApplied
                                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-500/30 cursor-default'
                                    : available
                                      ? 'border-blue-300 bg-blue-50 dark:bg-[#13ec6d]/10 dark:border-[#13ec6d]/30 hover:bg-blue-100 dark:hover:bg-[#13ec6d]/20 cursor-pointer'
                                      : 'border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{discount.code}</p>
                                        {isApplied && (
                                          <span className="text-xs bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-400 px-2 py-0.5 rounded">Đang áp dụng</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        Giảm {formatDiscountValue(discount)}
                                        {discount.min_spend && ` • Đơn tối thiểu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.min_spend)}`}
                                      </p>
                                      {!available && !isApplied && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                          {discount.min_spend && order.total_before_discount < discount.min_spend
                                            ? `Cần đơn tối thiểu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.min_spend)}`
                                            : 'Voucher không khả dụng'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Hoặc nhập mã giảm giá</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={discountCodeInput}
                            onChange={(e) => {
                              setDiscountCodeInput(e.target.value.toUpperCase());
                              setDiscountFeedback(null);
                            }}
                            placeholder="Nhập mã (VD: VIP1)"
                            disabled={!canApplyDiscount || applyDiscountMutation.isPending}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-xl uppercase disabled:bg-gray-100 dark:disabled:bg-white/5 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#13ec6d] focus:border-transparent outline-none"
                          />
                          <button
                            onClick={handleApplyDiscount}
                            disabled={
                              !canApplyDiscount ||
                              applyDiscountMutation.isPending ||
                              discountCodeInput.trim().length === 0
                            }
                            className="px-4 py-2 bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-[#10d863] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {applyDiscountMutation.isPending ? 'Đang áp dụng...' : order.applied_discount ? 'Đổi mã' : 'Áp dụng'}
                          </button>
                        </div>
                        {order.applied_discount && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Đang áp dụng: <span className="font-semibold text-gray-900 dark:text-white">{order.applied_discount.code}</span> ({appliedDiscountLabel})
                          </p>
                        )}
                        {discountFeedback && (
                          <p
                            className={`text-sm mt-2 ${discountFeedback.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                              }`}
                          >
                            {discountFeedback.message}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  {order.total_before_discount > 0 && (
                    <div className="flex justify-between mb-2 text-gray-700 dark:text-gray-300">
                      <span>Tổng trước giảm giá:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_before_discount)}
                      </span>
                    </div>
                  )}
                  {order.total_discount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600 dark:text-[#13ec6d]">
                      <span>Giảm giá:</span>
                      <span className="font-semibold">
                        -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2 text-gray-900 dark:text-white">
                    <span className="text-lg font-bold">Tổng thanh toán:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-[#13ec6d]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_paid)}
                    </span>
                  </div>
                </div>

                {canSelectPaymentMethod && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Chọn phương thức thanh toán</p>
                    <div className="grid gap-3">
                      {(['cash', 'card', 'mobile'] as Array<'cash' | 'card' | 'mobile'>).map((method) => (
                        <label
                          key={method}
                          className={`flex flex-1 items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${selectedPaymentMethod === method
                            ? 'border-green-500 dark:border-[#13ec6d] bg-white dark:bg-white/10 shadow'
                            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-green-300 dark:hover:border-[#13ec6d]/50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="client-payment-method"
                            value={method}
                            checked={selectedPaymentMethod === method}
                            onChange={() => setSelectedPaymentMethod(method)}
                            className="h-4 w-4 text-green-600 dark:text-[#13ec6d] focus:ring-green-500 dark:focus:ring-[#13ec6d] bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {method === 'cash'
                                ? 'Tiền mặt'
                                : method === 'card'
                                  ? 'Quẹt thẻ'
                                  : 'Chuyển khoản (Mobile)'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {method === 'mobile'
                                ? 'Nhân viên sẽ hiển thị QR cho bạn'
                                : 'Xác nhận tại quầy với nhân viên'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const method = selectedPaymentMethod;
                        if (method === 'mobile') {
                          showNotification('Nhân viên sẽ hỗ trợ bạn chuyển khoản ngay tại quầy.');
                        }
                        paymentMutation.mutate({ method, amount: order.total_paid });
                      }}
                      disabled={paymentMutation.isPending}
                      className="w-full py-3 px-6 bg-green-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-green-700 dark:hover:bg-[#10d863] disabled:opacity-50 shadow-lg shadow-green-500/20 transition-all"
                    >
                      {paymentMutation.isPending ? 'Đang gửi yêu cầu...' : 'Xác nhận thanh toán'}
                    </button>
                  </div>
                )}

                {hasPendingTransaction && pendingTransaction?.method && !hasSuccessfulTransaction && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 font-medium text-center">Đang chờ nhân viên xác nhận thanh toán...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {hasSuccessfulTransaction && (
          <>
            <button
              type="button"
              onClick={() => navigate('/client')}
              className="mb-4 inline-flex items-center text-blue-600 transition hover:text-blue-800"
            >
              <span className="mr-2 text-lg">←</span>
              Quay lại
            </button>
            <div id="client-bill" className="bg-white rounded-lg shadow-md p-8 border-2 border-green-200">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-900">HÓA ĐƠN</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold">{order.order_code}</span>
                </div>
                {order.cashier && (
                  <div className="flex justify-between text-gray-600">
                    <span>Thu ngân:</span>
                    <span className="font-semibold text-gray-900">{order.cashier}</span>
                  </div>
                )}
                {orderCustomerName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="font-semibold">{orderCustomerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Bàn:</span>
                  <span className="font-semibold">{order.table.name}</span>
                </div>
                {order.start_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bắt đầu:</span>
                    <span>{new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </div>
                )}
                {order.end_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kết thúc:</span>
                    <span>{new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </div>
                )}
                {order.total_play_time_minutes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian chơi:</span>
                    <span>{Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}p</span>
                  </div>
                )}
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-gray-700">Dịch vụ:</h4>
                  <div className="space-y-1">
                    {(() => {
                      const sortedItems = [...order.items].sort((a, b) => {
                        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return timeA - timeB;
                      });

                      const groupedItems = sortedItems.reduce((acc: Record<number, Array<typeof sortedItems[0]>>, item) => {
                        const serviceId = item.service.id;
                        if (!acc[serviceId]) {
                          acc[serviceId] = [];
                        }
                        acc[serviceId].push(item);
                        return acc;
                      }, {});

                      return Object.values(groupedItems).map((items) => {
                        const firstItem = items[0];
                        if (!firstItem) return null;

                        const totalQty = items.reduce((sum, item) => {
                          const qty = Number(item.qty) || 0;
                          return sum + qty;
                        }, 0);

                        const totalPrice = items.reduce((sum, item) => {
                          if (!item.total_price && item.total_price !== 0) {
                            const calculatedPrice = (Number(item.unit_price) || 0) * (Number(item.qty) || 0);
                            return sum + calculatedPrice;
                          }
                          const price = Number(item.total_price) || 0;
                          return sum + price;
                        }, 0);

                        return (
                          <div key={firstItem.service.id} className="flex justify-between text-sm">
                            <span>{firstItem.service.name} x{totalQty}</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-300 pt-3 space-y-2">
                {order.total_before_discount > 0 && (
                  <div className="flex justify-between">
                    <span>Tổng trước giảm giá:</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_before_discount)}</span>
                  </div>
                )}
                {order.total_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Tổng thanh toán:</span>
                  <span className="text-green-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_paid)}</span>
                </div>
              </div>

              {order.transactions?.find((t: any) => t.status === 'success') && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phương thức thanh toán:</span>
                    <span className="capitalize">
                      {order.transactions.find((t: any) => t.status === 'success')?.method === 'cash' ? 'Tiền mặt' :
                        order.transactions.find((t: any) => t.status === 'success')?.method === 'card' ? 'Quẹt thẻ' :
                          'Chuyển khoản'}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


