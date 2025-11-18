import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ordersApi } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import type { Order } from '../types';

const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60000);
  return localDate.toISOString().split('T')[0];
};

export function OrdersHistoryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [filterDate, setFilterDate] = useState<string>(getTodayDateString);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    let filtered = orders.filter((order: Order) => 
      order.status === 'completed' || order.status === 'cancelled'
    );

    if (filterDate) {
      const selectedDate = new Date(filterDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((order: Order) => {
        if (!order.start_at) return false;
        const orderDate = new Date(order.start_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === selectedDate.getTime();
      });
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((order: Order) => {
        const playerName = order.user?.name || '';
        const orderCode = order.order_code || '';
        return playerName.toLowerCase().includes(keyword) || orderCode.toLowerCase().includes(keyword);
      });
    }

    return filtered.sort((a: Order, b: Order) => {
      const dateA = a.start_at ? new Date(a.start_at).getTime() : 0;
      const dateB = b.start_at ? new Date(b.start_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders, filterDate, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang sử dụng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ xử lý';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 onClick={() => navigate('/')} className="text-xl font-bold text-gray-900">Billiards Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Lịch sử giao dịch
              </button>
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

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h1>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div className="w-full md:w-auto">
            <label htmlFor="filter-date" className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo ngày:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:flex-1 md:max-w-md">
            <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm:
            </label>
            <input
              id="filter-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên người chơi hoặc mã đơn hàng..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: Order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.order_code}</h3>
                    <p className="text-gray-600 mt-1">Bàn: {order.table.name}</p>
                    <p className="text-sm text-gray-500">
                      Người chơi: <span className="font-medium text-gray-900">{order.user?.name || 'Không xác định'}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Bắt đầu</p>
                    <p className="font-medium">
                      {order.start_at ? new Date(order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
                    </p>
                  </div>
                  {order.end_at && (
                    <div>
                      <p className="text-gray-500">Kết thúc</p>
                      <p className="font-medium">
                        {new Date(order.end_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="text-lg font-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_paid)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {filterDate ? 'Không có giao dịch nào trong ngày đã chọn' : 'Chưa có giao dịch nào'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

