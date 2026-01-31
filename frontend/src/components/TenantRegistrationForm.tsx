
import { useState } from 'react';
import { platformApi } from '../api/platform';
import { useNavigate } from 'react-router-dom';

import { useClientSeo } from '../hooks/useClientSeo';

export function TenantRegistrationForm() {
  useClientSeo();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    store_name: '',
    owner_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    store_type: 'billiards'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await platformApi.registerStore(formData);
      
      // Auto login logic
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
      }

      // Redirect to the new store's client page
      if (res.store && res.store.slug) {
         window.location.href = `/s/${res.store.slug}`;
      } else {
         navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-100 dark:border-white/10 bg-white/80 dark:bg-white/5 p-8 shadow-xl backdrop-blur-md">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Đăng ký mở cửa hàng</h3>
      
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Tên quán (Billiards Club)</label>
          <input
            type="text"
            required
            className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:border-blue-500 focus:ring-blue-500 dark:text-white py-3 px-4"
            placeholder="Ví dụ: Billiards Thành Công"
            value={formData.store_name}
            onChange={(e) => setFormData({...formData, store_name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Tên chủ quán</label>
          <input
            type="text"
            required
            className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:border-blue-500 focus:ring-blue-500 dark:text-white py-3 px-4"
            placeholder="Họ và tên của bạn"
            value={formData.owner_name}
            onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Lĩnh vực kinh doanh</label>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setFormData({...formData, store_type: 'billiards'})}
              className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                formData.store_type === 'billiards'
                  ? 'border-blue-600 bg-blue-50 dark:border-[#13ec6d] dark:bg-[#13ec6d]/10 text-blue-700 dark:text-[#13ec6d]'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="font-semibold">Quán Billiards</div>
            </div>
            <div
              onClick={() => setFormData({...formData, store_type: 'restaurant'})}
              className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                formData.store_type === 'restaurant'
                  ? 'border-blue-600 bg-blue-50 dark:border-[#13ec6d] dark:bg-[#13ec6d]/10 text-blue-700 dark:text-[#13ec6d]'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="font-semibold">Nhà hàng</div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Email đăng nhập</label>
          <input
            type="email"
            required
            className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:border-blue-500 focus:ring-blue-500 dark:text-white py-3 px-4"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:border-blue-500 focus:ring-blue-500 dark:text-white py-3 px-4"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Xác nhận</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:border-blue-500 focus:ring-blue-500 dark:text-white py-3 px-4"
              value={formData.password_confirmation}
              onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 dark:bg-[#13ec6d] py-3.5 text-center font-bold text-white dark:text-zinc-900 shadow-lg shadow-blue-500/30 dark:shadow-green-500/30 transition hover:bg-blue-700 dark:hover:bg-[#10d863] disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
          </button>
        </div>

        <div className="text-center mt-4 space-x-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Đã có tài khoản?</span>
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-blue-600 dark:text-[#13ec6d] hover:underline focus:outline-none"
          >
            Đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
}
