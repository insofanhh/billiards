import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { tablesApi } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import type { Table } from '../types';
import { ordersApi } from '../api/orders';
import { statsApi } from '../api/stats';
import { echo } from '../echo';

import { TableCard } from '../components/staff/table/TableCard';
import { TableDetailModal } from '../components/staff/table/TableDetailModal';

// Helper to calculate duration 




export function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { slug } = useParams();

    useEffect(() => {
        if (!slug && user?.store?.slug) {
            navigate(`/s/${user.store.slug}/staff`, { replace: true });
        }
    }, [slug, user, navigate]);



    const queryClient = useQueryClient();
    const [tablesWithNotifications, setTablesWithNotifications] = useState<Set<number>>(new Set());
    const [hasInitialized, setHasInitialized] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [floorFilter, setFloorFilter] = useState('all');

    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['tables', slug],
        queryFn: () => tablesApi.getAll(slug),
    });

    const { data: dailyRevenueData } = useQuery({
        queryKey: ['dailyRevenue', slug],
        queryFn: () => statsApi.getDailyRevenue(),
        refetchInterval: 60000, // Refetch every minute
    });

    // Stats Calculation
    const stats = useMemo(() => {
        const total = tables.length;
        const active = tables.filter((t: Table) => t.status === 'Đang sử dụng').length;
        const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
        
        // Calculate estimated revenue from active tables
        // Use fetched daily revenue or fallback to 0
        const currentRevenue = dailyRevenueData?.revenue || 0;

        return { total, active, activePercentage, currentRevenue };
    }, [tables]);

    // Filtered Tables
    const filteredTables = useMemo(() => {
        return tables.filter((table: Table) => {
            const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  table.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
            const matchesFloor = floorFilter === 'all' || table.location === floorFilter;
            
            return matchesSearch && matchesStatus && matchesFloor;
        });
    }, [tables, searchTerm, statusFilter, floorFilter]);

    // Unique locations for filter
    const locations = useMemo(() => {
        const uniqueLocations = new Set<string>();
        tables.forEach((t: Table) => {
            if (t.location) {
                uniqueLocations.add(t.location);
            }
        });
        return Array.from(uniqueLocations).sort();
    }, [tables]);



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
                // Keep minimal error logging
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
            }
        };

        initializeNotifications();
    }, [user, tables, location.pathname]);

    // --- LOGIC REALTIME (CLEAN VERSION) ---
    useEffect(() => {
        if (!user) return;

        const ordersChannel = echo.channel('orders');

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
            }
        };

        const handleRefetch = () => {
            queryClient.invalidateQueries({ queryKey: ['tables', slug] });
            queryClient.refetchQueries({ queryKey: ['tables', slug] });
        };

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

                if (event === '.transaction.confirmed') {
                    const orderId = data.order?.id;
                    if (orderId) {
                        const currentTables = queryClient.getQueryData<Table[]>(['tables', slug]);
                        const table = currentTables?.find((t: Table) => t.active_order?.id === orderId);
                        if (table) {

                        }
                    }
                }

                if (event.includes('service')) {
                    const orderId = data.order?.id;
                    if (orderId) {
                        const currentTables = queryClient.getQueryData<Table[]>(['tables', slug]);
                        const table = currentTables?.find((t: Table) => t.active_order?.id === orderId);
                        if (table) {
                            checkOrderHasUnconfirmedItems(orderId, table.id);
                        }
                    }
                }
            });
        });

        return () => {
            ordersChannel.stopListeningToAll();
            echo.leave('orders');
        };
    }, [user, queryClient]);





    return (
        <>
            <main className="max-w-7xl mx-auto py-8">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-4 sm:px-0">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng bàn</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Đang sử dụng</p>
                            <div className="flex items-baseline space-x-2">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}/{stats.total}</h3>
                                <span className="text-sm text-gray-500">({stats.activePercentage}% Công suất)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Doanh thu tạm tính (Ca hiện tại)</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.currentRevenue)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filter & List Header */}
                <div className="px-4 sm:px-0">
                    <div className="mb-6">
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách bàn</h2>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input 
                                type="text"
                                placeholder="Tìm kiếm bàn..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative min-w-[150px]">
                                <select 
                                    className="w-full appearance-none pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    value={floorFilter}
                                    onChange={(e) => setFloorFilter(e.target.value)}
                                >
                                    <option value="all">Khu vực</option>
                                    {locations.map(location => (
                                        <option key={location} value={location}>{location}</option>
                                    ))}
                                </select>
                                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <div className="relative min-w-[150px]">
                                <select 
                                    className="w-full appearance-none pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Trạng thái</option>
                                    <option value="Trống">Trống</option>
                                    <option value="Đang sử dụng">Đang sử dụng</option>
                                    <option value="Bảo trì">Bảo trì</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="text-center py-12">
                            {user?.roles?.some((role: string) => ['super_admin', 'admin'].includes(role)) ? (
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    Chưa có bàn. Vui lòng tạo trong <a href="/admin" className="text-blue-600 hover:underline">Trang quản trị</a>!
                                </p>
                            ) : (
                                <p className="text-lg text-gray-600 dark:text-gray-400">Chưa có bàn. Vui lòng liên hệ quản trị viên để tạo bàn!</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTables.map((table: Table) => {
                                const hasNotification = tablesWithNotifications.has(table.id);
                                const currentPath = location.pathname;
                                const isViewingOrderDetail = table.active_order?.id && currentPath === `/order/${table.active_order.id}`;
                                const showNotification = !!(hasNotification && !isViewingOrderDetail && table.active_order);

                                return (
                                    <div id={`table-${table.id}`} key={table.id} className="h-full">
                                        <TableCard 
                                            table={table}
                                            slug={slug}
                                            hasNotification={showNotification}
                                            onClick={() => setSelectedTable(table)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                {selectedTable && (
                    <TableDetailModal
                        table={selectedTable}
                        isOpen={!!selectedTable}
                        onClose={() => setSelectedTable(null)}
                        slug={slug}
                    />
                )}
                </div>
            </main>
        </>
    );
}

