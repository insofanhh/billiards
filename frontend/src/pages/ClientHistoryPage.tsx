import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';
import type { Order } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export function ClientHistoryPage() {
  const navigate = useNavigate();
  const [guestName] = useState(getTemporaryUserName);
  const lastTableCode = typeof window !== 'undefined' ? localStorage.getItem('last_client_table_code') : null;
  const { data: orders, isLoading } = useQuery({
    queryKey: ['client-orders-history'],
    queryFn: ordersApi.getAll,
  });

  const historyOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((order: Order) => order.status === 'completed' || order.status === 'cancelled')
      .sort((a: Order, b: Order) => {
        const timeA = a.end_at ? new Date(a.end_at).getTime() : a.start_at ? new Date(a.start_at).getTime() : 0;
        const timeB = b.end_at ? new Date(b.end_at).getTime() : b.start_at ? new Date(b.start_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [orders]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: 'Đã hoàn tất', classes: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { text: 'Đã hủy', classes: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Đang xử lý', classes: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleNavigateOrder = (orderId: number) => {
    navigate(`/client/order/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        historyActive
      />
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử chơi</h1>
              <p className="text-sm text-gray-500 py-2">Kiểm tra các hóa đơn sau khi hoàn tất bàn chơi.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-600">
              Bạn chưa có hóa đơn nào được hoàn tất. Hãy mở bàn và trải nghiệm ngay!
            </div>
          ) : (
            <div className="space-y-4">
              {historyOrders.map((order) => {
                const status = getStatusStyle(order.status);
                return (
                  <div
                    key={order.id}
                    className="rounded-lg border border-gray-100 bg-gray-50/60 p-5 shadow-sm hover:border-blue-200 hover:bg-white transition"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase text-gray-500">Mã đơn</p>
                        <p className="text-lg font-semibold text-gray-900">{order.order_code}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${status.classes}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <p className="text-gray-500">Bàn</p>
                        <p className="font-medium text-gray-900">{order.table?.name || '—'}</p>
                      </div>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      </div>
                      <div>
                        <p className="text-gray-500">Thời gian</p>
                        <p className="font-medium text-gray-900">
                          {order.start_at
                            ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kết thúc</p>
                        <p className="font-medium text-gray-900">
                          {order.end_at
                            ? new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                            : '—'}
                        </p>
                      </div>
                      
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-gray-500 font-bold text-black">Tổng thanh toán: <span className="font-semibold text-gray-900 text-end">{formatCurrency(order.total_paid || order.total_before_discount)}</span></p>
                        
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigateOrder(order.id)}
                        className="w-full sm:w-auto rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


