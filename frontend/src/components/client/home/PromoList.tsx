import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountCodesApi } from '../../../api/discountCodes';
import type { DiscountCode } from '../../../types';
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { isGuestUser } from '../../../utils/temporaryUser';
import { formatCurrency } from '../../../utils/format';

interface PromoListProps {
    slug?: string;
}

export function PromoList({ slug }: PromoListProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();
    const isAuthenticated = !!localStorage.getItem('auth_token');
    const isGuest = isGuestUser();
    const [savingDiscountId, setSavingDiscountId] = useState<number | null>(null);

    const { data: publicDiscounts, isLoading: isLoadingDiscounts } = useQuery({
        queryKey: ['public-discounts', slug],
        queryFn: () => discountCodesApi.getPublicDiscounts(slug),
        enabled: !!slug,
    });

    const saveMutation = useMutation({
        mutationFn: (discountId: number) => discountCodesApi.saveDiscount(discountId),
        onMutate: (discountId: number) => {
            setSavingDiscountId(discountId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['public-discounts'] });
            queryClient.invalidateQueries({ queryKey: ['saved-discounts'] });
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
        onSettled: () => {
            setSavingDiscountId(null);
        },
    });

    const emptyStateCard = (label: string) => (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 p-6 text-center text-sm text-gray-500 dark:text-white/50">
            <p>{label}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/30">Chờ quản trị viên cập nhật trên CMS.</p>
        </div>
    );

    if (isLoadingDiscounts) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
                        <div className="flex justify-between">
                            <div className="flex-1 space-y-3">
                                <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
                                <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded"></div>
                                <div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded"></div>
                                <div className="pt-2 space-y-2">
                                    <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-white/10 rounded"></div>
                                </div>
                            </div>
                            <div className="h-8 w-16 bg-gray-200 dark:bg-white/10 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!publicDiscounts || !Array.isArray(publicDiscounts) || publicDiscounts.length === 0) {
        return emptyStateCard('Chưa có ưu đãi nào được thêm.');
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicDiscounts.map((discount: DiscountCode) => {
                const discountValueDisplay = discount.discount_type === 'percent'
                    ? `${discount.discount_value}%`
                    : formatCurrency(discount.discount_value);

                const isSaved = discount.is_saved || false;
                return (
                    <div key={discount.id} className="group rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:hover:shadow-green-900/20 hover:scale-[1.02] hover:bg-gray-50 dark:hover:bg-white/10">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-blue-600 dark:text-[#13ec6d]">VOUCHER</p>
                                {/* <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#13ec6d] transition-colors">{discount.code}</h3> */}
                                {discount.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{discount.description}</p>}
                                <div className="mt-3">
                                    <p className="text-sm text-gray-500">Giảm giá</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-[#13ec6d]">{discountValueDisplay}</p>
                                    {discount.min_spend && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Đơn tối thiểu: {formatCurrency(discount.min_spend)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!isSaved && (
                                <div className="ml-4">
                                    <button
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                showNotification('Vui lòng đăng nhập để lưu voucher');
                                                navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                                            } else if (isGuest) {
                                                showNotification('Vui lòng đăng ký thành viên để lưu voucher');
                                                navigate(`/register?redirect=${encodeURIComponent(window.location.pathname)}`);
                                            } else {
                                                saveMutation.mutate(discount.id);
                                            }
                                        }}
                                        disabled={saveMutation.isPending}
                                        className="rounded-lg bg-blue-600 dark:bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 transition hover:bg-blue-700 dark:hover:bg-[#10d863] disabled:opacity-50"
                                    >
                                        {saveMutation.isPending && savingDiscountId === discount.id ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                            )}
                            {isSaved && (
                                <div className="ml-4">
                                    <span className="rounded-lg border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-700 dark:text-[#13ec6d]">
                                        Đã lưu
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
