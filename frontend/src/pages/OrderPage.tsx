import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import type { Service } from '../types';
import { echo } from '../echo';
import { useNotification } from '../contexts/NotificationContext';
import { useAuthStore } from '../store/authStore';
import { AdminNavigation } from '../components/AdminNavigation';
import { BillTemplate } from '../components/BillTemplate';

export function OrderPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id, slug],
    queryFn: () => ordersApi.getById(Number(id), slug),
    enabled: !!id,
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const approveEndMutation = useMutation({
    mutationFn: () => ordersApi.approveEnd(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const rejectEndMutation = useMutation({
    mutationFn: () => ordersApi.rejectEnd(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
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
    return Array.from(categoryMap.values()).sort((a, b) => {
      const orderA = a.sort_order ?? 0;
      const orderB = b.sort_order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.id - b.id;
    });
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



  const removeServiceMutation = useMutation({
    mutationFn: (itemId: number) =>
      ordersApi.removeService(Number(id!), itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });



  const confirmBatchMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      await Promise.all(itemIds.map((itemId) => ordersApi.confirmServiceItem(Number(id!), itemId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      showNotification('Đã xác nhận toàn bộ order!');
    },
  });

  const groupedItems = useMemo(() => {
    if (!order?.items) return [];

    // 1. Sort by time
    const sorted = [...order.items].sort((a: any, b: any) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    const groups: { time: string; items: any[] }[] = [];
    if (sorted.length === 0) return groups;

    // 2. Cluster
    let currentGroup = { time: sorted[0].created_at || 'Mới thêm', items: [sorted[0]] };

    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      const lastItem = currentGroup.items[currentGroup.items.length - 1];
      const prevTime = lastItem.created_at ? new Date(lastItem.created_at).getTime() : 0;
      const currTime = item.created_at ? new Date(item.created_at).getTime() : 0;

      // Threshold: 60 seconds (60000 ms)
      if (currTime - prevTime < 60000) {
        currentGroup.items.push(item);
      } else {
        groups.push(currentGroup);
        currentGroup = { time: item.created_at || 'Mới thêm', items: [item] };
      }
    }
    groups.push(currentGroup);

    return groups;
  }, [order?.items]);



  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.refetchQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Thanh toán thành công!');
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (txnId: number) => ordersApi.confirmTransaction(Number(id!), txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.refetchQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Xác nhận thanh toán thành công!');
    },
  });



  const applyDiscountMutation = useMutation({
    mutationFn: (code: string) => ordersApi.applyDiscount(Number(id!), code),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['order', id], updatedOrder);
      setDiscountFeedback({ type: 'success', message: 'Áp dụng mã giảm giá thành công.' });
      showNotification('Áp dụng mã giảm giá thành công!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể áp dụng mã giảm giá.';
      setDiscountFeedback({ type: 'error', message });
    },
  });

  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const orderCustomerName = order?.customer_name || null;
  const pendingTransaction = order?.transactions?.find((t: any) => t.status === 'pending') ?? null;



  const handlePrintBill = () => {
    window.print();
  };

  const submitSelectedItems = async () => {
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
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      showNotification('Đã đặt dịch vụ thành công!');
    } catch (error) {
      showNotification('Có lỗi xảy ra khi đặt dịch vụ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (order?.applied_discount?.code) {
      setDiscountCodeInput(order.applied_discount.code);
    }
  }, [order?.applied_discount?.code]);

  useEffect(() => {
    if (!id) return;

    const ordersChannel = echo.channel('orders');
    const staffChannel = echo.private('staff');

    const handleOrderEndRequested = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });
      }
    };

    const handleTransactionCreated = (data: any) => {
      if (data.transaction?.order_id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });
      }
    };

    const handleTransactionConfirmed = (data: any) => {
      if (data.transaction?.order_id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });

        // Hiển thị thông báo thanh toán thành công
        if (data.transaction?.status === 'success') {
          setShowPaymentSuccess(true);
          showNotification('Thanh toán thành công!');

          // Tự động ẩn sau 5 giây
          setTimeout(() => {
            setShowPaymentSuccess(false);
          }, 5000);
        }
      }
    };

    const handleOrderServiceAdded = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });
      }
    };

    const handleOrderServiceUpdated = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });
      }
    };

    const handleOrderServiceRemoved = (data: any) => {
      if (data.order?.id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });
      }
    };

    ordersChannel.listen('.order.end.requested', handleOrderEndRequested);
    staffChannel.listen('.order.end.requested', handleOrderEndRequested);
    ordersChannel.listen('.transaction.created', handleTransactionCreated);
    staffChannel.listen('.transaction.created', handleTransactionCreated);
    ordersChannel.listen('.transaction.confirmed', handleTransactionConfirmed);
    staffChannel.listen('.transaction.confirmed', handleTransactionConfirmed);
    ordersChannel.listen('.order.service.added', handleOrderServiceAdded);
    staffChannel.listen('.order.service.added', handleOrderServiceAdded);
    ordersChannel.listen('.order.service.updated', handleOrderServiceUpdated);
    staffChannel.listen('.order.service.updated', handleOrderServiceUpdated);
    ordersChannel.listen('.order.service.removed', handleOrderServiceRemoved);
    staffChannel.listen('.order.service.removed', handleOrderServiceRemoved);

    return () => {
      ordersChannel.stopListening('.order.end.requested');
      ordersChannel.stopListening('.transaction.created');
      ordersChannel.stopListening('.transaction.confirmed');
      ordersChannel.stopListening('.order.service.added');
      ordersChannel.stopListening('.order.service.updated');
      ordersChannel.stopListening('.order.service.removed');
      staffChannel.stopListening('.order.end.requested');
      staffChannel.stopListening('.transaction.created');
      staffChannel.stopListening('.transaction.confirmed');
      staffChannel.stopListening('.order.service.added');
      staffChannel.stopListening('.order.service.updated');
      staffChannel.stopListening('.order.service.removed');
      echo.leave('orders');
      echo.leave('staff');
    };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div>Không tìm thấy đơn hàng</div>;
  }

  const isActive = order.status === 'active';
  const isPendingEnd = order.status === 'pending_end';
  const isCompleted = order.status === 'completed';
  const canApplyDiscount = order.total_before_discount > 0 && !hasSuccessfulTransaction;


  const servicesTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.total_price), 0) || 0;
  const currentTotalBeforeDiscount = order.total_before_discount > 0 ? order.total_before_discount : servicesTotal;

  const handleApplyDiscount = () => {
    if (!canApplyDiscount) return;
    const trimmed = discountCodeInput.trim();
    if (!trimmed) return;
    setDiscountFeedback(null);
    applyDiscountMutation.mutate(trimmed.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <div className="print:hidden">
        <AdminNavigation userName={user?.name} onLogout={logout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-6">
            <button
              onClick={() => navigate(slug ? `/s/${slug}/staff` : '/staff')}
              className="flex items-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Quay lại</span>
            </button>
          </div>
          <main className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {isActive ? (
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 font-semibold rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat.id
                          ? 'bg-[#13ec6d] text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedServices.map((service) => {
                    const availableQuantity = service.inventory_quantity ?? 0;
                    const qty = selected[service.id] || 0;
                    const isOutOfStock = availableQuantity <= 0;

                    return (
                      <div key={service.id} className="border border-slate-200 rounded-lg p-4 flex flex-col items-center text-center">
                        {service.image && (
                          <img src={service.image} alt={service.name} className="w-32 h-32 object-cover mb-4 rounded-md" />
                        )}
                        <h3 className="font-bold text-slate-900">{service.name}</h3>
                        <p className="text-sm text-slate-500 mb-2">{service.description}</p>
                        <p className="text-blue-600 font-bold mb-4">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                        </p>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              if (qty <= 0) return;
                              setSelected((s) => {
                                const next = s[service.id] - 1;
                                const copy = { ...s };
                                if (next <= 0) delete copy[service.id];
                                else copy[service.id] = next;
                                return copy;
                              });
                            }}
                            className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 flex justify-center font-bold text-xl hover:bg-slate-300"
                          >
                            -
                          </button>
                          <span className="font-bold text-lg">{qty}</span>
                          <button
                            onClick={() => {
                              if (isOutOfStock || qty >= availableQuantity) {
                                showNotification('Hết hàng hoặc đủ số lượng');
                                return;
                              }
                              setSelected((s) => ({ ...s, [service.id]: (s[service.id] || 0) + 1 }));
                            }}
                            className={`w-8 h-8 rounded-full bg-[#13ec6d] text-white flex justify-center font-bold text-xl hover:opacity-90 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="hidden lg:block lg:col-span-2"></div>
            )}

            <div className={isActive ? 'lg:col-span-1' : 'lg:col-span-3 max-w-7xl mx-auto w-full'}>
              <div id="staff-bill" className={`sticky top-8 bg-white p-6 rounded-lg shadow-sm ${!isActive ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
                <div>
                  <h2 className="text-2xl font-bold mb-1 text-slate-900">Đơn hàng {order.order_code}</h2>
                  <p className="text-slate-600 mb-2">
                    Bàn: <span className="font-semibold">{order.table.name}</span>
                  </p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${order.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-orange-100 text-orange-800'
                      }`}
                  >
                    {order.status === 'active'
                      ? 'Đang sử dụng'
                      : order.status === 'completed'
                        ? 'Hoàn thành'
                        : 'Chờ xử lý'}
                  </span>

                  {isActive && (
                    <button
                      onClick={() => approveEndMutation.mutate()}
                      disabled={approveEndMutation.isPending}
                      className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors mb-4 disabled:opacity-50"
                    >
                      {approveEndMutation.isPending ? 'Đang xử lý...' : 'Kết thúc bàn'}
                    </button>
                  )}

                  {isPendingEnd && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => approveEndMutation.mutate()}
                        className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700"
                      >
                        Duyệt kết thúc
                      </button>
                      <button
                        onClick={() => rejectEndMutation.mutate()}
                        className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-slate-500">Bắt đầu</p>
                      <p className="font-semibold text-slate-800">
                        {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
                      </p>
                    </div>

                    {isActive && order.start_at && (
                      <div>
                        <p className="text-sm text-slate-500">Đang chơi</p>
                        <p className="font-semibold text-green-600 animate-pulse">
                          {(() => {
                            const start = new Date(order.start_at).getTime();
                            const now = currentTime.getTime();
                            const diff = Math.max(0, now - start);
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                            return `${hours}h ${minutes}p ${seconds}s`;
                          })()}
                        </p>
                      </div>
                    )}
                    {order.end_at && (
                      <div>
                        <p className="text-sm text-slate-500">Kết thúc</p>
                        <p className="font-semibold text-slate-800">
                          {new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                        </p>
                      </div>
                    )}
                    {order.total_play_time_minutes && (
                      <div className="col-span-2">
                        <p className="text-sm text-slate-500">Thời gian chơi</p>
                        <p className="font-semibold text-slate-800">
                          {Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}p
                        </p>
                      </div>
                    )}
                  </div>

                  {(orderCustomerName || order.cashier) && (
                    <div className="mb-4 text-sm border-t border-slate-200 pt-4">
                      {orderCustomerName && (
                        <p className="text-slate-600">
                          Khách hàng: <span className="font-semibold text-slate-900">{orderCustomerName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Dịch vụ đã chọn</h3>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {groupedItems.map(({ time, items }, index) => {
                        const isAllConfirmed = (items as any[]).every((i) => i.is_confirmed);
                        const unconfirmedIds = (items as any[]).filter((i) => !i.is_confirmed).map((i) => i.id);

                        return (
                          <div key={time} className="mb-6 last:mb-0 border border-slate-200 rounded-lg overflow-hidden">
                            <div
                              className={`px-4 py-3 flex items-center justify-between ${isAllConfirmed ? 'bg-green-100 border-b border-green-200' : 'bg-slate-50 border-b border-slate-200'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {isActive && !isAllConfirmed ? (
                                  <button
                                    onClick={() => confirmBatchMutation.mutate(unconfirmedIds)}
                                    disabled={confirmBatchMutation.isPending}
                                    className="w-6 h-6 rounded border border-slate-400 bg-white flex items-center justify-center hover:border-blue-500 text-transparent hover:text-blue-500 transition-colors"
                                  >
                                    {confirmBatchMutation.isPending ? (
                                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                <span className={`font-bold ${isAllConfirmed ? 'text-green-800' : 'text-slate-800'}`}>Order {index + 1}</span>
                              </div>
                              {isAllConfirmed && (
                                <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                                  Đã xác nhận
                                </span>
                              )}
                            </div>

                            <div className="p-4 space-y-4 bg-white">
                              {(() => {
                                const aggregatedItems = (items as any[]).reduce((acc: any[], item) => {
                                  const existing = acc.find((i) => i.service.id === item.service.id);
                                  if (existing) {
                                    existing.qty += item.qty;
                                    existing.total_price += Number(item.total_price);
                                    existing.ids = [...(existing.ids || [existing.id]), item.id];
                                  } else {
                                    acc.push({ ...item, ids: [item.id], total_price: Number(item.total_price) });
                                  }
                                  return acc;
                                }, []);

                                return aggregatedItems.map((item) => (
                                  <div key={item.service.id} className="flex justify-between items-center">
                                    <div>
                                      <p className="font-semibold text-slate-800">{item.service.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm text-slate-500">Số lượng: {item.qty}</p>
                                        {isActive && (
                                          <button
                                            onClick={() => removeServiceMutation.mutate(item.id)}
                                            className="text-red-500 text-xs hover:underline bg-red-50 px-2 py-1 rounded"
                                          >
                                            Xóa
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="font-semibold text-slate-800">
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total_price)}
                                    </p>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>
                        );
                      })}

                      {/* New Order Block (Selected Items) */}
                      {Object.keys(selected).length > 0 && (
                        <div className="mb-6 last:mb-0 border border-blue-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 flex items-center justify-between bg-blue-50 border-b border-blue-200">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded border border-blue-400 bg-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                              <span className="font-bold text-blue-800">Order Mới (Đang chọn)</span>
                            </div>
                          </div>

                          <div className="p-4 space-y-4 bg-white">
                            {Object.entries(selected).map(([id, qty]) => {
                              const service = services?.find((s) => s.id === Number(id));
                              if (!service) return null;
                              return (
                                <div key={`selected-${id}`} className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {service.name} <span className="text-blue-600 font-normal text-xs ml-1">(Mới)</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-slate-500">Số lượng: {qty}</p>
                                    </div>
                                  </div>
                                  <p className="font-semibold text-slate-800">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price * qty)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div>
                  <div className={`border-slate-200 mt-4 pt-4 flex justify-between items-center ${isActive ? 'border-t' : ''}`}>
                    <p className="font-bold text-lg text-slate-900">Tổng cộng</p>
                    <p className="font-bold text-lg text-blue-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        (currentTotalBeforeDiscount - (order.total_discount || 0)) +
                        Object.entries(selected).reduce((sum, [id, qty]) => {
                          const s = services?.find((x) => x.id === Number(id));
                          return sum + (s ? s.price * qty : 0);
                        }, 0),
                      )}
                    </p>
                  </div>

                  {
                    hasSelected && isActive && (
                      <button
                        onClick={submitSelectedItems}
                        disabled={isSubmitting}
                        className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận gọi món'}
                      </button>
                    )
                  }

                  {
                    (isCompleted || isPendingEnd) && (
                      <div className="mt-6">
                        {order.total_before_discount > 0 && !hasSuccessfulTransaction && (
                          <div className="mb-4">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={discountCodeInput}
                                onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                                placeholder="Mã giảm giá"
                                className="flex-1 px-3 py-2 border rounded-lg"
                              />
                              <button
                                onClick={handleApplyDiscount}
                                className="px-4 py-2 bg-slate-200 rounded-lg text-slate-800"
                              >
                                Áp dụng
                              </button>
                            </div>
                            {discountFeedback && (
                              <p className={`text-sm mt-2 ${discountFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                {discountFeedback.message}
                              </p>
                            )}
                          </div>
                        )}

                        {showPaymentSuccess && (
                          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200 animate-pulse">
                            <div className="flex items-center justify-center text-green-800 font-bold">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Thanh toán thành công!
                            </div>
                          </div>
                        )}

                        {!hasSuccessfulTransaction && pendingTransaction && !showPaymentSuccess && (
                          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-center text-yellow-800 font-bold mb-2">
                              Đang chờ xác nhận thanh toán ({pendingTransaction.method === 'cash' ? 'Tiền mặt' : pendingTransaction.method === 'card' ? 'Thẻ' : pendingTransaction.method === 'mobile' ? 'Chuyển khoản' : 'Đang chờ'})
                            </p>
                            <button
                              onClick={() => confirmPaymentMutation.mutate(pendingTransaction.id)}
                              className="w-full bg-yellow-600 text-white py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors"
                            >
                              Xác nhận đã nhận tiền
                            </button>
                            <div>
                              <p className="text-sm text-slate-500 pt-2">Ghi chú: Xác nhận khi khách hàng chọn phương thức thanh toán</p>
                            </div>
                          </div>
                        )}

                        {!hasSuccessfulTransaction && !isPendingEnd && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {(['cash', 'card', 'mobile'] as const).map((method) => (
                              <button
                                key={method}
                                onClick={() => setSelectedPaymentMethod(method)}
                                className={`py-2 rounded-lg border ${selectedPaymentMethod === method
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : 'border-slate-200 text-slate-600'
                                  }`}
                              >
                                {method === 'cash' ? 'Tiền mặt' : method === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                              </button>
                            ))}
                          </div>
                        )}

                        {!hasSuccessfulTransaction && !isPendingEnd && (
                          <button
                            onClick={() => paymentMutation.mutate({ method: selectedPaymentMethod, amount: order.total_before_discount - order.total_discount })}
                            disabled={paymentMutation.isPending}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {paymentMutation.isPending ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang xử lý...</span>
                              </>
                            ) : (
                              'Thanh toán'
                            )}
                          </button>
                        )}

                        {hasSuccessfulTransaction && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-center text-green-800 font-bold mb-2">Đã thanh toán thành công</p>
                            <button onClick={handlePrintBill} className="w-full bg-blue-600 text-white py-2 rounded-lg">
                              In hóa đơn
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <BillTemplate
        order={order}
        items={order.items || []}
        total={(currentTotalBeforeDiscount - (order.total_discount || 0))}
      />
    </div>
  );
}
