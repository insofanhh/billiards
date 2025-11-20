import { useState } from 'react';
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
        navigate('/client');
        return;
      }

      showNotification('Đăng nhập thành công.');
      navigate(safeRedirect);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Link to="/" className="mb-4">
            <img 
              src="/favicon.svg" 
              alt="Logo" 
              className="h-16 w-16"
            />
          </Link>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Đăng nhập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quản lý bàn billiards
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                {...register('password')}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to={registerLink} className="text-sm text-blue-600 hover:text-blue-500">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

