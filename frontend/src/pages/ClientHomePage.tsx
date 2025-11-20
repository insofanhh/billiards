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

  const [placeholderAnnouncements] = useState(() => ([] as Array<{ title: string; description: string }>));
  
  const { data: publicDiscounts } = useQuery({
    queryKey: ['public-discounts'],
    queryFn: discountCodesApi.getPublicDiscounts,
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
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-500">
      <p>{label}</p>
      <p className="mt-1 text-xs text-gray-400">Chờ quản trị viên cập nhật trên CMS.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        onVouchersClick={() => navigate('/client/vouchers')}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <section className="rounded-3xl bg-gray-900 text-white px-8 py-10 shadow-xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-yellow-400">Trang khách hàng</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Quét mã QR để mở bàn và nhận thông báo mới nhất</h1>
                <p className="mt-4 text-gray-200">
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
                  className="flex-1 rounded-2xl bg-yellow-400 px-6 py-3 text-center text-base font-semibold text-gray-900 shadow-lg shadow-yellow-500/30 transition hover:bg-yellow-300"
                >
                  Quét mã QR bàn
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/client/history')}
                  className="flex-1 rounded-2xl border border-white/30 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Lịch sử của tôi
                </button>
              </div>
            </div>
            
          </div>
        </section>

        {scanError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {scanError}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-3">
          {highlightCards.map((item) => (
            <div key={item.title} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Thông tin</p>
              <h2 className="mt-3 text-xl font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 py-2">Thông báo</p>
              <h2 className="text-2xl font-semibold text-gray-900">Tin tức mới nhất</h2>
              {/* <p className="text-sm text-gray-500">Tự động đồng bộ từ CMS ngay khi quản trị viên tạo thông báo.</p> */}
            </div>
            {/* <span className="rounded-full bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600">Thử nghiệm</span> */}
          </div>
          {placeholderAnnouncements.length === 0
            ? emptyStateCard('Chưa có thông báo nào được thêm.')
            : (
              <div className="grid gap-4 md:grid-cols-2">
                {placeholderAnnouncements.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            )
          }
        </section>

        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 py-2">Khuyến mãi</p>
              <h2 className="text-2xl font-semibold text-gray-900">Ưu đãi dành cho bạn</h2>
              {/* <p className="text-sm text-gray-500">Nơi quản trị viên đăng tải các chương trình giảm giá, mã voucher.</p> */}
            </div>
            {/* <span className="rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-600">Đang chờ dữ liệu</span> */}
          </div>
          {!publicDiscounts || publicDiscounts.length === 0
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
                    <div key={discount.id} className="rounded-2xl border border-blue-100 bg-white p-6 shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-500">VOUCHER</p>
                          <h3 className="mt-2 text-lg font-semibold text-gray-900">{discount.code}</h3>
                          {discount.description && <p className="mt-2 text-sm text-gray-600">{discount.description}</p>}
                          <div className="mt-3">
                            <p className="text-sm text-gray-500">Giảm giá</p>
                            <p className="text-xl font-bold text-blue-600">{formatDiscountValue()}</p>
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
                              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                            >
                              {saveMutation.isPending && savingDiscountId === discount.id ? 'Đang lưu...' : 'Lưu'}
                            </button>
                          </div>
                        )}
                        {isSaved && (
                          <div className="ml-4">
                            <span className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-600">
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

        <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Hướng dẫn nhanh</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {infoSteps.map((step) => (
              <div key={step.title} className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{step.title}</p>
                <p className="mt-2 text-sm text-gray-700">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsScannerOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-700"
              aria-label="Đóng"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold text-gray-900">Quét mã QR bàn</h3>
            <p className="mt-1 text-sm text-gray-500">Hãy hướng camera tới mã QR được dán trên bàn.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
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
            <p className="mt-3 text-xs text-gray-400">Yêu cầu trình duyệt chạy trên HTTPS để dùng camera.</p>
          </div>
        </div>
      )}
    </div>
  );
}


