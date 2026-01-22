import type { Order } from '../../types';
import { TableTimer } from '../TableTimer';

interface Props {
  order: Order;
  onRequestEnd?: () => void;
  onCancelRequest?: () => void;
  isRequestingEnd: boolean;
  isCancelingRequest: boolean;
}

export function ClientOrderInfo({ 
  order, 
  onRequestEnd, 
  onCancelRequest,
  isRequestingEnd,
  isCancelingRequest
}: Props) {
  return (
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

      {order.status === 'active' && onRequestEnd && (
        <div className="mb-6">
          <button
            onClick={onRequestEnd}
            disabled={isRequestingEnd}
            className="w-full py-3 px-6 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
          >
            {isRequestingEnd ? 'Đang gửi yêu cầu...' : 'Kết thúc giờ chơi'}
          </button>
        </div>
      )}

      {order.status === 'pending_end' && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-xl">
          <p className="text-orange-800 dark:text-orange-400 font-medium">Yêu cầu kết thúc giờ chơi đã được gửi. Vui lòng đợi nhân viên xác nhận.</p>
        </div>
      )}

      {order.status === 'pending' && onCancelRequest && (
        <div className="mb-6 space-y-3">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl">
            <p className="text-yellow-800 dark:text-yellow-400 font-medium">Yêu cầu mở bàn đang chờ nhân viên duyệt.</p>
          </div>
          <button
            onClick={onCancelRequest}
            disabled={isCancelingRequest}
            className="w-full py-3 px-6 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
          >
            {isCancelingRequest ? 'Đang hủy yêu cầu...' : 'Hủy yêu cầu mở bàn'}
          </button>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl">
          <p className="text-red-800 dark:text-red-400 font-medium">Yêu cầu mở bàn đã bị hủy. Vui lòng tạo yêu cầu mới nếu bạn vẫn muốn chơi.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bắt đầu</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}
          </p>
          {order.start_at && order.status === 'active' && (
            <div className="flex items-center text-red-500 dark:text-red-400 font-mono text-sm mt-2">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <TableTimer startTime={order.start_at} />
            </div>
          )}
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
    </div>
  );
}
