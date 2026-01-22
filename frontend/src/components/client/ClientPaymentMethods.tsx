import { useState } from 'react';
import type { Order } from '../../types';
import { PaymentQRCode } from '../PaymentQRCode';

interface Props {
  order: Order;
  onPayment: (method: 'cash' | 'card' | 'mobile') => void;
  isPending: boolean;
}

export function ClientPaymentMethods({ order, onPayment, isPending }: Props) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  
  const hasSuccessfulTransaction = order?.transactions?.some((t: any) => t.status === 'success') ?? false;
  const pendingTransaction = order?.transactions?.find((t: any) => t.status === 'pending') ?? null;
  const canSelectPaymentMethod = !hasSuccessfulTransaction && (!pendingTransaction || !pendingTransaction.method);

  if (hasSuccessfulTransaction) return null;

  return (
    <div className="mb-6">
      {canSelectPaymentMethod && (
        <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Chọn phương thức thanh toán</p>
          <div className="grid gap-3">
            {(['cash', 'card', 'mobile'] as Array<'cash' | 'card' | 'mobile'>).map((method) => (
              <label
                key={method}
                className={`flex flex-1 items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${selectedPaymentMethod === method
                  ? 'border-green-500 dark:border-[#13ec6d] bg-white dark:bg-white/10 shadow'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-green-300 dark:hover:border-[#13ec6d]/50'
                  }`}
              >
                <input
                  type="radio"
                  name="client-payment-method"
                  value={method}
                  checked={selectedPaymentMethod === method}
                  onChange={() => setSelectedPaymentMethod(method)}
                  className="h-4 w-4 text-green-600 dark:text-[#13ec6d] focus:ring-green-500 dark:focus:ring-[#13ec6d] bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {method === 'cash'
                      ? 'Tiền mặt'
                      : method === 'card'
                        ? 'Quẹt thẻ'
                        : 'Chuyển khoản (Mobile)'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {method === 'mobile'
                      ? 'Tự động xác nhận sau khi chuyển khoản'
                      : 'Xác nhận tại quầy với nhân viên'}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={() => onPayment(selectedPaymentMethod)}
            disabled={isPending}
            className="w-full py-3 px-6 bg-green-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-green-700 dark:hover:bg-[#10d863] disabled:opacity-50 shadow-lg shadow-green-500/20 transition-all"
          >
            {isPending ? 'Đang xử lý...' : selectedPaymentMethod === 'mobile' ? 'Thanh toán chuyển khoản' : 'Xác nhận thanh toán'}
          </button>
        </div>
      )}

      {pendingTransaction && pendingTransaction?.method && !hasSuccessfulTransaction && (
        <>
          {pendingTransaction.method === 'mobile' && 'reference' in pendingTransaction ? (
            <div className="mt-4">
              <PaymentQRCode 
                amount={pendingTransaction.amount}
                referenceCode={pendingTransaction.reference}
              />
            </div>
          ) : pendingTransaction.method === 'mobile' ? (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <p className="text-blue-800 dark:text-blue-400 font-medium text-center">Đang tạo mã thanh toán...</p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-lg">
              <p className="text-orange-800 dark:text-orange-400 font-medium text-center">Đang chờ nhân viên xác nhận thanh toán...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}