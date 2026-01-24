import { useState, useEffect } from 'react';
import type { BannerSettings } from '../../../api/settings';
import { settingsApi } from '../../../api/settings';
import { useQuery } from '@tanstack/react-query';
import { extractYoutubeId } from '../../../utils/url';
import { useNavigate, useParams } from 'react-router-dom';

interface Props {
  onScanClick: () => void;
  storeName?: string;
}

export function BannerSlider({ onScanClick, storeName }: Props) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: bannersData } = useQuery<BannerSettings>({
    queryKey: ['client-banner-settings'],
    queryFn: settingsApi.getBanners,
    staleTime: 5 * 60_000,
  });

  const bannerImages = (Array.isArray(bannersData?.images) ? bannersData.images : []) || [];
  const bannerVideoUrl = bannersData?.videoUrl ?? null;
  const youtubeId = extractYoutubeId(bannerVideoUrl);

  useEffect(() => {
    if (!bannerImages.length || youtubeId) {
      setCurrentBannerIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerImages.length, youtubeId]);

  const showNextBanner = () => {
    if (!bannerImages.length || youtubeId) return;
    setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
  };

  const showPrevBanner = () => {
    if (!bannerImages.length || youtubeId) return;
    setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const goToBanner = (index: number) => {
    if (!bannerImages.length || youtubeId) return;
    setCurrentBannerIndex((index + bannerImages.length) % bannerImages.length);
  };

  const handleDragStart = (clientX: number) => {
    if (youtubeId) return;
    setDragStartX(clientX);
    setIsDragging(true);
  };

  const handleDragEnd = (clientX: number | null) => {
    if (youtubeId || dragStartX === null) {
      if (isDragging) setIsDragging(false);
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {youtubeId ? (
        <div className="absolute inset-0 h-full w-full bg-black">
          <iframe
            className="h-full w-full object-cover pointer-events-none scale-[4] md:scale-150"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1`}
            title="Youtube Banner"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ pointerEvents: 'none' }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : bannerImages.length > 0 ? (
        <div
          className="absolute inset-0 h-full w-full"
          onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
          onTouchEnd={(event) => handleDragEnd(event.changedTouches[0]?.clientX ?? null)}
          onMouseDown={(event) => handleDragStart(event.clientX)}
          onMouseUp={(event) => handleDragEnd(event.clientX)}
          onMouseLeave={() => isDragging && handleDragEnd(null)}
        >
          {bannerImages.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
            >
              <img
                src={src}
                alt={`Banner ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-white/50">Chưa có banner</div>
        </div>
      )}

      <div className="absolute inset-0 z-20 flex items-center">
        <div className="mx-auto max-w-7xl px-4 w-full lg:px-8">
          <div className="max-w-2xl space-y-8 animate-fade-in-up">
            <div>
              <p className="text-base uppercase tracking-widest text-[#13ec6d] font-semibold mb-4">{storeName || 'Trang khách hàng'}</p>
              <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl text-white leading-tight">
                Quét mã QR để mở bàn <br className="hidden sm:block" />và nhận thông báo mới
              </h1>
              <p className="mt-6 text-lg text-gray-200 max-w-xl leading-relaxed">
                Mọi thông điệp, thông báo hoặc ưu đãi từ quản trị viên sẽ xuất hiện tại đây. Bạn chỉ cần một lần quét để bắt đầu trải nghiệm.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={onScanClick}
                className="rounded-full bg-[#13ec6d] px-8 py-4 text-center text-lg font-bold text-zinc-900 shadow-lg shadow-green-500/30 transition hover:bg-[#10d863] hover:scale-105 active:scale-95"
              >
                Quét mã QR bàn
              </button>
              <button
                type="button"
                onClick={() => navigate(slug ? `/s/${slug}/history` : '/client/history')}
                className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-lg font-bold text-white transition hover:bg-white/20 backdrop-blur-sm"
              >
                Lịch sử của tôi
              </button>
            </div>
          </div>
        </div>
      </div>

      {bannerImages.length > 0 && (
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToBanner(index)}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${index === currentBannerIndex
                ? 'bg-[#13ec6d] w-10'
                : 'bg-white/40 hover:bg-white/80'
                }`}
              aria-label={`Chọn banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
