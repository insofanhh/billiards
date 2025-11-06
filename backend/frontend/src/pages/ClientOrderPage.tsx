import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import type { Service, Order } from '../types';
import echo from '../echo';

export function ClientOrderPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showAddService, setShowAddService] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ['client-order', id],
    queryFn: () => ordersApi.getById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;

    const channel = echo.channel(`order.${id}`);
    
    channel
      .listen('.order.updated', (data: { data: Order }) => {
        queryClient.setQueryData(['client-order', id], data.data || data);
      })
      .listen('.transaction.updated', () => {
        queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      });

    return () => {
      echo.leave(`order.${id}`);
    };
  }, [id, queryClient]);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const requestEndMutation = useMutation({
    mutationFn: () => ordersApi.requestEnd(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      alert('Yêu cầu kết thúc giờ chơi đã được gửi. Vui lòng đợi nhân viên xác nhận.');
    },
  });

  const hasSelected = useMemo(() => Object.keys(selected).length > 0, [selected]);

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      setShowPayment(false);
      alert('Đã gửi yêu cầu thanh toán. Vui lòng đợi nhân viên xác nhận.');
    },
  });

  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const hasPendingTransaction = order?.transactions?.some((t: any) => t.status === 'pending') ?? false;

  useEffect(() => {
    if (hasSuccessfulTransaction) {
      setShowPayment(false);
      setTimeout(() => {
        const bill = document.getElementById('client-bill');
        if (bill) bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [hasSuccessfulTransaction]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
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
               'Chờ duyệt'}
            </span>
          </div>

          {order.status === 'active' && (
            <div className="mb-6">
              <button
                onClick={() => requestEndMutation.mutate()}
                disabled={requestEndMutation.isPending}
                className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {requestEndMutation.isPending ? 'Đang gửi yêu cầu...' : 'Kết thúc giờ chơi'}
              </button>
            </div>
          )}

          {order.status === 'pending_end' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 font-medium">Yêu cầu kết thúc giờ chơi đã được gửi. Vui lòng đợi nhân viên xác nhận.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Bắt đầu</p>
              <p className="text-lg font-semibold">
                {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}
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
          </div>

          {order.items && order.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Dịch vụ đã gọi</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.service.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Số lượng: {item.qty}</p>
                    </div>
                    <p className="font-semibold ml-4">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.status === 'active' && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                {showAddService ? 'Ẩn danh sách dịch vụ' : 'Gọi thêm dịch vụ'}
              </button>

              {showAddService && services && (
                <div className="mt-4">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {services.map((service: Service) => {
                      const qty = selected[service.id] || 0;
                      return (
                        <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.description}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <p className="font-semibold">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                            </p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelected((s) => {
                                  const current = s[service.id] || 0;
                                  const next = Math.max(0, current - 1);
                                  const copy = { ...s };
                                  if (next === 0) delete copy[service.id]; else copy[service.id] = next;
                                  return copy;
                                })}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-medium">{qty}</span>
                              <button
                                onClick={() => setSelected((s) => ({ ...s, [service.id]: (s[service.id] || 0) + 1 }))}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
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
                      if (!hasSelected) return;
                      const entries = Object.entries(selected).map(([serviceId, qty]) => ({ serviceId: Number(serviceId), qty }));
                      await Promise.all(entries.map((e) => ordersApi.addService(Number(id!), { service_id: e.serviceId, qty: e.qty })));
                      setSelected({});
                      queryClient.invalidateQueries({ queryKey: ['client-order', id] });
                      alert('Đã gửi yêu cầu gọi dịch vụ. Nhân viên sẽ xử lý ngay.');
                    }}
                    disabled={!hasSelected}
                    className={`mt-4 w-full py-2 px-4 rounded-md text-white ${hasSelected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    Đặt dịch vụ
                  </button>
                </div>
              )}
            </div>
          )}

          {order.status === 'completed' && (
            <div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-bold">Tổng thanh toán:</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_paid)}
                  </span>
                </div>
              </div>

              {!hasSuccessfulTransaction && (
                <button
                  onClick={() => setShowPayment(!showPayment)}
                  className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {showPayment ? 'Ẩn thanh toán' : 'Thanh toán'}
                </button>
              )}

              {showPayment && !hasSuccessfulTransaction && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
                      <select id="payment_method" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="cash">Tiền mặt (xác nhận tại quầy)</option>
                        <option value="card">Quẹt thẻ (xác nhận tại quầy)</option>
                        <option value="mobile">Chuyển khoản (hiển thị QR)</option>
                      </select>
                    </div>

                    {/* Placeholder QR cho chuyển khoản - tích hợp sepay sau */}
                    <div id="qr_preview" className="hidden"></div>

                    <button
                      onClick={() => {
                        const method = (document.getElementById('payment_method') as HTMLSelectElement).value as 'cash' | 'card' | 'mobile';
                        if (method === 'mobile') {
                          alert('Hiển thị QR chuyển khoản (tích hợp sau). Vui lòng liên hệ quầy để xác nhận.');
                        }
                        paymentMutation.mutate({ method, amount: order.total_paid });
                      }}
                      disabled={paymentMutation.isPending}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {paymentMutation.isPending ? 'Đang gửi yêu cầu...' : 'Xác nhận thanh toán'}
                    </button>
                    {hasPendingTransaction && (
                      <p className="text-sm text-orange-700 mt-2">Đang chờ nhân viên xác nhận thanh toán...</p>
                    )}
                    {hasSuccessfulTransaction && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium text-center">✓ Thanh toán thành công!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasSuccessfulTransaction && (
                <div id="client-bill" className="mt-6 p-6 bg-white border-2 border-green-200 rounded-lg">
                  <h3 className="text-xl font-bold text-center mb-4 text-gray-900">HÓA ĐƠN</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-semibold">{order.order_code}</span>
                    </div>
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
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.service.name} x{item.qty}</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total_price)}</span>
                          </div>
                        ))}
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
          )}
        </div>
      </div>
    </div>
  );
}


