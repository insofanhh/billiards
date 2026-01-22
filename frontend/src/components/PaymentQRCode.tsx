import React, { useEffect, useState } from 'react';
import { storesApi, type StorePaymentInfo } from '../api/stores';
import { useParams } from 'react-router-dom';

interface PaymentQRCodeProps {
  amount: number;
  referenceCode: string;
}

export const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({ 
  amount, 
  referenceCode
}) => {
  const [timeLeft, setTimeLeft] = useState(600);
  const [paymentInfo, setPaymentInfo] = useState<StorePaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { storeSlug } = useParams<{ storeSlug: string }>();

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!storeSlug) {
        setLoading(false);
        return;
      }

      const info = await storesApi.getPaymentInfo(storeSlug);
      setPaymentInfo(info);
      setLoading(false);
    };

    fetchPaymentInfo();
  }, [storeSlug]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const bankAccount = paymentInfo?.bank_account || "83689318888";
  const bankName = paymentInfo?.bank_name || "TPBank";
  const bankAccountName = paymentInfo?.bank_account_name || "";
  const prefix = "TKPBMS";
  const description = `${prefix} ${referenceCode}`;
  
  const qrUrl = `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${encodeURIComponent(description)}`;

  if (loading) {
    return (
      <div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 dark:border-[#13ec6d] border-t-transparent"></div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
      <h3 className="text-lg font-bold text-center mb-4 text-gray-900 dark:text-white">
        Thanh toán chuyển khoản
      </h3>
      
      <div className="flex justify-center mb-4">
        <img 
          src={qrUrl} 
          alt="QR Code Payment" 
          className="max-w-[280px] w-full border-2 border-gray-200 dark:border-white/20 rounded-lg"
        />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Ngân hàng:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{bankName}</span>
        </div>
        {bankAccountName && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Chủ tài khoản:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{bankAccountName}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Số tài khoản:</span>
          <span className="font-semibold text-lg text-gray-900 dark:text-white">{bankAccount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
          <span className="font-semibold text-blue-600 dark:text-[#13ec6d]">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
          </span>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-500/20">
          <span className="text-sm text-gray-600 dark:text-gray-400">Nội dung CK:</span>
          <span className="font-bold text-red-600 dark:text-red-400 text-base">
            {description}
          </span>
          <span className="text-xs text-red-600 dark:text-red-400 mt-1">
            Nhập chính xác nội dung để tự động xác nhận
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-[#13ec6d] border-t-transparent"></div>
        <span className="text-sm text-blue-800 dark:text-blue-400">
          Đang chờ thanh toán... ({formatTime(timeLeft)})
        </span>
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4 italic">
        * Hệ thống tự động kích hoạt ngay khi nhận được tiền (10-30s)
      </p>
    </div>
  );
};