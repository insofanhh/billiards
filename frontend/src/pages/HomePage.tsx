import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tablesApi } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import type { Table } from '../types';
import { ordersApi } from '../api/orders';
import { echo } from '../echo';

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

  useEffect(() => {
    if (!user) return;

    const ordersChannel = echo.channel('orders');
    const staffChannel = echo.private('staff');

    const handleOrderRequested = () => {
      console.log('Order requested event received');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.refetchQueries({ queryKey: ['tables'] });
    };

    const handleOrderApproved = () => {
      console.log('Order approved event received');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.refetchQueries({ queryKey: ['tables'] });
    };

    const handleOrderRejected = () => {
      console.log('Order rejected event received');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.refetchQueries({ queryKey: ['tables'] });
    };

    const handleOrderEndRequested = () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.refetchQueries({ queryKey: ['tables'] });
    };

    const handleOrderEndApproved = () => {
      console.log('Order end approved event received');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.refetchQueries({ queryKey: ['tables'] });
    };

    const handleTransactionCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.refetchQueries({ queryKey: ['tables'] });
    };

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

    const handleOrderServiceAdded = (data: any) => {
      const orderId = data.order?.id;
      if (!orderId) return;

      const currentPath = location.pathname;
      const isViewingOrderDetail = currentPath === `/order/${orderId}`;
      
      if (isViewingOrderDetail) return;

      const currentTables = queryClient.getQueryData<Table[]>(['tables']);
      if (currentTables) {
        const table = currentTables.find((t: Table) => t.active_order?.id === orderId);
        if (table) {
          setTablesWithNotifications(prev => new Set(prev).add(table.id));
        }
      }
    };

    const handleOrderServiceUpdated = (data: any) => {
      const orderId = data.order?.id;
      if (!orderId) return;

      const currentTables = queryClient.getQueryData<Table[]>(['tables']);
      if (currentTables) {
        const table = currentTables.find((t: Table) => t.active_order?.id === orderId);
        if (table) {
          checkOrderHasUnconfirmedItems(orderId, table.id);
        }
      }
    };

    const handleOrderServiceRemoved = (data: any) => {
      const orderId = data.order?.id;
      if (!orderId) return;

      const currentTables = queryClient.getQueryData<Table[]>(['tables']);
      if (currentTables) {
        const table = currentTables.find((t: Table) => t.active_order?.id === orderId);
        if (table) {
          checkOrderHasUnconfirmedItems(orderId, table.id);
        }
      }
    };

    const handleOrderServiceConfirmed = (data: any) => {
      const orderId = data.order?.id;
      if (!orderId) return;

      const currentTables = queryClient.getQueryData<Table[]>(['tables']);
      if (currentTables) {
        const table = currentTables.find((t: Table) => t.active_order?.id === orderId);
        if (table) {
          checkOrderHasUnconfirmedItems(orderId, table.id);
        }
      }
    };

    ordersChannel.listen('.order.requested', handleOrderRequested);
    staffChannel.listen('.order.requested', handleOrderRequested);

    ordersChannel.listen('.order.approved', handleOrderApproved);
    staffChannel.listen('.order.approved', handleOrderApproved);

    ordersChannel.listen('.order.rejected', handleOrderRejected);
    staffChannel.listen('.order.rejected', handleOrderRejected);

    ordersChannel.listen('.order.end.requested', handleOrderEndRequested);
    staffChannel.listen('.order.end.requested', handleOrderEndRequested);

    ordersChannel.listen('.order.end.approved', handleOrderEndApproved);
    staffChannel.listen('.order.end.approved', handleOrderEndApproved);

    ordersChannel.listen('.transaction.created', handleTransactionCreated);
    staffChannel.listen('.transaction.created', handleTransactionCreated);

    ordersChannel.listen('.order.service.added', handleOrderServiceAdded);
    staffChannel.listen('.order.service.added', handleOrderServiceAdded);
    ordersChannel.listen('.order.service.updated', handleOrderServiceUpdated);
    staffChannel.listen('.order.service.updated', handleOrderServiceUpdated);
    ordersChannel.listen('.order.service.removed', handleOrderServiceRemoved);
    staffChannel.listen('.order.service.removed', handleOrderServiceRemoved);
    ordersChannel.listen('.order.service.confirmed', handleOrderServiceConfirmed);
    staffChannel.listen('.order.service.confirmed', handleOrderServiceConfirmed);

    return () => {
      ordersChannel.stopListening('.order.requested');
      ordersChannel.stopListening('.order.approved');
      ordersChannel.stopListening('.order.rejected');
      ordersChannel.stopListening('.order.end.requested');
      ordersChannel.stopListening('.order.end.approved');
      ordersChannel.stopListening('.transaction.created');
      ordersChannel.stopListening('.order.service.added');
      ordersChannel.stopListening('.order.service.updated');
      ordersChannel.stopListening('.order.service.removed');
      ordersChannel.stopListening('.order.service.confirmed');
      staffChannel.stopListening('.order.requested');
      staffChannel.stopListening('.order.approved');
      staffChannel.stopListening('.order.rejected');
      staffChannel.stopListening('.order.end.requested');
      staffChannel.stopListening('.order.end.approved');
      staffChannel.stopListening('.transaction.created');
      staffChannel.stopListening('.order.service.added');
      staffChannel.stopListening('.order.service.updated');
      staffChannel.stopListening('.order.service.removed');
      staffChannel.stopListening('.order.service.confirmed');
      echo.leave('orders');
      echo.leave('staff');
    };
  }, [user, queryClient, location.pathname]);

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
              {tables?.map((table: Table) => {
                const hasNotification = tablesWithNotifications.has(table.id);
                const currentPath = location.pathname;
                const isViewingOrderDetail = table.active_order?.id && currentPath === `/order/${table.active_order.id}`;
                const showNotification = hasNotification && !isViewingOrderDetail && table.active_order;

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

