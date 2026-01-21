import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

type AdminNavigationProps = {
  userName?: string;
  userRoles?: string[];
  onLogout: () => void;
};

export function AdminNavigation({ userName, userRoles, onLogout }: AdminNavigationProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  // ... existing hooks
  const { slug } = useParams<{ slug?: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDesktop, setShowLogoutDesktop] = useState(false);
  const hideDropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = userRoles?.some(role => ['super_admin', 'admin'].includes(role));

  const getPath = (path: string) => {
      if (!slug) return path;
      return `/s/${slug}${path}`;
  };

  // ... (keep useEffects and helper functions same)

  useEffect(() => {
    return () => {
      if (hideDropdownTimeout.current) {
        clearTimeout(hideDropdownTimeout.current);
      }
    };
  }, []);

  const clearHideTimeout = () => {
    if (hideDropdownTimeout.current) {
      clearTimeout(hideDropdownTimeout.current);
      hideDropdownTimeout.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideDropdownTimeout.current = setTimeout(() => {
      setShowLogoutDesktop(false);
      hideDropdownTimeout.current = null;
    }, 150);
  };

  const iconClasses = 'h-5 w-5';
  const icons = {
    dashboard: (
      <img src="/favicon.svg" alt="Dashboard" className="h-5 w-5" />
    ),
    orders: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3h11.25A1.5 1.5 0 0 1 21 4.5v15A1.5 1.5 0 0 1 19.5 21H5.25A1.5 1.5 0 0 1 3.75 19.5V6.75a3 3 0 0 1 3-3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5h7.5M8.25 12h7.5M8.25 16.5h4.5" />
      </svg>
    ),
    user: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
    logout: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m12 9 3 3-3 3M15 12H3.75" />
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
    lock: (
      <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  };

  const handleNavigate = (path: string) => {
    navigate(getPath(path));
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    setShowLogoutDesktop(false);
    onLogout();
  };

  const menuSections = [
    {
      title: 'Quản lý dịch vụ',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          description: 'Tổng quan hoạt động',
          icon: icons.dashboard,
          action: () => handleNavigate('/staff'),
        },
        {
          key: 'orders',
          label: 'Lịch sử giao dịch',
          description: 'Theo dõi chi tiết đơn',
          icon: icons.orders,
          action: () => handleNavigate('/orders'),
        },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        {
          key: 'profile',
          label: userName ?? 'Chưa xác định',
          description: 'Người đang đăng nhập',
          icon: icons.user,
        },
        ...(isAdmin ? [{
          key: 'admin',
          label: 'Trang quản trị',
          description: 'Truy cập Admin Panel',
          icon: icons.lock,
          action: () => {
             // Force full reload to backend admin
             window.location.href = '/admin'; 
          }
        }] : []),
        {
          key: 'logout',
          label: 'Đăng xuất',
          description: 'Kết thúc phiên làm việc',
          icon: icons.logout,
          action: handleLogout,
        },
      ],
    },
  ];

  return (
    <>
      <nav className="bg-gray-900 text-white shadow dark:border-b dark:border-gray-800">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => handleNavigate('/staff')}
            className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="rounded-xl bg-yellow-500/20 p-2 text-yellow-400">
              {icons.dashboard}
            </div>
            <div>
              <p className="text-lg font-semibold">CMS</p>
              <p className="text-xs text-gray-400">Billiards Manager</p>
            </div>
          </button>
          <div className="hidden items-center gap-4 text-sm font-medium md:flex">
             {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button> 

            <button
              onClick={() => handleNavigate('/orders')}
              className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Lịch sử giao dịch
            </button>
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
                  setShowLogoutDesktop((prev) => !prev);
                }}
                className="flex items-center gap-3 rounded-2xl bg-white/5 text-left text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
              >
                <span className="rounded-xl bg-white/10 p-2 text-yellow-400">
                  {icons.user}
                </span>
                <span className="mt-0.5 block pr-4 text-sm font-semibold">{userName ?? 'Chưa xác định'}</span>
              </button>
              {showLogoutDesktop && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-gray-800/95 shadow-xl"
                  onMouseEnter={clearHideTimeout}
                  onMouseLeave={scheduleHide}
                >
                  <div className="p-2 space-y-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => window.location.href = '/admin'}
                        className="w-full rounded-xl px-4 py-2 text-left text-sm font-semibold text-gray-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 flex items-center gap-2"
                      >
                         {icons.lock}
                         Trang quản trị
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-2 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 flex items-center gap-2"
                    >
                      {icons.logout}
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
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
          className={`absolute inset-y-0 right-0 w-80 transform bg-gray-900 text-white shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-lg font-semibold">CMS</p>
              <p className="text-xs text-gray-400">Quản lý billiards</p>
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
          <div className="h-[calc(100%-112px)] space-y-6 overflow-y-auto px-6 py-6">
            {menuSections.map(section => (
              <div key={section.title}>
                <p className="text-xs uppercase tracking-wider text-gray-500">{section.title}</p>
                <div className="mt-3 space-y-3">
                  {section.items.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.action}
                      disabled={!item.action}
                      className={`flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${item.action ? '' : 'cursor-default opacity-75'}`}
                    >
                      <span className="rounded-xl bg-white/10 p-2 text-yellow-400">
                        {item.icon}
                      </span>
                      <span>
                        <span className="text-sm font-semibold">{item.label}</span>
                        {item.description && (
                          <span className="mt-0.5 block text-xs text-gray-400">{item.description}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 px-6 py-4 text-xs text-gray-500">
            Phiên đăng nhập được bảo vệ
          </div>
        </aside>
      </div>
    </>
  );
}

