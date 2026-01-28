import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import { discountCodesApi } from '../api/discountCodes';

import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';
import { clearClientActiveOrder, isClientOrderContinuable, persistClientActiveOrderFromOrder } from '../utils/clientActiveOrder';

// Hooks
import { useOrderSockets } from '../hooks/useOrderSockets';
import { useOrderActions } from '../hooks/useOrderActions';

// Components
import { ClientOrderInfo } from '../components/client/ClientOrderInfo';
import { ClientOrderBill } from '../components/client/ClientOrderBill';
import { ClientServiceList } from '../components/client/ClientServiceList';
import { ClientPaymentMethods } from '../components/client/ClientPaymentMethods';
import { formatCurrency } from '../utils/format';

export function ClientOrderPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const [showAddService, setShowAddService] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [guestName] = useState(getTemporaryUserName);

  const { data: order, isLoading } = useQuery({
    queryKey: ['client-order', id, slug],
    queryFn: () => ordersApi.getById(Number(id), slug),
    enabled: !!id,
  });

  const { data: services } = useQuery({
    queryKey: ['services', slug],
    queryFn: servicesApi.getAll,
    enabled: !!order?.status && order.status === 'active', // Only fetch services if active
  });

  const { data: savedDiscounts } = useQuery({
    queryKey: ['saved-discounts', slug],
    queryFn: () => discountCodesApi.getSavedDiscounts(slug),
    enabled: !!localStorage.getItem('auth_token') && !!order,
  });

  // Custom Hooks
  useOrderSockets(Number(id), order?.user_id);
  const { 
    requestEndMutation, 
    cancelRequestMutation, 
    paymentMutation, 
    applyDiscountMutation 
  } = useOrderActions(id, slug);

  useEffect(() => {
    if (order?.table?.code) {
      localStorage.setItem('last_client_table_code', order.table.code);
    }
  }, [order?.table?.code]);

  useEffect(() => {
    if (!order) return;
    if (isClientOrderContinuable(order.status)) {
      persistClientActiveOrderFromOrder(order, slug);
    } else {
      clearClientActiveOrder();
    }
  }, [order]);

  useEffect(() => {
    if (order?.applied_discount?.code) {
      setDiscountCodeInput(order.applied_discount.code);
    }
  }, [order?.applied_discount?.code]);

  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const canApplyDiscount = order ? order.total_before_discount > 0 && !hasSuccessfulTransaction : false;

  const handleApplyDiscount = () => {
    if (!canApplyDiscount) return;
    const trimmed = discountCodeInput.trim();
    if (!trimmed) return;
    setDiscountFeedback(null);
    applyDiscountMutation.mutate(trimmed.toUpperCase());
  };

  const handleApplySavedDiscount = (code: string) => {
    if (!canApplyDiscount) return;
    setDiscountCodeInput(code);
    setDiscountFeedback(null);
    applyDiscountMutation.mutate(code.toUpperCase());
  };

  const isDiscountAvailable = (discount: any) => {
    if (!order || !canApplyDiscount) return false;
    const now = new Date();
    if (discount.end_at && new Date(discount.end_at) < now) return false;
    if (discount.start_at && new Date(discount.start_at) > now) return false;
    if (discount.usage_limit && discount.used_count && discount.used_count >= discount.usage_limit) return false;
    if (discount.min_spend && order.total_before_discount < discount.min_spend) return false;
    return true;
  };

  const formatDiscountValue = (discount: any) => {
    if (discount.discount_type === 'percent') {
      return `${discount.discount_value}%`;
    }
    return formatCurrency(discount.discount_value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#13ec6d]"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Không tìm thấy đơn hàng</div>;
  }

  const appliedDiscountLabel = order.applied_discount
    ? order.applied_discount.discount_type === 'percent'
      ? `${order.applied_discount.discount_value}%`
      : formatCurrency(order.applied_discount.discount_value)
    : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate(slug ? `/s/${slug}` : '/client')}
        onHistoryClick={() => navigate(slug ? `/s/${slug}/history` : '/client/history')}
        onVouchersClick={() => navigate(slug ? `/s/${slug}/vouchers` : '/client/vouchers')}
      />
      <div className="max-w-4xl mx-auto py-12 px-4">
        {!hasSuccessfulTransaction ? (
          <>
            {order.status === 'active' && (
              <div className="mb-6 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-5 backdrop-blur-sm transition-colors duration-300">
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="w-full py-2 px-4 border border-blue-600 dark:border-[#13ec6d] text-blue-600 dark:text-[#13ec6d] rounded-xl hover:bg-blue-50 dark:hover:bg-[#13ec6d]/10 transition-colors font-medium"
                >
                  {showAddService ? 'Ẩn danh sách dịch vụ' : 'Gọi thêm dịch vụ'}
                </button>

                {showAddService && (
                  <ClientServiceList orderId={Number(id)} services={services} />
                )}
              </div>
            )}

            <ClientOrderInfo 
              order={order}
              onRequestEnd={() => requestEndMutation.mutate()}
              onCancelRequest={() => cancelRequestMutation.mutate()}
              isRequestingEnd={requestEndMutation.isPending}
              isCancelingRequest={cancelRequestMutation.isPending}
            />

            {/* Service List Section */}
            {order.items && order.items.length > 0 && (
              <div className="mb-6 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-5 backdrop-blur-sm transition-colors duration-300 mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Dịch vụ đã gọi</h3>
                <div className="space-y-2">
                   {/* Simplified rendering for ordered items - could be in a component too but keeping here for now as it's simple usage of mapped data */}
                   {(() => {
                      const sortedItems = [...order.items].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
                      const grouped = sortedItems.reduce((acc: any, item) => {
                          if(!acc[item.service.id]) acc[item.service.id] = [];
                          acc[item.service.id].push(item);
                          return acc;
                      }, {});
                      
                      return Object.values(grouped).map((items: any) => {
                          const first = items[0];
                          const totalQty = items.reduce((sum: number, i: any) => sum + (Number(i.qty)||0), 0);
                          const totalPrice = items.reduce((sum: number, i: any) => sum + (i.total_price || (Number(i.unit_price) * Number(i.qty))), 0);
                          
                          return (
                            <div key={first.service.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/5">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{first.service.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Số lượng: {totalQty}</p>
                                </div>
                                <p className="font-semibold ml-4 text-gray-900 dark:text-white">
                                    {formatCurrency(totalPrice)}
                                </p>
                            </div>
                          );
                      });
                   })()}
                </div>
              </div>
            )}



            {/* Payment & Bill Section for Active/Completed/PendingEnd */}
            {order.status === 'completed' && (
                 <div className="mb-6 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-5 backdrop-blur-sm transition-colors duration-300">
                  {/* Voucher Selection */}
                  {order.total_before_discount > 0 && (
                    <>
                       {savedDiscounts && savedDiscounts.length > 0 && (
                         <div className="mb-4">
                           <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Voucher đã lưu trong ví</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                             {savedDiscounts.map((discount: any) => {
                               const available = isDiscountAvailable(discount);
                               const isApplied = order.applied_discount?.code === discount.code;
                               return (
                                 <button
                                   key={discount.id}
                                   onClick={() => {
                                     if (available && !isApplied) handleApplySavedDiscount(discount.code);
                                   }}
                                   disabled={!available || applyDiscountMutation.isPending || isApplied}
                                   className={`p-3 rounded-xl border text-left transition ${isApplied
                                     ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-500/30 cursor-default'
                                     : available
                                       ? 'border-blue-300 bg-blue-50 dark:bg-[#13ec6d]/10 dark:border-[#13ec6d]/30 hover:bg-blue-100 dark:hover:bg-[#13ec6d]/20 cursor-pointer'
                                       : 'border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 opacity-50 cursor-not-allowed'
                                     }`}
                                 >
                                   <div className="flex items-center justify-between">
                                     <div className="flex-1">
                                       <div className="flex items-center gap-2">
                                         <p className="font-semibold text-sm text-gray-900 dark:text-white">{discount.code}</p>
                                         {isApplied && (
                                           <span className="text-xs bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-400 px-2 py-0.5 rounded">Đang áp dụng</span>
                                         )}
                                       </div>
                                       <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                         Giảm {formatDiscountValue(discount)}
                                         {discount.min_spend && ` • Đơn tối thiểu ${formatCurrency(discount.min_spend)}`}
                                       </p>
                                     </div>
                                   </div>
                                 </button>
                               );
                             })}
                           </div>
                         </div>
                       )}

                       <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Hoặc nhập mã giảm giá</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={discountCodeInput}
                            onChange={(e) => {
                              setDiscountCodeInput(e.target.value.toUpperCase());
                              setDiscountFeedback(null);
                            }}
                            placeholder="Nhập mã (VD: VIP1)"
                            disabled={!canApplyDiscount || applyDiscountMutation.isPending}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-xl uppercase disabled:bg-gray-100 dark:disabled:bg-white/5 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#13ec6d] focus:border-transparent outline-none"
                          />
                          <button
                            onClick={handleApplyDiscount}
                            disabled={!canApplyDiscount || applyDiscountMutation.isPending || discountCodeInput.trim().length === 0}
                            className="px-4 py-2 bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-[#10d863] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {applyDiscountMutation.isPending ? 'Đang áp dụng...' : order.applied_discount ? 'Đổi mã' : 'Áp dụng'}
                          </button>
                        </div>
                        {order.applied_discount && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Đang áp dụng: <span className="font-semibold text-gray-900 dark:text-white">{order.applied_discount.code}</span> ({appliedDiscountLabel})
                          </p>
                        )}
                        {discountFeedback && (
                          <p className={`text-sm mt-2 ${discountFeedback.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {discountFeedback.message}
                          </p>
                        )}
                       </div>
                    </>
                  )}

                  {/* Summary Totals */}
                  {order.total_before_discount > 0 && (
                    <div className="flex justify-between mb-2 text-gray-700 dark:text-gray-300">
                      <span>Tổng trước giảm giá:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.total_before_discount)}
                      </span>
                    </div>
                  )}
                  {order.total_discount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600 dark:text-[#13ec6d]">
                      <span>Giảm giá:</span>
                      <span className="font-semibold">
                        -{formatCurrency(order.total_discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2 text-gray-900 dark:text-white">
                    <span className="text-lg font-bold">Tổng thanh toán:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-[#13ec6d]">
                      {formatCurrency(order.total_paid)}
                    </span>
                  </div>
                  
                  {/* Payment Methods */}
                  <ClientPaymentMethods 
                    order={order} 
                    onPayment={(method) => paymentMutation.mutate({ method, amount: order.total_paid })}
                    isPending={paymentMutation.isPending}
                  />
                 </div>
            )}
          </>
        ) : (
          <>
             <button
               type="button"
               onClick={() => navigate(slug ? `/s/${slug}` : '/client')}
               className="mb-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
             >
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
               <span className="font-medium">Quay lại</span>
             </button>
             <ClientOrderBill order={order} />
          </>
        )}
      </div>
    </div>
  );
}
