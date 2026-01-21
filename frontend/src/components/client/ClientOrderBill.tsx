import type { Order, OrderItem } from '../../types';
import { formatCurrency } from '../../utils/format';

interface Props {
  order: Order;
}

export function ClientOrderBill({ order }: Props) {
  const sortedItems = [...(order.items || [])].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });

  const groupedItems = sortedItems.reduce((acc: Record<number, OrderItem[]>, item) => {
    const serviceId = item.service.id;
    if (!acc[serviceId]) {
      acc[serviceId] = [];
    }
    acc[serviceId].push(item);
    return acc;
  }, {});

  const orderCustomerName = order.customer_name || null;

  return (
    <div id="client-bill" className="bg-white rounded-lg shadow-md p-8 border-2 border-green-200">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-900">HÓA ĐƠN</h3>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Mã đơn hàng:</span>
          <span className="font-semibold">{order.order_code}</span>
        </div>
        {order.cashier && (
          <div className="flex justify-between text-gray-600">
            <span>Thu ngân:</span>
            <span className="font-semibold text-gray-900">{order.cashier}</span>
          </div>
        )}
        {orderCustomerName && (
          <div className="flex justify-between">
            <span className="text-gray-600">Khách hàng:</span>
            <span className="font-semibold">{orderCustomerName}</span>
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
            <span>{Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}p</span>
          </div>
        )}
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-gray-700">Dịch vụ:</h4>
          <div className="space-y-1">
            {Object.values(groupedItems).map((items) => {
              const firstItem = items[0];
              if (!firstItem) return null;

              const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
              const totalPrice = items.reduce((sum, item) => {
                if (!item.total_price && item.total_price !== 0) {
                  return sum + ((Number(item.unit_price) || 0) * (Number(item.qty) || 0));
                }
                return sum + (Number(item.total_price) || 0);
              }, 0);

              return (
                <div key={firstItem.service.id} className="flex justify-between text-sm">
                  <span>{firstItem.service.name} x{totalQty}</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-gray-300 pt-3 space-y-2">
        {order.total_before_discount > 0 && (
          <div className="flex justify-between">
            <span>Tổng trước giảm giá:</span>
            <span>{formatCurrency(order.total_before_discount)}</span>
          </div>
        )}
        {order.total_discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá:</span>
            <span>-{formatCurrency(order.total_discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
          <span>Tổng thanh toán:</span>
          <span className="text-green-600">{formatCurrency(order.total_paid)}</span>
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
  );
}
