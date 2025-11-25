import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tablesApi } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import type { Table } from '../types';
import { ordersApi } from '../api/orders';
import { echo } from '../echo';
import { AdminNavigation } from '../components/AdminNavigation';

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [tablesWithNotifications, setTablesWithNotifications] = useState<Set<number>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getAll,
  });

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
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate(`/order/${orderId}`);
    },
  });

  const rejectEndMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.rejectEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  // Logic khởi tạo notification ban đầu (Giữ nguyên)
  useEffect(() => {
    if (!user || !tables || tables.length === 0 || hasInitialized) return;

    const checkOrderHasUnconfirmedItems = async (orderId: number, tableId: number) => {
      try {
        const order = await ordersApi.getById(orderId);
        const hasUnconfirmed = order.items?.some((item: any) => !item.is_confirmed);
        setTablesWithNotifications(prev => {
          const newSet = new Set(prev);
          if (hasUnconfirmed) {
            newSet.add(tableId);
          } else {
            newSet.delete(tableId);
          }
          return newSet;
        });
      } catch (error) {
        console.error('Error checking order:', error);
      }
    };

    const initializeNotifications = async () => {
      try {
        const currentPath = location.pathname;
        const tablesToCheck = tables.filter((table: Table) => table.active_order?.id);
        
        for (const table of tablesToCheck) {
          const isViewingOrderDetail = currentPath === `/order/${table.active_order!.id}`;
          if (!isViewingOrderDetail) {
            await checkOrderHasUnconfirmedItems(table.active_order!.id, table.id);
          }
        }
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [user, tables, location.pathname]);

  // --- LOGIC REALTIME MỚI (ĐÃ FIX) ---
  useEffect(() => {
    // 1. Debug xem User đã load chưa
    console.log('Realtime Init: User status:', user ? 'Loaded' : 'Not Loaded');
    
    if (!user) return;

    // 2. Tạm thời CHỈ DÙNG Public Channel 'orders' để test
    console.log('Realtime: Đang đăng ký kênh "orders"...');
    const ordersChannel = echo.channel('orders');

    // 3. Callback debug kết nối thành công
    ordersChannel.on('pusher:subscription_succeeded', () => {
        console.log('✅ Realtime: Đã đăng ký thành công kênh "orders"!');
    });

    ordersChannel.on('pusher:subscription_error', (status: any) => {
        console.error('❌ Realtime: Lỗi đăng ký kênh "orders":', status);
    });

    // 4. Lắng nghe TOÀN BỘ sự kiện để debug tên sự kiện
    ordersChannel.listenToAll((eventName: string, data: any) => {
        console.log(`🔥 FIRE EVENT: [${eventName}]`, data);
    });

    // Hàm check notification dùng chung
    const checkOrderHasUnconfirmedItems = async (orderId: number, tableId: number) => {
        try {
          const order = await ordersApi.getById(orderId);
          const hasUnconfirmed = order.items?.some((item: any) => !item.is_confirmed);
          setTablesWithNotifications(prev => {
            const newSet = new Set(prev);
            if (hasUnconfirmed) {
              newSet.add(tableId);
            } else {
              newSet.delete(tableId);
            }
            return newSet;
          });
        } catch (error) {
          console.error('Error checking order:', error);
        }
    };

    // 5. Định nghĩa hàm xử lý chung
    const handleRefetch = (eventName: string) => {
        console.log(`⚡ Xử lý sự kiện: ${eventName}`);
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        queryClient.refetchQueries({ queryKey: ['tables'] });
    };

    // 6. Danh sách các sự kiện cần bắt (Có dấu chấm phía trước)
    const events = [
        '.order.requested',
        '.order.approved',
        '.order.rejected',
        '.order.end.requested',
        '.order.end.approved',
        '.transaction.created',
        '.order.service.added',
        '.order.service.updated',
        '.order.service.removed',
        '.order.service.confirmed'
    ];

    events.forEach(event => {
        ordersChannel.listen(event, (data: any) => {
            handleRefetch(event);
            
            // Logic cập nhật notification chấm đỏ
            if (event.includes('service')) {
                 const orderId = data.order?.id;
                 if (orderId) {
                    const currentTables = queryClient.getQueryData<Table[]>(['tables']);
                    const table = currentTables?.find((t: Table) => t.active_order?.id === orderId);
                    if (table) {
                        if (event.includes('added')) {
                             setTablesWithNotifications(prev => new Set(prev).add(table.id));
                        } else {
                             checkOrderHasUnconfirmedItems(orderId, table.id);
                        }
                    }
                 }
            }
        });
    });

    // Cleanup khi component unmount
    return () => {
      console.log('Realtime: Unsubscribing...');
      ordersChannel.stopListeningToAll();
      echo.leave('orders');
    };
  }, [user, queryClient]); // Hết useEffect

  // --- CÁC HÀM XỬ LÝ CLICK ---
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <AdminNavigation userName={user?.name} onLogout={logout} />

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
              {tables?.map((table: Table) => {
                const hasNotification = tablesWithNotifications.has(table.id);
                const currentPath = location.pathname;
                const isViewingOrderDetail = table.active_order?.id && currentPath === `/order/${table.active_order.id}`;
                const showNotification = hasNotification && !isViewingOrderDetail && table.active_order;
                const isPendingPayment = table.active_order?.status === 'completed';

                return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table.code)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer transition-shadow relative"
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
                  {showNotification && (
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
                        Có dịch vụ mới
                      </span>
                    </div>
                  )}
                  {isPendingPayment && (
                    <p className="mt-4 px-3 py-2 text-xs font-semibold text-yellow-800 bg-yellow-50 border border-yellow-200 rounded">
                      Đang chờ xác nhận thanh toán
                    </p>
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
              );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}