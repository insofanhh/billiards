import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { echo } from '../echo';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

export interface NotificationItem {
    id: string; // Unique ID (e.g., event ID or constructed from orderId + timestamp)
    type: 'request' | 'service' | 'payment';
    tableId: number;
    tableName: string;
    orderId: number;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: any; // Extra data like transaction method, service items...
}

interface RealtimeNotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    handleNotificationClick: (notification: NotificationItem) => void;
    activeTab: 'request' | 'service' | 'payment';
    setActiveTab: (tab: 'request' | 'service' | 'payment') => void;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | undefined>(undefined);

export function RealtimeNotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'service' | 'payment'>('request');

    const addNotification = useCallback((item: NotificationItem) => {
        setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== item.id);
            return [item, ...filtered];
        });
        // Optional: Play sound here
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    useEffect(() => {
        if (!user) {
            console.log('RealtimeNotificationContext: No user, skipping subscription');
            return;
        }

        console.log('RealtimeNotificationContext: Subscribing to orders channel');
        const ordersChannel = echo.channel('orders');

        ordersChannel.subscribed(() => {
            console.log('RealtimeNotificationContext: Subscription confirmed for orders channel');
        });

        // const staffChannel = echo.private('staff'); // If needed for private events

        // 1. Table Requests (Open/Close)
        const handleOrderRequested = (data: any) => {
            addNotification({
                id: `req_${data.order?.id}`,
                type: 'request',
                tableId: data.table?.id || data.order?.table_id,
                tableName: data.table?.name || data.order?.table?.name || 'Bàn ?',
                orderId: data.order?.id,
                message: `Có yêu cầu mở bàn mới!`,
                timestamp: new Date(),
                read: false,
                data
            });
        };

        const handleOrderEndRequested = (data: any) => {
             addNotification({
                id: `req_end_${data.order?.id}`,
                type: 'request',
                tableId: data.table?.id || data.order?.table_id,
                tableName: data.table?.name || data.order?.table?.name || 'Bàn ?',
                orderId: data.order?.id,
                message: `Có yêu cầu thanh toán/kết thúc`,
                timestamp: new Date(),
                read: false,
                data
            });
        };

        // 2. Service Orders
        const handleServiceAdded = (data: any) => {
             addNotification({
                id: `srv_${Date.now()}_${data.order?.id}`,
                type: 'service',
                tableId: data.order?.table_id,
                tableName: data.order?.table?.name || 'Bàn ?',
                orderId: data.order?.id,
                message: `Có yêu cầu gọi dịch vụ mới!`,
                timestamp: new Date(),
                read: false,
                data
            });
        };

        // 3. Payment Requests (Transaction Created)
        const handleTransactionCreated = (data: any) => {
             // Relaxed check: Simply checking for transaction existence
             addNotification({
                id: `pay_${data.transaction?.id}`,
                type: 'payment',
                tableId: data.order?.table_id,
                tableName: data.order?.table?.name || 'Bàn ?',
                orderId: data.order?.id,
                message: `Có yêu cầu thanh toán${data.transaction?.method ? ` (${data.transaction.method === 'cash' ? 'Tiền mặt' : data.transaction.method === 'card' ? 'Thẻ' : 'CK'})` : ''}`,
                timestamp: new Date(),
                read: false,
                data
            });
        };


        ordersChannel.listen('.order.requested', handleOrderRequested);
        ordersChannel.listen('.order.end.requested', handleOrderEndRequested); // Maps to 'request' tab or 'payment'? User said "Yêu cầu mở bàn thì hiển thị bên tab Yêu cầu". "Yêu cầu thanh toán thì hiển thị bên tab Thanh toán".
        // Actually "Yêu cầu kết thúc" often implies payment or just stopping time. 
        // Let's put "Request End" in 'request' tab for now as "Stop Time Request", unless it has transaction. 
        // But user said: "Khi có thông báo từ yêu cầu thanh toán thì hiển thị bên tab: Thanh toán". "transaction.created" is definitely Payment.
        // "order.end.requested" is usually just "I want to stop". Let's put in 'request'.
        
        ordersChannel.listen('.order.service.added', handleServiceAdded);
        ordersChannel.listen('.transaction.created', handleTransactionCreated);

        return () => {
            ordersChannel.stopListening('.order.requested');
            ordersChannel.stopListening('.order.end.requested');
            ordersChannel.stopListening('.order.service.added');
            ordersChannel.stopListening('.transaction.created');
            echo.leave('orders');
        };
    }, [user, addNotification]);

    const handleNotificationClick = (notification: NotificationItem) => {
        markAsRead(notification.id);
        
        // Navigation Logic
        if (notification.type === 'request') {
             // Scroll to Table in HomePage
             // If not in HomePage, navigate there first
             const isHomePage = location.pathname === '/staff' || location.pathname.match(/^\/s\/[^/]+\/staff$/);
             
             if (!isHomePage) {
                 const targetPath = user?.store?.slug ? `/s/${user.store.slug}/staff` : '/staff';
                 navigate(targetPath);
                 // We need to wait for navigation to scroll. 
                 // Simple hack: Store target table ID in sessionStorage or URL search param to scroll after load?
                 // Or simple timeout.
                 setTimeout(() => {
                     const el = document.getElementById(`table-${notification.tableId}`);
                     if(el) {
                         el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                         el.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50'); // Highlight
                         setTimeout(() => el.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50'), 3000);
                     }
                 }, 500);
             } else {
                 const el = document.getElementById(`table-${notification.tableId}`);
                 if(el) {
                     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     el.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
                     setTimeout(() => el.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50'), 3000);
                 }
             }
        } else if (notification.type === 'service' || notification.type === 'payment') {
            // Navigate to Order Page
            const targetPath = user?.store?.slug 
                ? `/s/${user.store.slug}/staff/order/${notification.orderId}` 
                : `/order/${notification.orderId}`;
            navigate(targetPath);
        }
        
        // Don't close drawer immediately? User said "click vào thì chuyển đến...". 
        // Usually good to close drawer on mobile, keeps open on desktop? 
        // Let's close it for now to give clear view of content.
        setIsOpen(false); 
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <RealtimeNotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            isOpen, 
            setIsOpen, 
            markAsRead, 
            clearAll, 
            handleNotificationClick,
            activeTab,
            setActiveTab
        }}>
            {children}
        </RealtimeNotificationContext.Provider>
    );
}

export function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationContext);
  if (context === undefined) {
    throw new Error('useRealtimeNotifications must be used within a RealtimeNotificationProvider');
  }
  return context;
}
