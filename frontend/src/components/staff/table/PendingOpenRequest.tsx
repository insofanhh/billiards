import type { Order } from '../../../types';

interface Props {
  pendingOrder: Order;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function PendingOpenRequest({ pendingOrder, onApprove, onReject, isApproving, isRejecting }: Props) {
  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="mb-4">
        <p className="text-sm text-yellow-800 font-medium">Có yêu cầu mở bàn từ khách</p>
        {pendingOrder.user_name && (
          <p className="text-xs text-yellow-700 mt-1">Khách: {pendingOrder.user_name}</p>
        )}
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() => onApprove(pendingOrder.id)}
          disabled={isApproving}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isApproving ? 'Đang duyệt...' : 'Duyệt mở bàn'}
        </button>
        <button
          onClick={() => onReject(pendingOrder.id)}
          disabled={isRejecting}
          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isRejecting ? 'Đang xử lý...' : 'Từ chối'}
        </button>
      </div>
    </div>
  );
}
