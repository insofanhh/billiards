import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountCodesApi } from '../api/discountCodes';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName, isGuestUser } from '../utils/temporaryUser';
import type { DiscountCode } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export function VoucherWalletPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [guestName] = useState(getTemporaryUserName);

  const { data: savedDiscounts, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['saved-discounts'],
    queryFn: discountCodesApi.getSavedDiscounts,
    enabled: !!localStorage.getItem('auth_token'),
  });

  const { data: publicDiscounts, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['public-discounts'],
    queryFn: () => discountCodesApi.getPublicDiscounts(),
  });

  const saveMutation = useMutation({
    mutationFn: discountCodesApi.saveDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['public-discounts'] });
      showNotification('Đã lưu voucher vào ví');
    },
    onError: (error: any) => {
      if (error?.response?.data?.requires_registration) {
        showNotification('Vui lòng đăng ký thành viên để lưu voucher vào ví');
        navigate('/register');
      } else {
        showNotification(error?.response?.data?.message || 'Không thể lưu voucher');
      }
    },
  });


  const isAuthenticated = !!localStorage.getItem('auth_token');
  const isGuest = isGuestUser();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const shouldRedirect = !token || isGuest;

    if (shouldRedirect) {
      navigate(`/login?redirect=${encodeURIComponent('/client/vouchers')}`);
    }
  }, [isGuest, navigate]);

  const formatDiscountValue = (discount: DiscountCode) => {
    if (discount.discount_type === 'percent') {
      return `${discount.discount_value}%`;
    }
    return formatCurrency(discount.discount_value);
  };

  const isExpired = (discount: DiscountCode) => {
    if (!discount.end_at) return false;
    return new Date(discount.end_at) < new Date();
  };

  const isNotStarted = (discount: DiscountCode) => {
    if (!discount.start_at) return false;
    return new Date(discount.start_at) > new Date();
  };

  const isAvailable = (discount: DiscountCode) => {
    if (discount.usage_limit && discount.used_count && discount.used_count >= discount.usage_limit) {
      return false;
    }
    return !isExpired(discount) && !isNotStarted(discount);
  };

  const renderDiscountCard = (discount: DiscountCode, isSaved: boolean = false) => {
    const available = isAvailable(discount);
    const expired = isExpired(discount);
    const notStarted = isNotStarted(discount);

    return (
      <div
        key={discount.id}
        className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${available
          ? 'border-blue-200 dark:border-white/10 bg-white dark:bg-white/5'
          : 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 opacity-75'
          }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-blue-600 dark:text-[#13ec6d]">VOUCHER</p>
              {expired && <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">Hết hạn</span>}
              {notStarted && <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-700 dark:text-yellow-400">Chưa bắt đầu</span>}
              {!available && !expired && !notStarted && (
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">Hết lượt</span>
              )}
            </div>
            {/* <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{discount.code}</h3> */}
            {discount.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{discount.description}</p>}
            <div className="mt-3 flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Giảm giá</p>
                <p className="text-lg font-bold text-blue-600 dark:text-[#13ec6d]">{formatDiscountValue(discount)}</p>
              </div>
            </div>

            <div className="flex  justify-between">
              {discount.min_spend && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Đơn tối thiểu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.min_spend)}
                </p>
              )}
              {discount.end_at && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  HSD: {new Date(discount.end_at).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>

          </div>
          {isAuthenticated && (
            <div className="ml-4">
              {isSaved ? (
                <button
                  onClick={() => {
                    navigate('/client');
                    setTimeout(() => {
                      const event = new CustomEvent('openScanner');
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  disabled={!available}
                  className="rounded-lg border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-600 dark:text-[#13ec6d] transition hover:bg-green-100 dark:hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sử dụng ngay
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (isGuest) {
                      showNotification('Vui lòng đăng ký thành viên để lưu và sử dụng voucher');
                      navigate('/register');
                    } else {
                      saveMutation.mutate(discount.id);
                    }
                  }}
                  disabled={saveMutation.isPending || !available}
                  className="rounded-lg bg-blue-600 dark:bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 transition hover:bg-blue-700 dark:hover:bg-[#10d863] disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        onVouchersClick={() => navigate('/client/vouchers')}
        vouchersActive
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ví voucher</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Quản lý các voucher đã lưu và khám phá voucher mới</p>
        </div>

        {isAuthenticated && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Voucher đã lưu</h2>
            {isLoadingSaved ? (
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center text-gray-500 dark:text-gray-400">
                Đang tải...
              </div>
            ) : savedDiscounts && savedDiscounts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedDiscounts.map((discount) => renderDiscountCard(discount, true))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Chưa có voucher nào được lưu.</p>
                <p className="mt-1 text-xs text-gray-400">Lưu voucher từ danh sách bên dưới để sử dụng sau.</p>
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Voucher khuyến mãi</h2>
          {isLoadingPublic ? (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center text-gray-500 dark:text-gray-400">
              Đang tải...
            </div>
          ) : publicDiscounts && publicDiscounts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicDiscounts.map((discount) => renderDiscountCard(discount, discount.is_saved))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Chưa có voucher khuyến mãi nào.</p>
              <p className="mt-1 text-xs text-gray-400">Chờ quản trị viên cập nhật trên CMS.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

