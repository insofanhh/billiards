import { useState, useMemo, useEffect } from 'react';
import type { Order } from '../../types';
import { useStaffOrderActions } from '../../hooks/useStaffOrderActions';
import { formatCurrency } from '../../utils/format';
import { OrderDuration } from '../common/OrderDuration';

interface Props {
  order: Order;
  isActive: boolean;
  isPendingEnd: boolean;
  isCompleted: boolean;
  servicesTotal: number;
  slug?: string;
}

// Internal component for deletable row
function DeletableServiceRow({ item, isActive, onDelete }: { item: any, isActive: boolean, onDelete: (qty: number) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [deleteQty, setDeleteQty] = useState(1);
    
    // Reset when item qty changes (e.g. after delete)
    useEffect(() => {
        if(deleteQty > item.qty) setDeleteQty(1);
    }, [item.qty]);

    return (
        <div 
            className={`p-4 transition-all duration-200 border-b border-slate-100 dark:border-gray-700 last:border-0 ${!item.is_confirmed ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
        >
            <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => isActive && setIsExpanded(!isExpanded)}
            >
                <div>
                     <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 dark:text-white">{item.name}</p>
                        {!item.is_confirmed && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                Mới
                            </span>
                        )}
                    </div>
                     <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-slate-500 dark:text-gray-400">
                            Số lượng: <span className="font-bold text-slate-700 dark:text-gray-300">
                                {(() => {
                                    const unconfirmedCount = item.unconfirmedQty;
                                    const confirmedCount = item.qty - unconfirmedCount;

                                    if (unconfirmedCount > 0) {
                                        if (confirmedCount > 0) {
                                            return (
                                                <span>
                                                    {confirmedCount} + <span className="text-orange-500">{unconfirmedCount} mới</span>
                                                </span>
                                            );
                                        } else {
                                            return <span className="text-orange-500">{unconfirmedCount} mới</span>;
                                        }
                                    }
                                    return item.qty;
                                })()}
                            </span>
                        </p>
                    </div>
                </div>
                
                {/* Price (Always visible unless fully replaced by expanded UI? No, let's keep price or hide it) 
                    Design request: "Dưới button xóa có tăng giảm số lượng". Implies a side panel or reveal.
                    Let's just hide Price when expanded to make room for controls if needed, 
                    OR keep Price and put controls below. 
                    Let's put controls on the right side when expanded.
                */}
                {!isExpanded ? (
                    <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white text-base">
                            {formatCurrency(item.total_price)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500">
                            {formatCurrency(item.unit_price)} / món
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="mr-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            Hủy
                        </button>
                    </div>
                )}
            </div>

            {/* Expandable Delete Section */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <div className="flex items-center justify-end gap-3 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg" onClick={e => e.stopPropagation()}>
                    <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Xóa:</span>
                    
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                        <button 
                            onClick={() => setDeleteQty(Math.max(1, deleteQty - 1))}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            -
                        </button>
                        <span className="w-8 text-center font-bold text-slate-800 dark:text-white text-sm">{deleteQty}</span>
                        <button 
                            onClick={() => setDeleteQty(Math.min(item.qty, deleteQty + 1))}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            +
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            onDelete(deleteQty);
                            setIsExpanded(false);
                            setDeleteQty(1);
                        }}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors text-sm font-bold shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

export function StaffOrderBill({ order, isActive, isPendingEnd, isCompleted, servicesTotal, slug }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'mobile' | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState('');

  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    approveEndMutation,
    rejectEndMutation,
    removeServiceMutation,
    updateServiceMutation,
    confirmBatchMutation,
    paymentMutation,
    confirmPaymentMutation,
    applyDiscountMutation,
    removeDiscountMutation
  } = useStaffOrderActions(String(order.id), slug);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Reduce update frequency for price calculation
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (order?.applied_discount?.code) {
      setDiscountCodeInput(order.applied_discount.code);
    }
  }, [order?.applied_discount?.code]);

  const { aggregatedServices, unconfirmedItemIds, itemsTotal } = useMemo(() => {
    if (!order?.items) return { aggregatedServices: [], unconfirmedItemIds: [], itemsTotal: 0 };

    const sorted = [...order.items].sort((a: any, b: any) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    const map = new Map<string, { 
        service: any | null, 
        name: string,
        qty: number, 
        total_price: number,
        ids: number[], 
        items: { id: number; qty: number; is_confirmed: boolean }[],
        unconfirmedIds: number[],
        unconfirmedQty: number,
        is_confirmed: boolean,
        unit_price: number 
    }>();

    const allUnconfirmedIds: number[] = [];
    let grandTotal = 0;

    sorted.forEach((item: any) => {
        grandTotal += Number(item.total_price);

        if (!item.is_confirmed) {
            allUnconfirmedIds.push(item.id);
        }

        const key = item.service ? `s_${item.service.id}` : `c_${item.name}_${item.unit_price}`;

        const existing = map.get(key);
        if (existing) {
            existing.qty += item.qty;
            existing.total_price += Number(item.total_price);
            existing.ids.push(item.id);
            existing.items.push({ id: item.id, qty: item.qty, is_confirmed: item.is_confirmed });
            if (!item.is_confirmed) {
                existing.unconfirmedIds.push(item.id);
                existing.unconfirmedQty += item.qty;
            }
            existing.is_confirmed = existing.is_confirmed && item.is_confirmed; 
        } else {
            map.set(key, {
                service: item.service,
                name: item.service?.name ?? item.name ?? 'Custom Item',
                qty: item.qty,
                total_price: Number(item.total_price),
                ids: [item.id],
                items: [{ id: item.id, qty: item.qty, is_confirmed: item.is_confirmed }],
                unconfirmedIds: !item.is_confirmed ? [item.id] : [],
                unconfirmedQty: !item.is_confirmed ? item.qty : 0,
                is_confirmed: item.is_confirmed,
                unit_price: Number(item.unit_price) // Store unit price for display
            });
        }
    });

    return { 
        aggregatedServices: Array.from(map.values()), 
        unconfirmedItemIds: allUnconfirmedIds,
        itemsTotal: grandTotal
    };
  }, [order?.items]);

  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const pendingTransaction = order?.transactions?.find((t: any) => t.status === 'pending') ?? null;
  const orderCustomerName = order.customer_name || null;

  // Calculate Live Table Cost (Provisional)
  const liveTableCost = useMemo(() => {
    if (!isActive || !order.start_at || !order.price_rate) return 0;
    
    let dateStr = order.start_at;
    // Fix for SQL format without timezone (assume +07:00 / Asia/Ho_Chi_Minh)
    if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
            dateStr = dateStr.replace(' ', 'T') + '+07:00';
    }
    
    const start = new Date(dateStr).getTime();
    const now = currentTime.getTime();
    const diffHours = Math.max(0, now - start) / (1000 * 60 * 60);
    return diffHours * Number(order.price_rate.price_per_hour);
  }, [currentTime, order.start_at, order.price_rate, isActive]);

  // Calculate Merged Fees Total
  const mergedFeesTotal = useMemo(() => {
    return order.merged_table_fees?.reduce((sum: number, fee: any) => sum + Number(fee.total_price), 0) || 0;
  }, [order.merged_table_fees]);

  // Use Live Total if Active, otherwise backend total
  const currentTotalBeforeDiscount = isActive 
    ? (itemsTotal + liveTableCost + mergedFeesTotal) 
    : (order.total_before_discount > 0 ? order.total_before_discount : servicesTotal);
  
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

    <div className={`sticky top-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm w-full border border-gray-100 dark:border-gray-700`}>
      <div className={!isActive ? "lg:grid lg:grid-cols-3 lg:gap-8" : ""}>
        
        {/* Left Column: Info & Services */}
        <div className={!isActive ? "lg:col-span-2" : ""}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Đơn hàng {order.order_code}</h2>
            <p className="text-slate-600 dark:text-gray-400 mb-2">
              Bàn: <span className="font-semibold">{order.table.name}</span>
            </p>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : order.status === 'completed'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
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
              <p className="text-sm text-slate-500 dark:text-gray-400">Bắt đầu</p>
              <p className="font-semibold text-slate-800 dark:text-gray-200">
                {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
              </p>
            </div>

            {isActive && order.start_at && (
              <div>
                <p className="text-sm text-slate-500 dark:text-gray-400">Đang chơi</p>
                <OrderDuration startAt={order.start_at} isActive={isActive} />
              </div>
            )}
            {order.end_at && (
              <div>
                <p className="text-sm text-slate-500 dark:text-gray-400">Kết thúc</p>
                <p className="font-semibold text-slate-800 dark:text-gray-200">
                  {new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </p>
              </div>
            )}
            {(order.total_play_time_minutes !== null && order.total_play_time_minutes !== undefined) && (
              <>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Thời gian chơi</p>
                  <p className="font-semibold text-slate-800 dark:text-gray-200">
                    {Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}p
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Số tiền</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(isActive ? liveTableCost : Math.max(0, order.total_before_discount - itemsTotal - mergedFeesTotal))}
                  </p>
                </div>
              </>
            )}

            {/* Merge Table Fees */}
            {order.merged_table_fees?.map((fee: any) => {
                const start = new Date(fee.start_at);
                const end = new Date(fee.end_at);
                const diff = Math.abs(end.getTime() - start.getTime());
                const totalMinutes = Math.floor(diff / (1000 * 60));
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                
                const displayName = `Gộp: ${fee.table_name}`;
                const durationStr = `${h}h ${m}p`;
                const price = fee.total_price;

                return (
                    <div key={fee.id} className="col-span-2 flex justify-between items-center py-2 border-t border-dashed border-slate-200 dark:border-gray-700 mt-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                                {displayName}
                            </span>
                             <span className="text-xs text-slate-500 dark:text-gray-400">
                                Thời gian: {durationStr}
                             </span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">
                            {formatCurrency(price)}
                        </span>
                    </div>
                );
            })}
          </div>

          {(orderCustomerName || order.cashier) && (
            <div className="mb-4 text-sm border-t border-slate-200 dark:border-gray-700 pt-4">
              {orderCustomerName && (
                <p className="text-slate-600 dark:text-gray-400 mb-2">
                  Khách hàng: <span className="font-semibold text-slate-900 dark:text-white">{orderCustomerName}</span>
                </p>
              )}
              {order.cashier && (
                <p className="text-slate-600 dark:text-gray-400">
                  Thu ngân: <span className="font-semibold text-slate-900 dark:text-white">{order.cashier}</span>
                </p>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-slate-900 dark:text-white">Dịch vụ đã chọn</h3>
               {isActive && unconfirmedItemIds.length > 0 && (
                 <button
                   onClick={() => confirmBatchMutation.mutate(unconfirmedItemIds)}
                   disabled={confirmBatchMutation.isPending}
                   className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 animate-pulse"
                 >
                   {confirmBatchMutation.isPending ? 'Đang xử lý...' : `Xác nhận món mới (${unconfirmedItemIds.length})`}
                 </button>
               )}
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden divide-y divide-slate-100 dark:divide-gray-700">
                    {aggregatedServices.length === 0 ? (
                        <p className="p-4 text-center text-gray-500 text-sm">Chưa có dịch vụ nào</p>
                    ) : (
                        aggregatedServices.map((item) => (
                                <DeletableServiceRow 
                                    key={item.service ? item.service.id : `custom-${item.name}`} 
                                    item={item} 
                                    isActive={isActive}
                                    onDelete={(qty) => {
                                        let remaining = qty;
                                        // Work backwards from newest items
                                        const itemsReversed = [...item.items].reverse();
                                        
                                        for (const row of itemsReversed) {
                                            if (remaining <= 0) break;
                                            
                                            if (row.qty <= remaining) {
                                                // Delete full row
                                                removeServiceMutation.mutate(row.id);
                                                remaining -= row.qty;
                                            } else {
                                                // Partial update
                                                updateServiceMutation.mutate({ itemId: row.id, qty: row.qty - remaining });
                                                remaining = 0;
                                            }
                                        }
                                    }}
                                />
                        ))
                    )}
                </div>
            </div>
          </div>
        </div>
    
            {/* Right Column: Total & Payment */}
            <div className={!isActive ? "lg:col-span-1" : "mt-6 border-t border-slate-200 dark:border-gray-700 pt-6"}>
              {/* ... (rest of the file remains unchanged, just ensuring context matches) */}
          <div className="flex justify-between items-center mb-6">
            <p className="font-bold text-lg text-slate-900 dark:text-white">Tổng cộng</p>
            <p className="font-bold text-xl text-blue-600 dark:text-blue-400">
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
                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      onClick={handlApplyDiscount}
                      className="px-4 py-2 bg-slate-200 rounded-lg text-slate-800 dark:bg-gray-700 dark:text-white hover:bg-slate-300 dark:hover:bg-gray-600"
                    >
                      {applyDiscountMutation.isPending ? 'Đang xử lý...' : order.applied_discount ? 'Đổi mã' : 'Áp dụng'}
                    </button>
                    {order.applied_discount && (
                      <button
                        onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn hủy mã giảm giá này?')) {
                            removeDiscountMutation.mutate();
                            setDiscountCodeInput('');
                          }
                        }}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400"
                        disabled={removeDiscountMutation.isPending}
                        title="Hủy mã giảm giá"
                      >
                         {removeDiscountMutation.isPending ? '...' : 'Hủy'}
                      </button>
                    )}
                  </div>
                  {discountFeedback && (
                    <p className={`text-sm mt-2 ${discountFeedback.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {discountFeedback.message}
                    </p>
                  )}
                  {order.applied_discount && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Đang áp dụng: <span className="font-semibold text-gray-900 dark:text-white">{order.applied_discount.code}</span>
                    </p>
                  )}
                </div>
              )}

              {!hasSuccessfulTransaction && pendingTransaction && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                  <p className="text-center text-yellow-800 dark:text-yellow-200 font-bold mb-2">
                    Khách hàng thanh toán bằng ({
                      pendingTransaction.method 
                        ? (pendingTransaction.method === 'cash' ? 'Tiền mặt' : pendingTransaction.method === 'card' ? 'Thẻ' : 'Chuyển khoản')
                        : 'Chưa chọn'
                    })
                  </p>
                  <button
                    onClick={() => confirmPaymentMutation.mutate(pendingTransaction.id)}
                    disabled={confirmPaymentMutation.isPending || !pendingTransaction.method}
                    className="w-full bg-yellow-600 text-white py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmPaymentMutation.isPending && (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {confirmPaymentMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận đã nhận tiền'}
                  </button>
                </div>
              )}

              {/* Payment Section - Gray out if pending transaction has method (Customer selected) */}
              <div className={`transition-opacity duration-200 ${pendingTransaction?.method ? 'opacity-50 hover:opacity-100' : ''}`}>
                  {!hasSuccessfulTransaction && !isPendingEnd && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(['cash', 'card', 'mobile'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setSelectedPaymentMethod(method)}
                          className={`py-2 rounded-lg border transition-colors ${selectedPaymentMethod === method
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500'
                            : 'border-slate-200 text-slate-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          {method === 'cash' ? 'Tiền mặt' : method === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                        </button>
                      ))}
                    </div>
                  )}

                  {!hasSuccessfulTransaction && !isPendingEnd && (
                    <button
                      onClick={() => paymentMutation.mutate({ method: selectedPaymentMethod!, amount: order.total_before_discount - (order.total_discount || 0) })}
                      disabled={paymentMutation.isPending || !selectedPaymentMethod}
                      className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {paymentMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
                    </button>
                  )}
              </div>

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
