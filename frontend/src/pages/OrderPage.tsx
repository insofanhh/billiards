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

export function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [showAddService, setShowAddService] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(Number(id)),
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
    const categoryMap = new Map<number, { id: number; name: string; slug?: string }>();
    services.forEach((service) => {
      if (service.category_service) {
        const cat = service.category_service;
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, cat);
        }
      }
    });
    return Array.from(categoryMap.values());
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

  const updateServiceMutation = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: number; qty: number }) =>
      ordersApi.updateService(Number(id!), itemId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: (itemId: number) =>
      ordersApi.removeService(Number(id!), itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const confirmServiceItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      ordersApi.confirmServiceItem(Number(id!), itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.refetchQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowPayment(false);
      showNotification('Thanh toán thành công!');
      setTimeout(() => {
        const bill = document.getElementById('staff-bill');
        if (bill) {
          bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setTimeout(() => {
            const billRetry = document.getElementById('staff-bill');
            if (billRetry) {
              billRetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        }
      }, 500);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (txnId: number) => ordersApi.confirmTransaction(Number(id!), txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.refetchQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Xác nhận thanh toán thành công!');
      setTimeout(() => {
        const bill = document.getElementById('staff-bill');
        if (bill) {
          bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setTimeout(() => {
            const billRetry = document.getElementById('staff-bill');
            if (billRetry) {
              billRetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        }
      }, 500);
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

  const handlePrintBill = () => {
    window.print();
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
        if (data.transaction?.status === 'success') {
          setTimeout(() => {
            const bill = document.getElementById('staff-bill');
            if (bill) {
              bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              setTimeout(() => {
                const billRetry = document.getElementById('staff-bill');
                if (billRetry) {
                  billRetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 500);
            }
          }, 500);
        }
      }
    };

    const handleTransactionConfirmed = (data: any) => {
      if (data.transaction?.order_id === Number(id)) {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.refetchQueries({ queryKey: ['order', id] });
        setTimeout(() => {
          const bill = document.getElementById('staff-bill');
          if (bill) {
            bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation userName={user?.name} onLogout={logout} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate('/staff')}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Quay lại
        </button>

        {!hasSuccessfulTransaction && (
          <>
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Đơn hàng {order.order_code}</h1>
                  <p className="text-gray-600 mt-2">Bàn: {order.table.name}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  order.status === 'active' ? 'bg-green-100 text-green-800' :
                  order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  order.status === 'pending_end' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'active' ? 'Đang sử dụng' : 
                   order.status === 'completed' ? 'Hoàn thành' : 
                   order.status === 'pending_end' ? 'Chờ duyệt kết thúc' :
                   'Chờ xử lý'}
                </span>
              </div>

              {isActive && (
                <div className="mb-6">
              <button
                onClick={() => approveEndMutation.mutate()}
                disabled={approveEndMutation.isPending}
                className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                  {approveEndMutation.isPending ? 'Đang tính toán...' : 'Kết thúc bàn'}
                </button>
                </div>
              )}

          {isPendingEnd && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 font-medium mb-4">Khách hàng đã yêu cầu kết thúc giờ chơi.</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => approveEndMutation.mutate()}
                  disabled={approveEndMutation.isPending}
                  className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {approveEndMutation.isPending ? 'Đang tính toán...' : 'Duyệt kết thúc'}
                </button>
                <button
                  onClick={() => rejectEndMutation.mutate()}
                  disabled={rejectEndMutation.isPending}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {rejectEndMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Bắt đầu</p>
              <p className="text-lg font-semibold">
                {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
              </p>
            </div>
            {order.end_at && (
              <div>
                <p className="text-sm text-gray-500">Kết thúc</p>
                <p className="text-lg font-semibold">
                  {new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </p>
              </div>
            )}
            {order.total_play_time_minutes && (
              <div>
                <p className="text-sm text-gray-500">Thời gian chơi</p>
                <p className="text-lg font-semibold">
                  {Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}m
                </p>
              </div>
            )}
          </div>

          {order.items && order.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Dịch vụ đã gọi</h3>
              <div className="space-y-4">
                {(() => {
                  const sortedItems = [...order.items].sort((a, b) => {
                    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return timeA - timeB;
                  });
                  
                  const batches: typeof order.items[] = [];
                  let currentBatch: typeof order.items = [];
                  let lastTime = 0;
                  const BATCH_TIME_THRESHOLD = 10000;
                  
                  sortedItems.forEach((item) => {
                    const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;
                    
                    if (currentBatch.length === 0 || (itemTime - lastTime) < BATCH_TIME_THRESHOLD) {
                      currentBatch.push(item);
                    } else {
                      batches.push(currentBatch);
                      currentBatch = [item];
                    }
                    lastTime = itemTime;
                  });
                  
                  if (currentBatch.length > 0) {
                    batches.push(currentBatch);
                  }
                  
                  return batches.map((batch, batchIndex) => {
                    const orderNumber = batchIndex + 1;
                    const allConfirmed = batch.every(item => item.is_confirmed);
                    
                    const handleConfirmBatch = () => {
                      const unconfirmedItems = batch.filter(item => !item.is_confirmed);
                      unconfirmedItems.forEach(item => {
                        confirmServiceItemMutation.mutate(item.id);
                      });
                    };
                    
                    return (
                      <div key={batchIndex} className={`border rounded-lg ${allConfirmed ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${allConfirmed ? 'bg-green-100 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            {isActive && (
                              <input
                                type="checkbox"
                                checked={allConfirmed}
                                onChange={handleConfirmBatch}
                                disabled={allConfirmed || confirmServiceItemMutation.isPending}
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            )}
                            {allConfirmed && (
                              <span className="text-green-600 font-semibold text-lg">✓</span>
                            )}
                            <h4 className="font-semibold text-gray-900">Order {orderNumber}</h4>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {batch.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="font-medium">{item.service.name}</p>
                                {isActive && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <button
                                      onClick={() => {
                                        if (item.qty > 1) {
                                          updateServiceMutation.mutate({ itemId: item.id, qty: item.qty - 1 });
                                        }
                                      }}
                                      disabled={item.is_confirmed || item.qty <= 1 || updateServiceMutation.isPending}
                                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      −
                                    </button>
                                    <span className="text-sm font-medium">Số lượng: {item.qty}</span>
                                    <button
                                      onClick={() => {
                                        updateServiceMutation.mutate({ itemId: item.id, qty: item.qty + 1 });
                                      }}
                                      disabled={item.is_confirmed || updateServiceMutation.isPending}
                                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Bạn có chắc muốn xóa dịch vụ này?')) {
                                          removeServiceMutation.mutate(item.id);
                                        }
                                      }}
                                      disabled={item.is_confirmed || removeServiceMutation.isPending}
                                      className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                )}
                                {!isActive && (
                                  <p className="text-sm text-gray-500 mt-1">Số lượng: {item.qty}</p>
                                )}
                              </div>
                              <p className="font-semibold ml-4">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total_price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {isActive && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                {showAddService ? 'Ẩn danh sách dịch vụ' : 'Gọi thêm dịch vụ'}
              </button>

              {showAddService && services && categories.length > 0 && (
                <div className="mt-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 whitespace-nowrap rounded-t-md transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {displayedServices.map((service: Service) => {
                      const availableQuantity = service.inventory_quantity ?? 0;
                      const qty = selected[service.id] || 0;
                      const isOutOfStock = availableQuantity <= 0;
                      const cardClasses = `bg-white rounded-lg shadow-sm p-3 flex flex-col ${
                        isOutOfStock ? 'opacity-50' : ''
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
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{service.description}</p>
                            )}
                            <p className="font-semibold text-blue-600 mb-2">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                            </p>
                            {isOutOfStock && (
                              <p className="text-xs mb-2 text-red-600">Hết hàng</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center space-x-2">
                              {qty > 0 && (
                                <>
                                  <button
                                    onClick={() => setSelected((s) => {
                                      const current = s[service.id] || 0;
                                      const next = Math.max(0, current - 1);
                                      const copy = { ...s };
                                      if (next === 0) delete copy[service.id]; else copy[service.id] = next;
                                      return copy;
                                    })}
                                    className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                  >
                                    −
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                </>
                              )}
                              <button
                                onClick={handleIncrease}
                                className={`w-7 h-7 flex items-center justify-center rounded text-lg font-bold ${
                                  isOutOfStock || qty >= availableQuantity
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                        queryClient.invalidateQueries({ queryKey: ['order', id] });
                        showNotification('Đã đặt dịch vụ thành công!');
                      } catch (error) {
                        showNotification('Có lỗi xảy ra khi đặt dịch vụ. Vui lòng thử lại.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={!hasSelected || isSubmitting}
                    className={`mt-4 w-full py-2 px-4 rounded-md text-white ${
                      hasSelected && !isSubmitting ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              )}
            </div>
          )}

          {(isCompleted || isPendingEnd) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              {order.total_before_discount > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Mã giảm giá</label>
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md uppercase disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={
                        !canApplyDiscount ||
                        applyDiscountMutation.isPending ||
                        discountCodeInput.trim().length === 0
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyDiscountMutation.isPending ? 'Đang áp dụng...' : order.applied_discount ? 'Đổi mã' : 'Áp dụng'}
                    </button>
                  </div>
                  {order.applied_discount && (
                    <p className="text-sm text-gray-600 mt-2">
                      Đang áp dụng: <span className="font-semibold">{order.applied_discount.code}</span> (
                      {appliedDiscountLabel})
                    </p>
                  )}
                  {discountFeedback && (
                    <p
                      className={`text-sm mt-2 ${
                        discountFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {discountFeedback.message}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span>Tổng trước giảm giá:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_before_discount)}
                </span>
              </div>
              {order.total_discount > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Giảm giá:</span>
                  <span className="font-semibold">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-lg font-bold">Tổng thanh toán:</span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_paid)}
                </span>
              </div>
            </div>
          )}

              {isCompleted && !hasSuccessfulTransaction && (
                <div>
              <button
                onClick={() => setShowPayment(!showPayment)}
                className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {showPayment ? 'Ẩn thanh toán' : 'Thanh toán'}
              </button>

              {showPayment && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
                      <select
                        id="payment_method"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="cash">Tiền mặt</option>
                        <option value="card">Thẻ</option>
                        <option value="mobile">Mobile banking</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        const method = (document.getElementById('payment_method') as HTMLSelectElement).value;
                        paymentMutation.mutate({
                          method: method as 'cash' | 'card' | 'mobile',
                          amount: order.total_paid,
                        });
                      }}
                      disabled={paymentMutation.isPending}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {paymentMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                    </button>
                  </div>
                </div>
              )}

              {order.transactions?.some(t => t.status === 'pending') && !hasSuccessfulTransaction && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="mb-2 text-yellow-800">Khách đã yêu cầu thanh toán (tiền mặt/thẻ).</p>
                  <button
                    onClick={() => {
                      const txn = order.transactions.find(t => t.status === 'pending');
                      if (txn) confirmPaymentMutation.mutate(txn.id);
                    }}
                    disabled={confirmPaymentMutation.isPending}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {confirmPaymentMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận đã thanh toán'}
                  </button>
                </div>
              )}
                </div>
              )}
            </div>
          </>
        )}

        {hasSuccessfulTransaction && (
          <div id="staff-bill" className="bg-white rounded-lg shadow-md p-8 border-2 border-green-200 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-center flex-1 text-gray-900">HÓA ĐƠN</h3>
                <button
                  onClick={handlePrintBill}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  In hóa đơn
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold">{order.order_code}</span>
                </div>
                {order.user && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="font-semibold">{order.user.name}</span>
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
                    <span>{Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}m</span>
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
        )}
      </div>
    </div>
  );
}

