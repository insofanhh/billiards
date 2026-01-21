import { useState, useMemo, useEffect } from 'react';
import type { Order } from '../../types';
import { useStaffOrderActions } from '../../hooks/useStaffOrderActions';
import { formatCurrency } from '../../utils/format';

interface Props {
  order: Order;
  isActive: boolean;
  isPendingEnd: boolean;
  isCompleted: boolean;
  servicesTotal: number;
}

export function StaffOrderBill({ order, isActive, isPendingEnd, isCompleted, servicesTotal }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [discountCodeInput, setDiscountCodeInput] = useState('');

  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    approveEndMutation,
    rejectEndMutation,
    removeServiceMutation,
    confirmBatchMutation,
    paymentMutation,
    confirmPaymentMutation,
    applyDiscountMutation
  } = useStaffOrderActions(String(order.id));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const groupedItems = useMemo(() => {
    if (!order?.items) return [];
    // Sort and Group logic same as before
    const sorted = [...order.items].sort((a: any, b: any) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    const groups: { time: string; items: any[] }[] = [];
    if (sorted.length === 0) return groups;

    let currentGroup = { time: sorted[0].created_at || 'Mới thêm', items: [sorted[0]] };

    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      const lastItem = currentGroup.items[currentGroup.items.length - 1];
      const prevTime = lastItem.created_at ? new Date(lastItem.created_at).getTime() : 0;
      const currTime = item.created_at ? new Date(item.created_at).getTime() : 0;

      if (currTime - prevTime < 60000) {
        currentGroup.items.push(item);
      } else {
        groups.push(currentGroup);
        currentGroup = { time: item.created_at || 'Mới thêm', items: [item] };
      }
    }
    groups.push(currentGroup);
    return groups;
  }, [order?.items]);

  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const pendingTransaction = order?.transactions?.find((t: any) => t.status === 'pending') ?? null;
  const orderCustomerName = order.customer_name || null;
  const currentTotalBeforeDiscount = order.total_before_discount > 0 ? order.total_before_discount : servicesTotal;
  
  const handlePrintBill = () => {
    window.print();
  };

  const handlApplyDiscount = () => {
      const code = discountCodeInput.trim().toUpperCase();
      if(!code) return;
      applyDiscountMutation.mutate(code);
      setDiscountFeedback(null);
  };

  return (

    <div className={`sticky top-8 bg-white p-6 rounded-lg shadow-sm w-full`}>
      <div className={!isActive ? "lg:grid lg:grid-cols-3 lg:gap-8" : ""}>
        
        {/* Left Column: Info & Services */}
        <div className={!isActive ? "lg:col-span-2" : ""}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 text-slate-900">Đơn hàng {order.order_code}</h2>
            <p className="text-slate-600 mb-2">
              Bàn: <span className="font-semibold">{order.table.name}</span>
            </p>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'active'
                ? 'bg-green-100 text-green-800'
                : order.status === 'completed'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-orange-100 text-orange-800'
                }`}
            >
              {order.status === 'active'
                ? 'Đang sử dụng'
                : order.status === 'completed'
                  ? 'Hoàn thành'
                  : 'Chờ xử lý'}
            </span>
          </div>

          {isActive && (
            <button
              onClick={() => approveEndMutation.mutate()}
              disabled={approveEndMutation.isPending}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors mb-4 disabled:opacity-50"
            >
              {approveEndMutation.isPending ? 'Đang xử lý...' : 'Kết thúc bàn'}
            </button>
          )}

          {isPendingEnd && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => approveEndMutation.mutate()}
                className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700"
              >
                Duyệt kết thúc
              </button>
              <button
                onClick={() => rejectEndMutation.mutate()}
                className="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700"
              >
                Từ chối
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500">Bắt đầu</p>
              <p className="font-semibold text-slate-800">
                {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
              </p>
            </div>

            {isActive && order.start_at && (
              <div>
                <p className="text-sm text-slate-500">Đang chơi</p>
                <p className="font-semibold text-green-600 animate-pulse">
                  {(() => {
                    const start = new Date(order.start_at).getTime();
                    const now = currentTime.getTime();
                    const diff = Math.max(0, now - start);
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    return `${hours}h ${minutes}p ${seconds}s`;
                  })()}
                </p>
              </div>
            )}
            {order.end_at && (
              <div>
                <p className="text-sm text-slate-500">Kết thúc</p>
                <p className="font-semibold text-slate-800">
                  {new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </p>
              </div>
            )}
            {order.total_play_time_minutes && (
              <div className="col-span-2">
                <p className="text-sm text-slate-500">Thời gian chơi</p>
                <p className="font-semibold text-slate-800">
                  {Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}p
                </p>
              </div>
            )}
          </div>

          {(orderCustomerName || order.cashier) && (
            <div className="mb-4 text-sm border-t border-slate-200 pt-4">
              {orderCustomerName && (
                <p className="text-slate-600">
                  Khách hàng: <span className="font-semibold text-slate-900">{orderCustomerName}</span>
                </p>
              )}
              {order.cashier && (
                <p className="text-slate-600 pt-2">
                  Thu ngân: <span className="font-semibold text-slate-900">{order.cashier}</span>
                </p>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-bold text-lg mb-4 text-slate-900">Dịch vụ đã chọn</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {groupedItems.map(({ time, items }, index) => {
                const isAllConfirmed = (items as any[]).every((i) => i.is_confirmed);
                const unconfirmedIds = (items as any[]).filter((i) => !i.is_confirmed).map((i) => i.id);

                return (
                  <div key={time} className="mb-6 last:mb-0 border border-slate-200 rounded-lg overflow-hidden">
                    <div
                      className={`px-4 py-3 flex items-center justify-between ${isAllConfirmed ? 'bg-green-100 border-b border-green-200' : 'bg-slate-50 border-b border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {isActive && !isAllConfirmed ? (
                          <button
                            onClick={() => confirmBatchMutation.mutate(unconfirmedIds)}
                            disabled={confirmBatchMutation.isPending}
                            className="w-6 h-6 rounded border border-slate-400 bg-white flex items-center justify-center hover:border-blue-500 text-transparent hover:text-blue-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : (
                          <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className={`font-bold ${isAllConfirmed ? 'text-green-800' : 'text-slate-800'}`}>Order {index + 1}</span>
                      </div>
                      {isAllConfirmed && (
                        <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                          Đã xác nhận
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-4 bg-white">
                      {(() => {
                        const aggregatedItems = (items as any[]).reduce((acc: any[], item) => {
                          const existing = acc.find((i) => i.service.id === item.service.id);
                          if (existing) {
                            existing.qty += item.qty;
                            existing.total_price += Number(item.total_price);
                          } else {
                            acc.push({ ...item, total_price: Number(item.total_price) });
                          }
                          return acc;
                        }, []);

                        return aggregatedItems.map((item) => (
                          <div key={item.service.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-800">{item.service.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-500">Số lượng: {item.qty}</p>
                                {isActive && (
                                  <button
                                    onClick={() => removeServiceMutation.mutate(item.id)}
                                    className="text-red-500 text-xs hover:underline bg-red-50 px-2 py-1 rounded"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-slate-800">
                              {formatCurrency(item.total_price)}
                            </p>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Total & Payment */}
        <div className={!isActive ? "lg:col-span-1" : "mt-6 border-t border-slate-200 pt-6"}>
          <div className="flex justify-between items-center mb-6">
            <p className="font-bold text-lg text-slate-900">Tổng cộng</p>
            <p className="font-bold text-xl text-blue-600">
              {formatCurrency(
                (currentTotalBeforeDiscount - (order.total_discount || 0))
              )}
            </p>
          </div>

          {(isCompleted || isPendingEnd) && (
            <div>
              {order.total_before_discount > 0 && !hasSuccessfulTransaction && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                      placeholder="Mã giảm giá"
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={handlApplyDiscount}
                      className="px-4 py-2 bg-slate-200 rounded-lg text-slate-800"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {discountFeedback && (
                    <p className={`text-sm mt-2 ${discountFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {discountFeedback.message}
                    </p>
                  )}
                  {order.applied_discount && (
                    <p className="text-sm text-gray-600 mt-2">
                      Đang áp dụng: <span className="font-semibold text-gray-900">{order.applied_discount.code}</span>
                    </p>
                  )}
                </div>
              )}

              {!hasSuccessfulTransaction && pendingTransaction && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-center text-yellow-800 font-bold mb-2">
                    Đang chờ xác nhận thanh toán ({pendingTransaction.status === 'pending' ? 'Đang chờ' : pendingTransaction.status})
                  </p>
                  <button
                    onClick={() => confirmPaymentMutation.mutate(pendingTransaction.id)}
                    className="w-full bg-yellow-600 text-white py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors"
                  >
                    Xác nhận đã nhận tiền
                  </button>
                </div>
              )}

              {!hasSuccessfulTransaction && !isPendingEnd && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['cash', 'card', 'mobile'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`py-2 rounded-lg border ${selectedPaymentMethod === method
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600'
                        }`}
                    >
                      {method === 'cash' ? 'Tiền mặt' : method === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                    </button>
                  ))}
                </div>
              )}

              {!hasSuccessfulTransaction && !isPendingEnd && (
                <button
                  onClick={() => paymentMutation.mutate({ method: selectedPaymentMethod, amount: order.total_before_discount - order.total_discount })}
                  disabled={paymentMutation.isPending}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paymentMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
                </button>
              )}

              {hasSuccessfulTransaction && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-center text-green-800 font-bold mb-2">Thanh toán thành công!</p>
                  <button onClick={handlePrintBill} className="w-full bg-blue-600 text-white py-2 rounded-lg">
                    In hóa đơn
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
