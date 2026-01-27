import { useNavigate } from 'react-router-dom';
import type { Table } from '../../../types';
import { useTableActions } from '../../../hooks/useTableActions';
import { TableTimer } from '../../TableTimer';
import { getCurrentPriceRate } from '../../../utils/pricing';
// import { SerialConnectButton } from '../../common/SerialConnectButton';
// import { useWebSerial } from '../../../hooks/useWebSerial';

interface TableCardProps {
    table: Table;
    slug?: string;
    hasNotification?: boolean;
    onClick?: () => void;
}

const getStatusColorConfig = (statusName: string) => {
    switch (statusName) {
        case 'Trống': return { 
            border: 'border-green-500 dark:border-green-600', 
            badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
        };
        case 'Đang sử dụng': return { 
            border: 'border-red-500 dark:border-red-600', 
            badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
        };
        case 'Bảo trì': return { 
            border: 'border-yellow-500 dark:border-yellow-600', 
            badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
        };
        default: return { 
            border: 'border-gray-200 dark:border-gray-700', 
            badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
        };
    }
};

const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
        case 'cash': return 'Tiền mặt';
        case 'transfer': return 'Chuyển khoản';
        case 'card': return 'Thẻ';
        default: return method;
    }
};

export function TableCard({ table, slug, hasNotification, onClick }: TableCardProps) {
    const navigate = useNavigate();
    const { 
        createOrder, isCreating, 
        approveEnd, isApprovingEnd,
        approveOpen, isApprovingOpen,
        rejectOpen, isRejectingOpen
    } = useTableActions(undefined, slug);
    
    // Serial Hook
    // const { isConnected, sendCommand } = useWebSerial();

    const handleTableClick = (code: string) => {
        if (onClick) {
            onClick();
            return;
        }
        
        if (slug) {
            navigate(`/s/${slug}/staff/table/${code}`);
        } else {
            navigate(`/table/${code}`);
        }
    };

    const pendingOrder = table.pending_order || (table.active_order?.status === 'pending' ? table.active_order : null);
    const isPendingPayment = table.active_order?.status === 'completed';
    const activePriceRate = table.table_type.current_price_rate || getCurrentPriceRate(table.table_type.price_rates);
    const { border, badge } = getStatusColorConfig(table.status);

    return (
        <div
            onClick={() => handleTableClick(table.code)}
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${border} p-5 hover:shadow-lg cursor-pointer transition-all relative flex flex-col justify-between h-full`}
        >
            <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{table.code}</h3>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badge}`}>
                            {table.status}
                        </span>
                        {/* Serial Button for Demo/Debug */}
                        {/* <div onClick={e => e.stopPropagation()}>
                           <SerialConnectButton />
                        </div> */}
                    </div>
                </div>

                {/* Sub Info */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{table.name}</span>
                    {table.status === 'Đang sử dụng' && table.active_order && (
                        <div className="flex items-center text-red-500 font-mono text-sm">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <TableTimer startTime={table.active_order.start_at} />
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <p>Loại: <span className="text-gray-700 dark:text-gray-300 font-medium">{table.table_type.name}</span></p>
                    <p>Số ghế: <span className="text-gray-700 dark:text-gray-300 font-medium">{table.seats}</span></p>
                    <p>Vị trí: <span className="text-gray-700 dark:text-gray-300 font-medium">{table.location || 'N/A'}</span></p>
                    {activePriceRate && (
                        <p className="flex items-center pt-2">
                            Giá: <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activePriceRate.price_per_hour)}/h
                            </span>
                        </p>
                    )}
                    {table.status === 'Đang sử dụng' && table.active_order?.total_amount !== undefined && (
                        <p className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            Tạm tính: <span className="text-gray-900 dark:text-white font-bold text-lg float-right">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(table.active_order.total_amount)}
                            </span>
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto">
                {table.status === 'Trống' && !pendingOrder && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            createOrder({ table_code: table.code });
                            // if (isConnected) {
                            //     sendCommand(JSON.stringify({ action: 'ON', table_code: table.code }));
                            // }
                        }}
                        disabled={isCreating}
                        className={`w-full py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-slate-800 hover:shadow-lg active:scale-95 transform transition-all duration-200 ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isCreating ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            ) : (
                                <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </>
                            )}
                        </svg>
                        <span>{isCreating ? 'Đang mở...' : 'Mở bàn'}</span>
                    </button>
                )}
                {/* Approval Actions */}
                {pendingOrder && (
                    <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                rejectOpen(pendingOrder.id);
                            }}
                            disabled={isRejectingOpen}
                            className={`py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg flex items-center justify-center space-x-1 hover:bg-red-200 active:scale-95 transform transition-all duration-200 ${isRejectingOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                             <span>{isRejectingOpen ? 'Đang hủy...' : 'Hủy'}</span>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                approveOpen(pendingOrder.id);
                            }}
                            disabled={isApprovingOpen}
                            className={`py-2 bg-green-600 text-white rounded-lg flex items-center justify-center space-x-1 hover:bg-green-700 shadow-md hover:shadow-lg active:scale-95 transform transition-all duration-200 ${isApprovingOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className={`w-4 h-4 ${isApprovingOpen ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isApprovingOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                )}
                            </svg>
                            <span>{isApprovingOpen ? 'Đang duyệt...' : 'Duyệt'}</span>
                        </button>
                    </div>
                )}
                {table.status === 'Đang sử dụng' && (
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (table.active_order?.id) {
                                    navigate(slug ? `/s/${slug}/staff/order/${table.active_order.id}` : `/order/${table.active_order.id}`);
                                }
                            }}
                            className="py-2 bg-white border border-gray-300 text-gray-700 dark:bg-transparent dark:border-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center space-x-1 hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:scale-95 transform transition-all duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Thêm đồ</span>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (table.active_order?.id) {
                                    approveEnd(table.active_order.id);
                                    // if (isConnected) {
                                    //     sendCommand(JSON.stringify({ action: 'OFF', table_code: table.code }));
                                    // }
                                }
                            }}
                            disabled={isApprovingEnd}
                            className={`py-2 bg-slate-900 text-white dark:bg-slate-700 rounded-lg flex items-center justify-center space-x-1 hover:bg-slate-800 hover:shadow-lg active:scale-95 transform transition-all duration-200 ${isApprovingEnd ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className={`w-4 h-4 ${isApprovingEnd ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isApprovingEnd ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                            <span>{isApprovingEnd ? 'Đang xử lý...' : 'Thanh toán'}</span>
                        </button>
                    </div>
                )}
                {table.status === 'Bảo trì' && (
                    <button className="ml-auto w-max px-4 py-2 bg-slate-900 text-white dark:bg-slate-700 rounded-lg flex items-center justify-center space-x-2 hover:bg-slate-800 hover:shadow-lg active:scale-95 transform transition-all duration-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Hoàn tất</span>
                    </button>
                )}
            </div>
            
            {/* Notifications */}
            {hasNotification && (
                <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (table.active_order?.id) {
                                navigate(slug ? `/s/${slug}/staff/order/${table.active_order.id}` : `/order/${table.active_order.id}`);
                            }
                        }}
                        className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 cursor-pointer"
                    >
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold shadow-sm animate-pulse">
                            Có đơn mới
                        </span>
                    </div>
                </>
            )}
            {isPendingPayment && (
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (table.active_order?.id) {
                            navigate(slug ? `/s/${slug}/staff/order/${table.active_order.id}` : `/order/${table.active_order.id}`);
                        }
                    }}
                    className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 cursor-pointer"
                >
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold shadow-sm">
                        Chờ thanh toán
                        {(() => {
                            const transaction = table.active_order?.transactions?.find(t => t.status === 'pending');
                            if (transaction?.method) {
                                return ` (${getPaymentMethodLabel(transaction.method)})`;
                            }
                            return '';
                        })()}
                    </span>
                </div>
            )}

        </div>
    );
}
