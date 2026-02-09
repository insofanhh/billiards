import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useNotification } from '../contexts/NotificationContext';

export function VerifyEmailPage() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Đang xác thực email...');

  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      if (!id || !hash) {
        setStatus('error');
        setMessage('Đường dẫn xác thực không hợp lệ.');
        return;
      }

      try {
        const response = await authApi.verifyEmail(id, hash, searchParams.toString());
        setStatus('success');
        setMessage('Xác thực email thành công! Đang đăng nhập vào hệ thống...');
        showNotification('Xác thực email thành công!');
        
        if (response.token && response.user) {
            // Auto login
            const { useAuthStore } = await import('../store/authStore');
            useAuthStore.getState().setAuth(response.user, response.token);
            
            setTimeout(() => {
                if (response.user.store?.slug) {
                     window.location.href = `/s/${response.user.store.slug}`;
                } else if (response.user.roles?.some((r: any) => r.name === 'super_admin' || r.name === 'platform_admin')) {
                     window.location.href = '/platform/dashboard';
                } else {
                     window.location.href = '/';
                }
            }, 1000);
        } else {
             // Fallback if no token returned (shouldn't happen with new backend logic)
             setTimeout(() => {
                  window.location.href = '/login'; 
             }, 2000);
        }
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setStatus('error');
        setMessage(err.response?.data?.message || 'Xác thực thất bại. Đường dẫn có thể đã hết hạn.');
      }
    };

    verify();
  }, [id, hash, searchParams, showNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121c18] px-4">
      <div className="max-w-md w-full bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 text-center">
        <div className="mb-6 flex justify-center">
          {status === 'verifying' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#13ec6d]"></div>
          )}
          {status === 'success' && (
             <div className="h-16 w-16 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
             </div>
          )}
          {status === 'error' && (
            <div className="h-16 w-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
               <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {status === 'verifying' && 'Đang xác thực...'}
            {status === 'success' && 'Xác thực thành công'}
            {status === 'error' && 'Xác thực thất bại'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
            {message}
        </p>

        <div className="space-y-4">
            <Link 
                to="/login" 
                className="block w-full py-3 px-4 bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-[#10d863] transition"
            >
                Đến trang đăng nhập
            </Link>
            
            <Link to="/" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Về trang chủ
            </Link>
        </div>
      </div>
    </div>
  );
}
