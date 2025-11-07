import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { tablesApi } from '../api/tables';

export function ClientTablePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('guest_name') || '');

  const { data: table, isLoading, refetch } = useQuery({
    queryKey: ['client-table', code],
    queryFn: () => tablesApi.getByCode(code!),
    enabled: !!code,
  });

  const requestOpenMutation = useMutation({
    mutationFn: async () => {
      const res = await tablesApi.requestOpen(code!, name.trim());
      // store token + user for Sanctum
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('guest_name', name.trim());
      // Return order from response (pending order already created)
      return { id: res.order.id };
    },
    onSuccess: (order) => {
      refetch();
      navigate(`/client/order/${order.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!table) {
    return <div className="min-h-screen flex items-center justify-center">Không tìm thấy bàn</div>;
  }

  const isAvailable = table.status.name === 'Trống';
  const rate = table.table_type.price_rates?.find((r: any) => r.active);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{table.code}</h1>
              <p className="text-xl text-gray-600 mt-2">{table.name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {table.status.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Loại bàn</p>
              <p className="text-lg font-semibold">{table.table_type.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Giá/giờ</p>
              <p className="text-lg font-semibold">{rate ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rate.price_per_hour) : '-'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tên của bạn</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên để yêu cầu mở bàn"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => requestOpenMutation.mutate()}
              disabled={!isAvailable || requestOpenMutation.isPending || !name.trim()}
              className={`w-full py-3 px-6 rounded-md font-medium ${
                isAvailable ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {requestOpenMutation.isPending ? 'Đang gửi yêu cầu...' : 'Yêu cầu mở bàn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



