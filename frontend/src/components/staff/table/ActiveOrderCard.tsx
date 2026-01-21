import type { Order } from '../../../types';

interface Props {
  activeOrder: Order | null | undefined;
}

export function ActiveOrderCard({ activeOrder }: Props) {
  if (!activeOrder) return null;

  const hasPendingPaymentOrder = activeOrder.status === 'completed';

  return (
    <div className={`mb-6 p-4 rounded-lg border ${hasPendingPaymentOrder 
      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30' 
      : 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30'}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className={`text-sm font-medium ${hasPendingPaymentOrder 
            ? 'text-yellow-700 dark:text-yellow-400' 
            : 'text-blue-600 dark:text-blue-400'}`}>
            {hasPendingPaymentOrder ? 'Đơn hàng chờ thanh toán' : 'Đơn hàng đang diễn ra'}
          </p>
          <p className={`text-sm mt-1 ${hasPendingPaymentOrder 
            ? 'text-yellow-900 dark:text-yellow-200' 
            : 'text-blue-800 dark:text-blue-200'}`}>
            {activeOrder.order_code}
          </p>
          {activeOrder.start_at && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Bắt đầu: {new Date(activeOrder.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
          )}
          {hasPendingPaymentOrder && (
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Bàn sẽ mở lại sau khi xác nhận thanh toán.</p>
          )}
        </div>
      </div>
    </div>
  );
}
