import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useClientSeo } from '../hooks/useClientSeo';
import { authApi } from '../api/auth';
import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export function EmailVerificationPromptPage() {
  useClientSeo();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { showNotification } = useNotification();
  const [resending, setResending] = useState(false);

  // If user is already verified, redirect to home/store
  if (user?.email_verified_at) {
    if (user.store?.slug) {
        window.location.href = `/s/${user.store.slug}`;
    } else {
        navigate('/');
    }
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
        await authApi.resendVerification();
        showNotification('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error: any) {
        console.error(error);
        showNotification(error.response?.data?.message || 'Gửi lại email thất bại.', 'error');
    } finally {
        setResending(false);
    }
  };

  const handleLogout = async () => {
      await logout();
      navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121c18] px-4">
      <div className="max-w-md w-full bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 text-center">
        <div className="mb-6 flex justify-center">
             <div className="h-16 w-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
             </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Xác thực Email
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
            Xin chào <strong>{user?.name}</strong>,<br/>
            Vui lòng kiểm tra email <strong>{user?.email}</strong> và bấm vào liên kết xác thực để kích hoạt tài khoản của bạn.
        </p>

        <div className="space-y-4">
            <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 px-4 bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-[#10d863] transition disabled:opacity-50"
            >
                {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
            </button>
            
            <button 
                onClick={handleLogout}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
                Đăng xuất
            </button>
        </div>
      </div>
    </div>
  );
}
