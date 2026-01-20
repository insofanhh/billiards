import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tablesApi } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import type { Table } from '../types';
import { ordersApi } from '../api/orders';
import { echo } from '../echo';
import { AdminNavigation } from '../components/AdminNavigation';

const getCurrentPriceRate = (rates: any[] | undefined) => {
    if (!rates || rates.length === 0) return undefined;

    const now = new Date();
    const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;

    // Filter active rates
    const activeRates = rates.filter(rate => rate.active);

    // Filter by validity
    const validRates = activeRates.filter(rate => {
        const hasDayConstraint = rate.day_of_week && rate.day_of_week.length > 0;
        const hasTimeConstraint = !!(rate.start_time && rate.end_time);

        if (!hasTimeConstraint) {
            if (hasDayConstraint) {
                return rate.day_of_week!.includes(currentDay.toString());
            }
            return true;
        }

        const start = rate.start_time!;
        const end = rate.end_time!;

        if (start <= end) {
            if (hasDayConstraint && !rate.day_of_week!.includes(currentDay.toString())) return false;
            return currentTimeStr >= start && currentTimeStr <= end;
        } else {
            const matchesStart = currentTimeStr >= start;
            const matchesEnd = currentTimeStr <= end;

            if (matchesStart) {
                if (hasDayConstraint && !rate.day_of_week!.includes(currentDay.toString())) return false;
                return true;
            }
            if (matchesEnd) {
                if (hasDayConstraint) {
                    const prevDay = (currentDay + 6) % 7;
                    if (!rate.day_of_week!.includes(prevDay.toString())) return false;
                }
                return true;
            }
            return false;
        }
    });

    validRates.sort((a, b) => {
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        if (priorityB !== priorityA) return priorityB - priorityA;
        
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idA - idB;
    });

    return validRates[0];
};

export function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { slug } = useParams();

    // Redirect to store-specific staff page if accessing generic /staff
    useEffect(() => {
        if (!slug && user?.store?.slug) {
            navigate(`/s/${user.store.slug}/staff`, { replace: true });
        }
    }, [slug, user, navigate]);

    const queryClient = useQueryClient();
    const [tablesWithNotifications, setTablesWithNotifications] = useState<Set<number>>(new Set());
    const [hasInitialized, setHasInitialized] = useState(false);
    const [paymentSuccessNotifications, setPaymentSuccessNotifications] = useState<Map<number, boolean>>(new Map());

    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables', slug],
        queryFn: () => tablesApi.getAll(slug),
    });

    // ... (rest of mutations same as before, skipping purely for brevity in this tool call, but I need to be careful not to delete them. 
    // Wait, replacing lines 11-32 covers the helper and start of function.
    // I need to use `multi_replace` or be precise.
    // The previous tool replaced lines 29-32.
    // I will insert `getCurrentPriceRate` BEFORE `export function HomePage`.
    // And update `handleTableClick` inside.
    // And update the Card JSX.
    
    // Let's stick to updating `handleTableClick` and Card JSX first, and insert helper separately?
    // Or replace `export function HomePage` line to include helper before it?
    
    // I will use `replace_file_content` to insert helper before line 11.


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

    // Logic khởi tạo notification ban đầu
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
                // Keep minimal error logging for production issues if needed, or remove if strictly required
                // console.error('Error checking order:', error);
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
                // console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();
    }, [user, tables, location.pathname]);

    // --- LOGIC REALTIME (CLEAN VERSION) ---
    useEffect(() => {
        if (!user) return;

        const ordersChannel = echo.channel('orders');

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
                // console.error('Error checking order:', error);
            }
        };

        // Hàm xử lý reload dữ liệu
        const handleRefetch = () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            queryClient.refetchQueries({ queryKey: ['tables'] });
        };

        // Danh sách các sự kiện cần bắt
        const events = [
            '.order.requested',
            '.order.approved',
            '.order.rejected',
            '.order.end.requested',
            '.order.end.approved',
            '.transaction.created',
            '.transaction.confirmed',
            '.order.service.added',
            '.order.service.updated',
            '.order.service.removed',
            '.order.service.confirmed'
        ];

        events.forEach(event => {
            ordersChannel.listen(event, (data: any) => {
                handleRefetch();

                // Logic hiển thị thông báo thanh toán thành công
                if (event === '.transaction.confirmed') {
                    const orderId = data.order?.id;
                    if (orderId) {
                        const currentTables = queryClient.getQueryData<Table[]>(['tables']);
                        const table = currentTables?.find((t: Table) => t.active_order?.id === orderId);
                        if (table) {
                            // Hiển thị thông báo thanh toán thành công
                            setPaymentSuccessNotifications(prev => new Map(prev).set(table.id, true));

                            // Tự động ẩn sau 5 giây
                            setTimeout(() => {
                                setPaymentSuccessNotifications(prev => {
                                    const newMap = new Map(prev);
                                    newMap.delete(table.id);
                                    return newMap;
                                });
                            }, 5000);
                        }
                    }
                }

                // Logic cập nhật notification chấm đỏ cho dịch vụ
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

        // Cleanup
        return () => {
            ordersChannel.stopListeningToAll();
            echo.leave('orders');
        };
    }, [user, queryClient]);

    // --- CÁC HÀM XỬ LÝ CLICK ---
    const handleTableClick = (code: string) => {
        if (slug) {
            navigate(`/s/${slug}/staff/table/${code}`);
        } else {
            navigate(`/table/${code}`);
        }
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
                                const showPaymentSuccess = paymentSuccessNotifications.get(table.id);
                                const activePriceRate = table.table_type.current_price_rate || getCurrentPriceRate(table.table_type.price_rates);

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
                                        {activePriceRate && (
                                            <p className="text-sm text-gray-500">
                                                Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activePriceRate.price_per_hour)}/h
                                            </p>
                                        )}
                                        {showNotification && (
                                            <div className="absolute bottom-2 right-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
                                                    Có dịch vụ mới
                                                </span>
                                            </div>
                                        )}
                                        {showPaymentSuccess && (
                                            <div className="mt-4 px-3 py-2 text-xs font-semibold text-green-800 bg-green-50 border border-green-200 rounded animate-pulse flex items-center justify-center">
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Thanh toán thành công!
                                            </div>
                                        )}
                                        {isPendingPayment && !showPaymentSuccess && (
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