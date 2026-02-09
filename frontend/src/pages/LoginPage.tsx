import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useNotification } from '../contexts/NotificationContext';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { showNotification } = useNotification();
  const [error, setError] = useState<string | null>(null);
  const redirectParam = searchParams.get('redirect');
  const redirectTarget = redirectParam ? decodeURIComponent(redirectParam) : '/client';
  const safeRedirect = redirectTarget.startsWith('/') ? redirectTarget : '/client';
  const registerLink = redirectParam ? `/register?redirect=${redirectParam}` : '/register';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'account_not_found') {
      setError('Tài khoản không khớp với cửa hàng');
    } else if (errorParam) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const response = await authApi.login(data);
      setAuth(response.user, response.token);
      const normalizedRoles = Array.isArray(response.user?.roles)
        ? response.user.roles
          .map((role) => role?.toLowerCase?.() ?? '')
          .filter(Boolean)
        : [];
      const hasRole = (...roles: string[]) => normalizedRoles.some((role) => roles.includes(role));

      if (hasRole('staff', 'admin', 'super_admin')) {
        showNotification('Đăng nhập thành công. Chuyển tới trang quản lý bàn.');
        navigate('/staff');
        return;
      }

      if (hasRole('customer')) {
        if (response.user?.name) {
          localStorage.setItem('guest_name', response.user.name);
        }
        showNotification('Đăng nhập thành công. Chuyển tới khu vực khách hàng.');
        if (response.user?.store?.slug) {
            if (response.user.store.is_expired || response.user.store.is_active === false) {
                showNotification('Cửa hàng đã hết hạn dùng thử/đăng ký. Vui lòng gia hạn.');
                navigate(`/s/${response.user.store.slug}/extend`);
                return;
            }
            navigate(`/s/${response.user.store.slug}`);
        } else if (response.user?.roles?.includes('super_admin') || response.user?.roles?.includes('platform_admin')) {
            navigate('/platform/dashboard');
        } else {
            navigate('/');
        }

        return;
      }

      showNotification('Đăng nhập thành công.');
      // Default fallback
      if (response.user?.store?.slug && (!redirectParam || !redirectParam.includes('/s/'))) {
             navigate(`/s/${response.user.store.slug}`);
             return;
      }
      navigate(safeRedirect);
    } catch (err: any) {
      if (err.response?.data?.code === 'STORE_EXPIRED' && err.response?.data?.store_slug) {
        showNotification('Cửa hàng đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.');
        navigate(`/s/${err.response.data.store_slug}/extend`);
        return;
      }
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-white/5 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-purple-500">✨</span>
            Chào mừng trở lại
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Đăng nhập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Đăng nhập vào tài khoản của bạn để tiếp tục
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#121c18] text-gray-500 dark:text-gray-400 uppercase text-xs">
              {searchParams.get('slug') ? 'Hoặc tiếp tục với Email' : 'Đăng nhập với Email'}
            </span>
          </div>
        </div>

        <div className="mb-6">
            <a
              href={`${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}/api/auth/google/redirect${searchParams.get('slug') ? `?slug=${searchParams.get('slug')}` : ''}`}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-white/10 rounded-xl shadow-sm bg-white dark:bg-white/5 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Tiếp tục với Google
            </a>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#13ec6d] focus:border-transparent transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mật khẩu
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-[#13ec6d] hover:text-blue-500 dark:hover:text-[#10d863]">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#13ec6d] focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white dark:text-zinc-900 bg-blue-600 dark:bg-[#13ec6d] hover:bg-blue-700 dark:hover:bg-[#10d863] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-[#13ec6d] disabled:opacity-50 transition-all shadow-blue-500/20 dark:shadow-green-500/20"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Chưa có tài khoản? </span>
            <Link to={registerLink} className="text-sm font-medium text-blue-600 dark:text-[#13ec6d] hover:text-blue-500 dark:hover:text-[#10d863]">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

