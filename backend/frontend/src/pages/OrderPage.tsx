import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import type { Service } from '../types';
import { echo } from '../echo';

export function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddService, setShowAddService] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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

  const addServiceMutation = useMutation({
    mutationFn: ({ serviceId, qty }: { serviceId: number; qty: number }) =>
      ordersApi.addService(Number(id!), { service_id: serviceId, qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowAddService(false);
    },
  });

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

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowPayment(false);
      alert('Thanh toán thành công!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (txnId: number) => ordersApi.confirmTransaction(Number(id!), txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      alert('Xác nhận thanh toán thành công!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    },
  });

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
      }
    };

    ordersChannel.listen('.order.end.requested', handleOrderEndRequested);
    staffChannel.listen('.order.end.requested', handleOrderEndRequested);
    ordersChannel.listen('.transaction.created', handleTransactionCreated);
    staffChannel.listen('.transaction.created', handleTransactionCreated);
    ordersChannel.listen('.transaction.confirmed', handleTransactionConfirmed);
    staffChannel.listen('.transaction.confirmed', handleTransactionConfirmed);

    return () => {
      ordersChannel.stopListening('.order.end.requested');
      ordersChannel.stopListening('.transaction.created');
      ordersChannel.stopListening('.transaction.confirmed');
      staffChannel.stopListening('.order.end.requested');
      staffChannel.stopListening('.transaction.created');
      staffChannel.stopListening('.transaction.confirmed');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Quay lại
        </button>

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
              <div className="space-y-2">
                {order.items.map((item) => (
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
                            disabled={item.qty <= 1 || updateServiceMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.qty}</span>
                          <button
                            onClick={() => {
                              updateServiceMutation.mutate({ itemId: item.id, qty: item.qty + 1 });
                            }}
                            disabled={updateServiceMutation.isPending}
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
                            disabled={removeServiceMutation.isPending}
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
          )}

          {isActive && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                {showAddService ? 'Ẩn danh sách dịch vụ' : 'Gọi thêm dịch vụ'}
              </button>

              {showAddService && services && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {services.map((service: Service) => (
                    <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                        </p>
                        <button
                          onClick={() => addServiceMutation.mutate({ serviceId: service.id, qty: 1 })}
                          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isCompleted || isPendingEnd) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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

          {isCompleted && (
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

              {order.transactions?.some(t => t.status === 'pending') && (
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
      </div>
    </div>
  );
}

