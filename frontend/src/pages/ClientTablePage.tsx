import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { tablesApi } from '../api/tables';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';
import { useNotification } from '../contexts/NotificationContext';

export function ClientTablePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('guest_name') || '');
  const [guestName, setGuestName] = useState(getTemporaryUserName);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));
  useEffect(() => {
    if (code) {
      localStorage.setItem('last_client_table_code', code);
    }
  }, [code]);


  useEffect(() => {
    setName(guestName || '');
  }, [guestName]);

  const { showNotification } = useNotification();

  const { data: table, isLoading, refetch } = useQuery({
    queryKey: ['client-table', code],
    queryFn: () => tablesApi.getByCode(code!),
    enabled: !!code,
  });

  const requestOpenMutation = useMutation({
    mutationFn: async () => {
      const isAuthenticated = !!localStorage.getItem('auth_token');
      return tablesApi.requestOpen(code!, isAuthenticated ? '' : name.trim());
    },
    onSuccess: (res) => {
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        const trimmedName = name.trim();
        localStorage.setItem('guest_name', trimmedName);
        setGuestName(getTemporaryUserName);
        setIsLoggedIn(true);
      } else if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        setGuestName(getTemporaryUserName);
      }

      if (res.order && 'already_pending' in res.order && res.order.already_pending) {
        showNotification('Bạn đã có yêu cầu mở bàn đang chờ duyệt.');
      }

      if (res.order?.id) {
        refetch();
        navigate(`/client/order/${res.order.id}`);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể gửi yêu cầu mở bàn. Vui lòng thử lại.';
      showNotification(message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#13ec6d]"></div>
      </div>
    );
  }

  if (!table) {
    return <div className="min-h-screen flex items-center justify-center">Không tìm thấy bàn</div>;
  }

  const isAvailable = table.status.name === 'Trống';
  const rate = table.table_type.current_price_rate || table.table_type.price_rates?.find((r: any) => r.active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        onVouchersClick={() => navigate('/client/vouchers')}
      />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-md border border-gray-100 dark:border-white/10 p-8 backdrop-blur-sm transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{table.code}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">{table.name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${isAvailable
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              }`}>
              {table.status.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loại bàn</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{table.table_type.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Giá/giờ</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{rate ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rate.price_per_hour) : '-'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {!isLoggedIn && (
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tên của bạn</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên để yêu cầu mở bàn"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#13ec6d] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            )}
            {isLoggedIn && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-500/20">
                <p className="text-sm text-gray-600 dark:text-gray-300">Đang sử dụng tài khoản:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{guestName}</p>
              </div>
            )}
            <button
              onClick={() => requestOpenMutation.mutate()}
              disabled={!isAvailable || requestOpenMutation.isPending || (!isLoggedIn && !name.trim())}
              className={`w-full py-3 px-6 rounded-xl font-bold transition-all shadow-lg ${isAvailable
                ? 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 hover:bg-blue-700 dark:hover:bg-[#10d863] shadow-blue-500/20 dark:shadow-green-500/20'
                : 'bg-gray-300 dark:bg-white/10 text-gray-500 dark:text-gray-500 cursor-not-allowed shadow-none'
                }`}
            >
              {requestOpenMutation.isPending ? 'Đang gửi yêu cầu...' : 'Yêu cầu mở bàn'}
            </button>
            {!isLoggedIn && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Bạn đã có tài khoản?{' '}
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/client/table/${code}`)}`}
                  className="text-blue-600 dark:text-[#13ec6d] hover:text-blue-500 dark:hover:text-[#10d863] font-medium"
                >
                  Đăng nhập
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



