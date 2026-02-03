import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { echo } from '../echo';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient as axiosClient } from '../api/client';

export interface NotificationItem {
    id: string; // Unique ID
    type: 'request' | 'service' | 'payment';
    tableId: number;
    tableName: string;
    orderId: number;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: any;
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
    const { user, token } = useAuthStore();
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

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await axiosClient.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const clearAll = async () => {
        // Optimistic update: remove notifications match activeTab
        setNotifications(prev => prev.filter(n => n.type !== activeTab));
        try {
            await axiosClient.post('/notifications/clear', { type: activeTab });
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    // Fetch initial notifications
    useEffect(() => {
        const storeId = user?.store_id || user?.store?.id;
        if (!storeId) return;

        const fetchNotifications = async () => {
            try {
                const { data } = await axiosClient.get('/notifications');
                const items = data.map((n: any) : NotificationItem => ({
                    id: n.id.toString(),
                    type: n.type,
                    tableId: n.data?.table_id,
                    tableName: n.title.replace('Bàn ', ''),
                    orderId: n.data?.order_id,
                    message: n.message,
                    timestamp: new Date(n.created_at),
                    read: !!n.read_at,
                    data: n.data
                }));
                // Merge with existing? Or just set? Initial load -> set.
                setNotifications(items);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        fetchNotifications();
    }, [user?.store_id, user?.store?.id]);

    // Socket Subscription
    useEffect(() => {
        const storeId = user?.store_id || user?.store?.id;
        
        if (!storeId || !token) {
            return;
        }

        // Use private channel for authenticated store events
        const channel = echo.private(`store.${storeId}`);

        const handleNotificationCreated = (e: any) => {
             const n = e.notification;
             if (!n) return;

             const item: NotificationItem = {
                id: n.id.toString(),
                type: n.type,
                tableId: n.data?.table_id,
                tableName: n.title.replace('Bàn ', ''),
                orderId: n.data?.order_id,
                message: n.message,
                timestamp: new Date(n.created_at),
                read: !!n.read_at,
                data: n.data
             };
             addNotification(item);
        };

        channel.listen('.notification.created', handleNotificationCreated);
        channel.listen('notification.created', handleNotificationCreated);
        
        return () => {
            channel.stopListening('.notification.created');
            channel.stopListening('notification.created');
            echo.leave(`store.${storeId}`);
        };
    }, [user, token, addNotification]);

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
