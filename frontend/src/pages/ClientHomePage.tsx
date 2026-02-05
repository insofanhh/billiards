import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { ClientNavigation } from '../components/ClientNavigation';
import { TenantRegistrationForm } from '../components/TenantRegistrationForm';
import { SupportWidget } from '../components/SupportWidget';
import { getTemporaryUserName } from '../utils/temporaryUser';
import { ordersApi } from '../api/orders';
import { useClientActiveOrder } from '../hooks/useClientActiveOrder';
import {
  clearClientActiveOrder,
  getClientOrderStatusLabel,
  isClientOrderContinuable,
  persistClientActiveOrderFromOrder,
} from '../utils/clientActiveOrder';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

// New Components
import { LatestPosts } from '../components/blog/LatestPosts';
import { BannerSlider } from '../components/client/home/BannerSlider';
import { PromoList } from '../components/client/home/PromoList';
import { InfoSection } from '../components/client/home/InfoSection';
import { storesApi } from '../api/stores';
import { settingsApi } from '../api/settings';

import { NotFoundPage } from './NotFoundPage';

export function TenantHomePage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [guestName] = useState(getTemporaryUserName);
  
  const { data: store, isError } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: () => storesApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });



  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isHandlingScan, setIsHandlingScan] = useState(false);
  const isAuthenticated = !!localStorage.getItem('auth_token');
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
    const targetSlug = activeOrderSnapshot.storeSlug || slug;
    navigate(targetSlug ? `/s/${targetSlug}/order/${activeOrderSnapshot.orderId}` : `/client/order/${activeOrderSnapshot.orderId}`);
  };

  const handleScanError = (error: unknown) => {
    console.error(error);
    setScanError('Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc thử lại.');
  };

  if (isError) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] text-gray-900 dark:text-white transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate(slug ? `/s/${slug}` : '/client')}
        onHistoryClick={() => navigate(slug ? `/s/${slug}/history` : '/client/history')}
        onVouchersClick={() => navigate(slug ? `/s/${slug}/vouchers` : '/client/vouchers')}
        isOverBanner={true}
        storeType={store?.store_type}
      />

      <BannerSlider onScanClick={() => setIsScannerOpen(true)} storeName={store?.name || slug} />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8 space-y-10">

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

        <InfoSection />

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
          <PromoList slug={slug} />
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

      <PWAInstallPrompt />
    </div>
  );
}

function PlatformHomePage() {
  useEffect(() => {
     settingsApi.getBanners().then(settings => {
        if (settings.learnMoreUrl) {
           (window as any).learnMoreUrl = settings.learnMoreUrl;
        }
     });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
       <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542385106-93d395a4c9c1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
       <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/80 to-gray-900"></div>

       <div className="relative z-10 grid lg:grid-cols-2 gap-12 w-full max-w-7xl items-center my-10">
          <div className="space-y-6 animate-fade-in-up">
             <div className="inline-block rounded-full bg-[#13ec6d]/10 px-4 py-2 text-sm font-semibold text-[#13ec6d] border border-[#13ec6d]/20">
                Giải pháp quản lý số 1 dành cho
             </div>
             <h1 className="text-5xl font-bold leading-tight">
                CLB billiards & nhà hàng <br/> <span className="text-[#13ec6d] bg-clip-text text-transparent bg-gradient-to-r from-[#13ec6d] to-emerald-400">Chuyên nghiệp & Hiện đại</span>
             </h1>
             <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                Nền tảng SaaS giúp bạn vận hành quán billiards & nhà hàng hiệu quả. Quét QR, gọi món, quản lý bàn và doanh thu tất cả trong một.
             </p>
             <ul className="space-y-4 pt-4">
               {[
                 'Tính tiền giờ tự động theo khung giờ', 
                 'Khách gọi món qua QR Code tại bàn', 
                 'Quản lý kho & Doanh thu chi tiết', 
                 'Hỗ trợ đa nền tảng PWA (iOS/Android)'
               ].map(item => (
                 <li key={item} className="flex items-center gap-3 text-gray-200">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#13ec6d]/20 text-[#13ec6d]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                 </li>
               ))}
             </ul>
             
             <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => document.getElementById('register-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-xl bg-[#13ec6d] px-6 py-3 font-bold text-zinc-900 transition hover:bg-[#10d863] shadow-lg shadow-green-500/20"
                >
                  Đăng ký dùng thử
                </button>
                <button 
                  onClick={() => {
                     const learnMoreUrl = (window as any).learnMoreUrl;
                     if (learnMoreUrl) {
                        window.location.href = learnMoreUrl;
                     } else {
                        // Fallback behavior if no URL is configured
                        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                     }
                  }}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10 backdrop-blur-sm"
                >
                  Tìm hiểu thêm
                </button>
             </div>
          </div>

          <div id="register-form" className="flex justify-center animate-fade-in-up delay-100">
             <TenantRegistrationForm />
          </div>
       </div>

       <div className="absolute bottom-4 text-center text-xs text-gray-500 w-full z-10">
          &copy; {new Date().getFullYear()} Billiards SaaS Platform. All rights reserved.
       </div>
       <SupportWidget />
    </div>
  );
}

export function ClientHomePage() {
  const { slug } = useParams<{ slug?: string }>();
  
  if (!slug) {
    return <PlatformHomePage />;
  }

  return <TenantHomePage />;
}
