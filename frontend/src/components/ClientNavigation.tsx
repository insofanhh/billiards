import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useClientActiveOrder } from '../hooks/useClientActiveOrder';
import { getClientOrderStatusLabel } from '../utils/clientActiveOrder';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { isGuestUser } from '../utils/temporaryUser';

type ClientNavigationProps = {
  userName?: string;
  subtitle?: string;
  onHomeClick?: () => void;
  onHistoryClick?: () => void;
  onVouchersClick?: () => void;
  historyActive?: boolean;
  vouchersActive?: boolean;
  blogActive?: boolean;
  isOverBanner?: boolean;
};

export function ClientNavigation({
  userName,
  subtitle = '',
  onHomeClick,
  onHistoryClick,
  onVouchersClick,
  historyActive = false,
  vouchersActive = false,
  blogActive = false,
  isOverBanner = false,
}: ClientNavigationProps) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  
  const getPath = (path: string) => {
      if (!slug) return path;
      if (path.startsWith('/client')) return path.replace('/client', `/s/${slug}`);
      if (path.startsWith('/blog')) return path.replace('/blog', `/s/${slug}/blog`);
      return path;
  };

  const { theme, toggleTheme } = useTheme();
  const { showNotification } = useNotification();
  const user = useAuthStore((state) => state.user);
  const activeOrder = useClientActiveOrder();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDesktop, setShowLogoutDesktop] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [canLogout, setCanLogout] = useState(() => !!localStorage.getItem('auth_token'));
  const [isScrolled, setIsScrolled] = useState(false);
  const hideDropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideGuestDropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOverBanner) {
      setIsScrolled(false);
      return;
    }
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOverBanner]);

  const clearHideTimeout = () => {
    if (hideDropdownTimeout.current) {
      clearTimeout(hideDropdownTimeout.current);
      hideDropdownTimeout.current = null;
    }
  };

  const clearGuestDropdownTimeout = () => {
    if (hideGuestDropdownTimeout.current) {
      clearTimeout(hideGuestDropdownTimeout.current);
      hideGuestDropdownTimeout.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideDropdownTimeout.current = setTimeout(() => {
      setShowLogoutDesktop(false);
      hideDropdownTimeout.current = null;
    }, 200);
  };

  const scheduleHideGuest = () => {
    clearGuestDropdownTimeout();
    hideGuestDropdownTimeout.current = setTimeout(() => {
      setShowGuestDropdown(false);
      hideGuestDropdownTimeout.current = null;
    }, 200);
  };

  useEffect(() => {
    return () => {
      clearHideTimeout();
      clearGuestDropdownTimeout();
    };
  }, []);

  const iconClasses = 'h-5 w-5';
  const icons = {
    home: (
      <img src="/icons/icon-192x192.png" alt="Trang chủ" className="h-8 w-8 rounded-lg" />
    ),
    user: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
    close: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
      </svg>
    ),
    menu: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    arrowRight: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
      </svg>
    ),
    history: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    voucher: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    sun: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
    moon: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    ),
  };

  const displayName = userName?.trim() || 'Khách tạm thời';

  const handleHome = () => {
    if (activeOrder) {
      const targetSlug = activeOrder.storeSlug || slug;
      navigate(targetSlug ? `/s/${targetSlug}/order/${activeOrder.orderId}` : `/client/order/${activeOrder.orderId}`);
    } else {
      onHomeClick?.();
    }
    setMobileMenuOpen(false);
  };

  const handleHistory = () => {
    // Check if user is authenticated and not a guest
    const isAuthenticated = !!localStorage.getItem('auth_token');
    const isGuest = isGuestUser();

    if (!isAuthenticated || isGuest) {
      showNotification('Vui lòng đăng nhập để xem lịch sử chơi');
      // Redirect to login with proper return path
      const currentPath = window.location.pathname;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      setMobileMenuOpen(false);
      return;
    }

    onHistoryClick?.();
    setMobileMenuOpen(false);
  };

  const handleVouchers = () => {
    onVouchersClick?.();
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('guest_name');
    setMobileMenuOpen(false);
    setCanLogout(false);
    setShowLogoutDesktop(false);
    navigate('/login');
  };

  const handleLogin = () => {
    setShowGuestDropdown(false);
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleRegister = () => {
    setShowGuestDropdown(false);
    navigate(`/register?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const resolveRoleRedirect = () => {
    if (!Array.isArray(user?.roles) || user.roles.length === 0) {
      return null;
    }
    const normalizedRoles = user.roles
      .map((role) => role?.toLowerCase?.() ?? '')
      .filter(Boolean);
    if (normalizedRoles.some((role) => role === 'staff' || role === 'admin' || role === 'super_admin')) {
      return slug ? `/s/${slug}/staff` : '/staff';
    }
    // Customer role should not redirect anywhere on click
    return null;
  };

  const handleProfileClick = () => {
    const target = resolveRoleRedirect();
    if (!target) {
      return false;
    }
    navigate(target);
    setMobileMenuOpen(false);
    setShowLogoutDesktop(false);
    return true;
  };

  // Logic Class Styles
  const navClasses = isOverBanner
      ? `fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-[rgb(16,34,24)]/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-white/5' 
            : 'bg-transparent border-transparent'
        }`
      : 'relative z-50 bg-white dark:bg-[rgb(16,34,24)] text-gray-900 dark:text-white shadow border-b border-gray-200 dark:border-white/5 transition-colors duration-300';
  
  const textColorClass = (isOverBanner && !isScrolled) ? 'text-white' : 'text-gray-900 dark:text-white';
  const subTextColorClass = (isOverBanner && !isScrolled) ? 'text-white/80' : 'text-gray-500 dark:text-gray-400';

  return (
    <>
      <nav className={navClasses}>
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate(slug ? `/s/${slug}` : '/client')}
              className={`flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
            >
              <div className="rounded-xl bg-yellow-500/20 p-2 text-yellow-600 dark:text-yellow-400">
                {icons.home}
              </div>
              <div>
                <p className={`text-lg font-semibold ${textColorClass}`}>CMS</p>
                <p className={`text-xs ${subTextColorClass}`}>Billiards Client</p>
              </div>
            </button>
          </div>
          <div className="hidden md:flex flex-1 justify-center">
            <div className={`flex items-center rounded-full p-1 border backdrop-blur-sm ${
                isOverBanner && !isScrolled
                  ? 'bg-black/20 border-white/10'
                  : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'
              }`}>
              {onHistoryClick && (
                <button
                  type="button"
                  onClick={handleHistory}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${historyActive
                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                    : `hover:bg-white/50 dark:hover:bg-white/5 ${isOverBanner && !isScrolled ? 'text-white/90 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`
                    }`}
                >
                  Lịch sử chơi
                </button>
              )}
              {onVouchersClick && (
                <button
                  type="button"
                  onClick={handleVouchers}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${vouchersActive
                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                    : `hover:bg-white/50 dark:hover:bg-white/5 ${isOverBanner && !isScrolled ? 'text-white/90 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`
                    }`}
                >
                  Ví voucher
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(getPath('/blog'))}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${blogActive
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : `hover:bg-white/50 dark:hover:bg-white/5 ${isOverBanner && !isScrolled ? 'text-white/90 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`
                  }`}
              >
                Tin tức
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                isOverBanner && !isScrolled 
                  ? 'text-white/80 hover:bg-white/20 hover:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
              aria-label="Chuyển đổi giao diện"
            >
              {theme === 'dark' ? icons.sun : icons.moon}
            </button>
            {canLogout ? (
              <div
                className="relative"
                onMouseEnter={() => {
                  clearHideTimeout();
                  setShowLogoutDesktop(true);
                }}
                onMouseLeave={scheduleHide}
              >
                <button
                  type="button"
                  onClick={() => {
                    clearHideTimeout();
                    const redirected = handleProfileClick();
                    if (!redirected) {
                      setShowLogoutDesktop((prev) => !prev);
                    }
                  }}
                  className={`rounded-2xl px-4 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                    isOverBanner && !isScrolled
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <p className={`text-xs uppercase tracking-wide ${subTextColorClass}`}>{subtitle}</p>
                  <p className="text-sm font-semibold">{displayName}</p>
                </button>
                {showLogoutDesktop && (
                  <div
                    className="absolute right-0 mt-2 w-32 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(16,34,24)] shadow-xl z-50"
                    onMouseEnter={clearHideTimeout}
                    onMouseLeave={scheduleHide}
                  >
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-2xl border border-red-100 dark:border-red-300/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-200 transition hover:bg-red-100 dark:hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="relative"
                onMouseEnter={() => {
                  clearGuestDropdownTimeout();
                  setShowGuestDropdown(true);
                }}
                onMouseLeave={scheduleHideGuest}
              >
                <button
                  type="button"
                  onClick={() => {
                    clearGuestDropdownTimeout();
                    setShowGuestDropdown((prev) => !prev);
                  }}
                  className={`rounded-2xl px-4 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                    isOverBanner && !isScrolled
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <p className={`text-xs uppercase tracking-wide ${subTextColorClass}`}>{subtitle}</p>
                  <p className="text-sm font-semibold">{displayName}</p>
                </button>
                {showGuestDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-40 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[rgb(16,34,24)] shadow-xl z-50"
                    onMouseEnter={clearGuestDropdownTimeout}
                    onMouseLeave={scheduleHideGuest}
                  >
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="w-full rounded-t-2xl border-b border-gray-100 dark:border-white/5 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white transition hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      className="w-full rounded-b-2xl px-4 py-3 text-left text-sm font-semibold text-blue-600 dark:text-blue-300 transition hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      Đăng ký
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isOverBanner && !isScrolled
                  ? 'text-white/80 hover:bg-white/20 hover:text-white'
                  : 'text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
              aria-label="Chuyển đổi giao diện"
            >
              {theme === 'dark' ? icons.sun : icons.moon}
            </button>
            <button
              type="button"
              className={`rounded-full p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                 isOverBanner && !isScrolled
                  ? 'text-white hover:bg-white/20'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              {icons.menu}
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-[60] md:hidden ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 w-72 transform bg-white dark:bg-[rgb(16,34,24)] text-gray-900 dark:text-white shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 px-6 py-4">
            <div>
              <p className="text-lg font-semibold">Tài khoản tạm</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full p-2 text-gray-500 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Đóng menu"
            >
              {icons.close}
            </button>
          </div>
          <div className="space-y-4 px-6 py-6">
            <button 
              type="button"
              onClick={handleProfileClick}
              className="w-full text-left rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-4 transition hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-white dark:bg-white/10 p-2 text-yellow-600 dark:text-yellow-400 shadow-sm dark:shadow-none">
                  {icons.user}
                </span>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{displayName}</p>
                </div>
              </div>
            </button>
            {onHomeClick && (
              <button
                type="button"
                onClick={handleHome}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 ${activeOrder
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-300/90 text-gray-900 hover:bg-yellow-100 dark:hover:bg-yellow-200 focus-visible:ring-yellow-200'
                  : 'border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 focus-visible:ring-gray-900 dark:focus-visible:ring-white'
                  }`}
              >
                <span className="flex flex-col">
                  <span>
                    {activeOrder
                      ? `Tiếp tục bàn ${activeOrder.tableName || activeOrder.tableCode || ''}`.trim()
                      : 'Quay về bàn'}
                  </span>
                  {activeOrder && (
                    <span className="text-xs font-medium text-gray-700">
                      {getClientOrderStatusLabel(activeOrder.status)}
                    </span>
                  )}
                </span>
                <span className={activeOrder ? 'text-gray-900' : 'text-yellow-600 dark:text-yellow-400'}>
                  {icons.arrowRight}
                </span>
              </button>
            )}
            {onHistoryClick && (
              <button
                type="button"
                onClick={handleHistory}
                className={`flex w-full items-center justify-between rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white ${historyActive ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'
                  }`}
              >
                <span>Lịch sử chơi</span>
                <span className="text-yellow-600 dark:text-yellow-400">{icons.history}</span>
              </button>
            )}
            {onVouchersClick && (
              <button
                type="button"
                onClick={handleVouchers}
                className={`flex w-full items-center justify-between rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white ${vouchersActive ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'
                  }`}
              >
                <span>Ví voucher</span>
                <span className="text-yellow-600 dark:text-yellow-400">{icons.voucher}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                navigate(getPath('/blog'));
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white ${blogActive ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
            >
              <span>Tin tức</span>
              <span className="text-yellow-600 dark:text-yellow-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                </svg>
              </span>
            </button>
            {canLogout ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl border border-red-200 dark:border-red-300/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-200 transition hover:bg-red-100 dark:hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
              >
                Đăng xuất
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white transition hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRegister();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl border border-blue-200 dark:border-blue-300/20 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-300 transition hover:bg-blue-100 dark:hover:bg-blue-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-white/5 px-6 py-4 text-xs text-gray-500">
            Tài khoản khách được tạo tạm thời
          </div>
        </aside>
      </div>
    </>
  );
}

