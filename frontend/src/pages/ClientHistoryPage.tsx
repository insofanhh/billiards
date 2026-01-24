import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';
import type { Order } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export function ClientHistoryPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [guestName] = useState(getTemporaryUserName);
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
        return { text: 'Đã hoàn tất', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'cancelled':
        return { text: 'Đã hủy', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      default:
        return { text: 'Đang xử lý', classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  const handleNavigateOrder = (orderId: number) => {
    navigate(`/client/order/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate(slug ? `/s/${slug}` : '/client')}
        onHistoryClick={() => navigate(slug ? `/s/${slug}/history` : '/client/history')}
        onVouchersClick={() => navigate(slug ? `/s/${slug}/vouchers` : '/client/vouchers')}
        historyActive
      />
      <div className="max-w-7xl mx-auto py-10 px-4 lg:px-8 space-y-6">
        <div className="bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-6 backdrop-blur-sm transition-colors duration-300">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử chơi</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Kiểm tra các hóa đơn sau khi hoàn tất bàn chơi.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 dark:border-[#13ec6d]"></div>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">
              Bạn chưa có hóa đơn nào được hoàn tất. Hãy mở bàn và trải nghiệm ngay!
            </div>
          ) : (
            <div className="space-y-4">
              {historyOrders.map((order) => {
                const status = getStatusStyle(order.status);
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 p-5 shadow-sm hover:border-blue-200 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Mã đơn</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{order.order_code}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${status.classes}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Bàn</p>
                        <p className="font-medium text-gray-900 dark:text-white">{order.table?.name || '—'}</p>
                      </div>

                      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Thời gian</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.start_at
                            ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Kết thúc</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.end_at
                            ? new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                            : '—'}
                        </p>
                      </div>

                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold">Tổng thanh toán: <span className="font-semibold text-gray-900 dark:text-[#13ec6d] text-end">{formatCurrency(order.total_paid || order.total_before_discount)}</span></p>

                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigateOrder(order.id)}
                        className="w-full sm:w-auto rounded-xl bg-blue-600 dark:bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 transition hover:bg-blue-700 dark:hover:bg-[#10d863]"
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


