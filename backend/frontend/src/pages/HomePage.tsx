import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { tablesApi } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import type { Table } from '../types';
import { ordersApi } from '../api/orders';
import echo from '../echo';

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getAll,
  });

  useEffect(() => {
    const channel = echo.channel('tables');
    
    channel.listen('.table.status.changed', () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    });

    echo.channel('orders').listen('.order.updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    });

    return () => {
      echo.leave('tables');
      echo.leave('orders');
    };
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.approve(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.reject(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const approveEndMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.approveEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const rejectEndMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.rejectEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const handleTableClick = (code: string) => {
    navigate(`/table/${code}`);
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case 'Trống': return 'bg-green-100 text-green-800';
      case 'Đang sử dụng': return 'bg-red-100 text-red-800';
      case 'Bảo trì': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Billiards Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Xin chào, {user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh sách bàn</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables?.map((table: Table) => (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table.code)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{table.code}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status.name)}`}>
                      {table.status.name}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{table.name}</p>
                  <p className="text-sm text-gray-500">Loại: {table.table_type.name}</p>
                  <p className="text-sm text-gray-500">Số ghế: {table.seats}</p>
                  {table.location && (
                    <p className="text-sm text-gray-500">Vị trí: {table.location}</p>
                  )}
                  {table.pending_order?.id && !approveMutation.isPending && !rejectMutation.isPending && (
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); approveMutation.mutate(table.pending_order!.id); }}
                        title={`Duyệt yêu cầu của ${table.pending_order?.user_name || ''}`}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(table.pending_order!.id); }}
                        title="Hủy yêu cầu"
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                  {table.pending_end_order?.id && !approveEndMutation.isPending && !rejectEndMutation.isPending && (
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); approveEndMutation.mutate(table.pending_end_order!.id); }}
                        title={`Duyệt kết thúc của ${table.pending_end_order?.user_name || ''}`}
                        className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Duyệt kết thúc
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rejectEndMutation.mutate(table.pending_end_order!.id); }}
                        title="Từ chối kết thúc"
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

