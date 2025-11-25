import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useClientActiveOrder } from '../hooks/useClientActiveOrder';
import { getClientOrderStatusLabel } from '../utils/clientActiveOrder';

type ClientNavigationProps = {
  userName?: string;
  subtitle?: string;
  onHomeClick?: () => void;
  onHistoryClick?: () => void;
  onVouchersClick?: () => void;
  historyActive?: boolean;
  vouchersActive?: boolean;
};

export function ClientNavigation({
  userName,
  subtitle = '',
  onHomeClick,
  onHistoryClick,
  onVouchersClick,
  historyActive = false,
  vouchersActive = false,
}: ClientNavigationProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const activeOrder = useClientActiveOrder();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDesktop, setShowLogoutDesktop] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [canLogout, setCanLogout] = useState(() => !!localStorage.getItem('auth_token'));
  const hideDropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideGuestDropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <img src="/favicon.svg" alt="Home" className="h-5 w-5" />
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
  };

  const displayName = userName?.trim() || 'Khách tạm thời';

  const handleHome = () => {
    if (activeOrder) {
      navigate(`/client/order/${activeOrder.orderId}`);
    } else {
      onHomeClick?.();
    }
    setMobileMenuOpen(false);
  };

  const handleHistory = () => {
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
    window.location.reload();
  };

  const handleLogin = () => {
    setShowGuestDropdown(false);
    navigate('/login');
  };

  const handleRegister = () => {
    setShowGuestDropdown(false);
    navigate('/register');
  };

  const resolveRoleRedirect = () => {
    if (!Array.isArray(user?.roles) || user.roles.length === 0) {
      return null;
    }
    const normalizedRoles = user.roles
      .map((role) => role?.toLowerCase?.() ?? '')
      .filter(Boolean);
    if (normalizedRoles.some((role) => role === 'staff' || role === 'admin' || role === 'super_admin')) {
      return '/staff';
    }
    if (normalizedRoles.includes('customer')) {
      return '/';
    }
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

  return (
    <>
      <nav className="bg-gray-900 text-white shadow">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleHome}
            className={`flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${onHomeClick ? '' : 'cursor-default'}`}
          >
            <div className="rounded-xl bg-yellow-500/20 p-2 text-yellow-400">
              {icons.home}
            </div>
            <div>
              <p className="text-lg font-semibold">CMS</p>
              <p className="text-xs text-gray-400">Billiards Client</p>
            </div>
          </button>
          <div className="hidden items-center gap-3 md:flex">
            {onHistoryClick && (
              <button
                type="button"
                onClick={handleHistory}
                className={`rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  historyActive ? 'bg-white/20 text-yellow-300' : 'text-white hover:bg-white/10'
                }`}
              >
                Lịch sử chơi
              </button>
            )}
            {onVouchersClick && (
              <button
                type="button"
                onClick={handleVouchers}
                className={`rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  vouchersActive ? 'bg-white/20 text-yellow-300' : 'text-white hover:bg-white/10'
                }`}
              >
                Ví voucher
              </button>
            )}
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
                  className="rounded-2xl bg-white/5 px-4 py-2 text-left text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-400">{subtitle}</p>
                  <p className="text-sm font-semibold">{displayName}</p>
                </button>
                {showLogoutDesktop && (
                  <div
                    className="absolute right-0 mt-2 w-32 rounded-2xl border border-white/10 bg-gray-800/95  shadow-xl"
                    onMouseEnter={clearHideTimeout}
                    onMouseLeave={scheduleHide}
                  >
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
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
                  className="rounded-2xl bg-white/5 px-4 py-2 text-left text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-400">{subtitle}</p>
                  <p className="text-sm font-semibold">{displayName}</p>
                </button>
                {showGuestDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-gray-800/95 shadow-xl"
                    onMouseEnter={clearGuestDropdownTimeout}
                    onMouseLeave={scheduleHideGuest}
                  >
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="w-full rounded-t-2xl border-b border-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      className="w-full rounded-b-2xl px-4 py-3 text-left text-sm font-semibold text-blue-300 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      Đăng ký
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu"
          >
            {icons.menu}
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-40 md:hidden ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 w-72 transform bg-gray-900 text-white shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-lg font-semibold">Tài khoản tạm</p>
              <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full p-2 text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Đóng menu"
            >
              {icons.close}
            </button>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-white/10 p-2 text-yellow-400">
                  {icons.user}
                </span>
                <div>
                  <p className="text-sm text-gray-400">{subtitle}</p>
                  <p className="text-base font-semibold text-white">{displayName}</p>
                </div>
              </div>
            </div>
            {onHomeClick && (
              <button
                type="button"
                onClick={handleHome}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 ${
                  activeOrder
                    ? 'border-yellow-400 bg-yellow-300/90 text-gray-900 hover:bg-yellow-200 focus-visible:ring-yellow-200'
                    : 'border-white/5 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white'
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
                <span className={activeOrder ? 'text-gray-900' : 'text-yellow-400'}>
                  {icons.arrowRight}
                </span>
              </button>
            )}
            {onHistoryClick && (
              <button
                type="button"
                onClick={handleHistory}
                className={`flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  historyActive ? 'text-yellow-300' : 'text-white hover:bg-white/10'
                }`}
              >
                <span>Lịch sử chơi</span>
                <span className="text-yellow-400">{icons.history}</span>
              </button>
            )}
            {onVouchersClick && (
              <button
                type="button"
                onClick={handleVouchers}
                className={`flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  vouchersActive ? 'text-yellow-300' : 'text-white hover:bg-white/10'
                }`}
              >
                <span>Ví voucher</span>
                <span className="text-yellow-400">{icons.voucher}</span>
              </button>
            )}
            {canLogout ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRegister();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl border border-blue-300/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
          <div className="border-t border-white/5 px-6 py-4 text-xs text-gray-500">
            Tài khoản khách được tạo tạm thời
          </div>
        </aside>
      </div>
    </>
  );
}

