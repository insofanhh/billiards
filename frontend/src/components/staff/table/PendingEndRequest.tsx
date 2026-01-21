import type { Order } from '../../../types';

interface Props {
  pendingEndOrder: Order;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function PendingEndRequest({ pendingEndOrder, onApprove, onReject, isApproving, isRejecting }: Props) {
  return (
    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 dark:bg-orange-900/10 dark:border-orange-900/30 rounded-lg">
      <div className="mb-4">
        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">Khách hàng đã yêu cầu kết thúc giờ chơi</p>
        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Đơn hàng: {pendingEndOrder.order_code}</p>
        {pendingEndOrder.user_name && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Khách: {pendingEndOrder.user_name}</p>
        )}
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() => onApprove(pendingEndOrder.id)}
          disabled={isApproving}
          className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {isApproving ? 'Đang xử lý...' : 'Duyệt kết thúc giờ chơi'}
        </button>
        <button
          onClick={() => onReject(pendingEndOrder.id)}
          disabled={isRejecting}
          className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {isRejecting ? 'Đang xử lý...' : 'Từ chối'}
        </button>
      </div>
    </div>
  );
}
