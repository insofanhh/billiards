import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName, isGuestUser } from '../utils/temporaryUser';
import { discountCodesApi } from '../api/discountCodes';
import type { DiscountCode } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { ordersApi } from '../api/orders';
import { useClientActiveOrder } from '../hooks/useClientActiveOrder';
import { settingsApi } from '../api/settings';
import {
  clearClientActiveOrder,
  getClientOrderStatusLabel,
  isClientOrderContinuable,
  persistClientActiveOrderFromOrder,
} from '../utils/clientActiveOrder';
import { blogApi } from '../api/blog';

function LatestPosts() {
  const navigate = useNavigate();
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['latest-posts'],
    queryFn: () => blogApi.getPosts({ status: 'published', limit: 3 }),
  });

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}/storage/${path}`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <div className="h-40 bg-gray-200 dark:bg-white/10 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!postsData?.data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 p-6 text-center text-sm text-gray-500 dark:text-white/50">
        <p>Chưa có tin tức nào.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {postsData.data.slice(0, 3).map((post: any) => (
        <div
          key={post.id}
          className="group cursor-pointer rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:hover:shadow-green-900/20 hover:scale-[1.02] dark:hover:bg-white/10"
          onClick={() => navigate(`/blog/${post.id}`)}
        >
          <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
            {post.thumbnail ? (
              <img
                src={getImageUrl(post.thumbnail)}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 dark:text-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-white/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-[#13ec6d]">
                {post.category?.name || 'Tin tức'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.published_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-[#13ec6d] transition-colors">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {post.summary}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

type Highlight = {
  title: string;
  description: string;
};

const highlightCards: Highlight[] = [
  {
    title: 'Quét mã để bắt đầu',
    description: 'Đưa camera tới mã QR trên bàn để mở bàn và tạo yêu cầu phục vụ trong vài giây.',
  },
  {
    title: 'Theo dõi thông báo',
    description: 'Khi quản trị viên đăng thông báo mới, nội dung sẽ xuất hiện tự động tại khu vực bên dưới.',
  },
  {
    title: 'Săn khuyến mãi',
    description: 'Các gói ưu đãi, happy hour hoặc mã giảm giá sẽ được CMS đồng bộ để bạn xem nhanh.',
  },
];

export function ClientHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [guestName] = useState(getTemporaryUserName);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isHandlingScan, setIsHandlingScan] = useState(false);
  const isAuthenticated = !!localStorage.getItem('auth_token');
  const isGuest = isGuestUser();
  const [savingDiscountId, setSavingDiscountId] = useState<number | null>(null);
  const activeOrderSnapshot = useClientActiveOrder();

  useEffect(() => {
    const handleOpenScanner = () => {
      setScanError(null);
      setIsScannerOpen(true);
    };

    window.addEventListener('openScanner', handleOpenScanner);
    return () => {
      window.removeEventListener('openScanner', handleOpenScanner);
    };
  }, []);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: publicDiscounts, isLoading: isLoadingDiscounts } = useQuery({
    queryKey: ['public-discounts'],
    queryFn: discountCodesApi.getPublicDiscounts,
  });

  const { data: bannerImages = [] } = useQuery<string[]>({
    queryKey: ['client-banner-images'],
    queryFn: settingsApi.getBanners,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!bannerImages.length) {
      setCurrentBannerIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const showNextBanner = () => {
    if (!bannerImages.length) return;
    setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
  };

  const showPrevBanner = () => {
    if (!bannerImages.length) return;
    setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const goToBanner = (index: number) => {
    if (!bannerImages.length) return;
    setCurrentBannerIndex((index + bannerImages.length) % bannerImages.length);
  };

  const handleDragStart = (clientX: number) => {
    setDragStartX(clientX);
    setIsDragging(true);
  };

  const handleDragEnd = (clientX: number | null) => {
    if (dragStartX === null) {
      setIsDragging(false);
      return;
    }
    if (clientX !== null) {
      const delta = clientX - dragStartX;
      if (Math.abs(delta) > 40) {
        delta > 0 ? showPrevBanner() : showNextBanner();
      }
    }
    setDragStartX(null);
    setIsDragging(false);
  };

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

  const parseTableCode = (rawValue: string) => {
    if (!rawValue) return null;
    const urlMatch = rawValue.match(/\/client\/table\/([^/?#]+)/i) || rawValue.match(/\/table\/([^/?#]+)/i);
    if (urlMatch?.[1]) {
      return urlMatch[1].toUpperCase();
    }
    const plainMatch = rawValue.match(/^[A-Za-z0-9_-]{2,20}$/);
    if (plainMatch) {
      return plainMatch[0].toUpperCase();
    }
    return null;
  };

  const handleScan = (codes: IDetectedBarcode[]) => {
    if (!codes.length || isHandlingScan) return;
    const rawValue = codes[0]?.rawValue?.trim();
    if (!rawValue) return;

    const tableCode = parseTableCode(rawValue);
    if (!tableCode) {
      setScanError('Không nhận diện được mã bàn. Vui lòng thử lại hoặc nhập tay.');
      return;
    }

    setIsHandlingScan(true);
    setScanError(null);
    localStorage.setItem('last_client_table_code', tableCode);
    setIsScannerOpen(false);
    navigate(`/client/table/${tableCode}`);
    setTimeout(() => setIsHandlingScan(false), 1200);
  };

  const {
    data: activeOrderDetails,
    isFetching: isCheckingActiveOrder,
    isError: isOrderError,
  } = useQuery({
    queryKey: ['client-active-order-banner', activeOrderSnapshot?.orderId],
    queryFn: () => ordersApi.getById(activeOrderSnapshot!.orderId),
    enabled: !!activeOrderSnapshot?.orderId && isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (isOrderError) {
      clearClientActiveOrder();
    }
  }, [isOrderError]);

  useEffect(() => {
    if (!activeOrderSnapshot?.orderId) return;
    if (!activeOrderDetails) return;
    if (isClientOrderContinuable(activeOrderDetails.status)) {
      persistClientActiveOrderFromOrder(activeOrderDetails);
    } else {
      clearClientActiveOrder();
    }
  }, [activeOrderDetails, activeOrderSnapshot?.orderId]);

  const handleResumeOrder = () => {
    if (!activeOrderSnapshot) return;
    navigate(`/client/order/${activeOrderSnapshot.orderId}`);
  };

  const handleScanError = (error: unknown) => {
    console.error(error);
    setScanError('Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc thử lại.');
  };

  const infoSteps = useMemo(
    () => [
      { title: 'Bước 1', description: 'Chọn nút Quét mã QR và cấp quyền camera.' },
      { title: 'Bước 2', description: 'Giữ camera ổn định trước mã QR được dán trên bàn.' },
      { title: 'Bước 3', description: 'Hệ thống sẽ mở trang bàn để bạn yêu cầu mở bàn hoặc gọi thêm dịch vụ.' },
    ],
    []
  );

  const emptyStateCard = (label: string) => (
    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 p-6 text-center text-sm text-gray-500 dark:text-white/50">
      <p>{label}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-white/30">Chờ quản trị viên cập nhật trên CMS.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] text-gray-900 dark:text-white transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        onVouchersClick={() => navigate('/client/vouchers')}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8 space-y-10">
        <section className="rounded-3xl bg-white dark:bg-white/5 px-8 py-10 shadow-xl border border-gray-100 dark:border-white/10 backdrop-blur-sm transition-colors duration-300">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-600 dark:text-[#13ec6d]">Trang khách hàng</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl text-gray-900 dark:text-white">Quét mã QR để mở bàn và nhận thông báo mới nhất</h1>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  Mọi thông điệp, thông báo hoặc ưu đãi từ quản trị viên sẽ xuất hiện tại đây. Bạn chỉ cần một lần quét để
                  bắt đầu trải nghiệm.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setScanError(null);
                    setIsScannerOpen(true);
                  }}
                  className="flex-1 rounded-2xl bg-blue-600 dark:bg-[#13ec6d] px-6 py-3 text-center text-base font-semibold text-white dark:text-zinc-900 shadow-lg shadow-blue-500/20 dark:shadow-green-500/20 transition hover:bg-blue-700 dark:hover:bg-[#10d863]"
                >
                  Quét mã QR bàn
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/client/history')}
                  className="flex-1 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-6 py-3 text-center text-base font-semibold text-gray-900 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Lịch sử của tôi
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {bannerImages.length > 0 ? (
                <div
                  className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/50 backdrop-blur select-none"
                  onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                  onTouchEnd={(event) => handleDragEnd(event.changedTouches[0]?.clientX ?? null)}
                  onMouseDown={(event) => handleDragStart(event.clientX)}
                  onMouseUp={(event) => handleDragEnd(event.clientX)}
                  onMouseLeave={() => isDragging && handleDragEnd(null)}
                >
                  <div
                    className={`flex transition-transform duration-500 ease-out ${isDragging ? 'transition-none' : ''}`}
                    style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
                  >
                    {bannerImages.map((src, index) => (
                      <img
                        key={src}
                        src={src}
                        alt={`Banner ${index + 1}`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        className="h-56 w-full flex-shrink-0 object-cover sm:h-64"
                        draggable={false}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                    {bannerImages.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => goToBanner(index)}
                        className={`h-2.5 w-2.5 rounded-full transition ${index === currentBannerIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                          }`}
                        aria-label={`Chọn banner ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-6 text-center text-sm text-gray-500 dark:text-white/50">
                  Chưa có ảnh banner. Hãy thêm trong CMS để hiển thị tại đây.
                </div>
              )}
            </div>
          </div>
        </section>

        {activeOrderSnapshot && isAuthenticated && (
          <div className="rounded-2xl border border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 px-6 py-4 text-sm text-gray-900 dark:text-white shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm">
            <div>
              <p className="text-base font-semibold text-yellow-800 dark:text-yellow-400">
                Bạn có đơn {activeOrderSnapshot.orderCode ? `#${activeOrderSnapshot.orderCode}` : 'đang mở'} tại{' '}
                {activeOrderSnapshot.tableName || activeOrderSnapshot.tableCode || 'bàn chưa xác định'}.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-300/80">
                Trạng thái: {getClientOrderStatusLabel(activeOrderSnapshot.status)}
                {isCheckingActiveOrder ? ' · Đang cập nhật...' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResumeOrder}
              className="w-full rounded-2xl bg-yellow-400 dark:bg-yellow-500 px-4 py-2 text-sm font-bold text-yellow-900 dark:text-black transition hover:bg-yellow-500 dark:hover:bg-yellow-400 sm:w-auto shadow-lg shadow-yellow-500/20"
            >
              Quay lại bàn
            </button>
          </div>
        )}

        {scanError && (
          <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {scanError}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-3">
          {highlightCards.map((item) => (
            <div key={item.title} className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-[#13ec6d]">Thông tin</p>
              <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-[#13ec6d] py-2">Thông báo</p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tin tức mới nhất</h2>
            </div>
            <a
              href="/blog"
              className="text-sm font-semibold text-blue-600 dark:text-[#13ec6d] hover:text-blue-700 dark:hover:text-[#10d863] flex items-center gap-1 pt-10"
              onClick={(e) => {
                e.preventDefault();
                navigate('/blog');
              }}
            >
              Xem thêm
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>

          <LatestPosts />
        </section>

        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-[#13ec6d] py-2">Khuyến mãi</p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Ưu đãi dành cho bạn</h2>
            </div>
          </div>
          {isLoadingDiscounts ? (
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
          ) : !publicDiscounts || publicDiscounts.length === 0
            ? emptyStateCard('Chưa có ưu đãi nào được thêm.')
            : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicDiscounts.map((discount: DiscountCode) => {
                  const formatDiscountValue = () => {
                    if (discount.discount_type === 'percent') {
                      return `${discount.discount_value}%`;
                    }
                    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.discount_value);
                  };
                  const isSaved = discount.is_saved || false;
                  return (
                    <div key={discount.id} className="group rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:hover:shadow-green-900/20 hover:scale-[1.02] hover:bg-gray-50 dark:hover:bg-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-600 dark:text-[#13ec6d]">VOUCHER</p>
                          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#13ec6d] transition-colors">{discount.code}</h3>
                          {discount.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{discount.description}</p>}
                          <div className="mt-3">
                            <p className="text-sm text-gray-500">Giảm giá</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-[#13ec6d]">{formatDiscountValue()}</p>
                            {discount.min_spend && (
                              <p className="mt-1 text-xs text-gray-500">
                                Đơn tối thiểu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.min_spend)}
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
                                  navigate('/login');
                                } else if (isGuest) {
                                  showNotification('Vui lòng đăng ký thành viên để lưu voucher');
                                  navigate('/register');
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
            )
          }
        </section>

        <section className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-sm backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Hướng dẫn nhanh</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {infoSteps.map((step) => (
              <div key={step.title} className="rounded-2xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-[#13ec6d]">{step.title}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#1a2c24] p-6 shadow-2xl border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsScannerOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 dark:bg-white/10 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Đóng"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quét mã QR bàn</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hãy hướng camera tới mã QR được dán trên bàn.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
              <Scanner
                onScan={handleScan}
                onError={handleScanError}
                scanDelay={300}
                allowMultiple={false}
                constraints={{ facingMode: { ideal: 'environment' } }}
                styles={{
                  container: {
                    width: '100%',
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


