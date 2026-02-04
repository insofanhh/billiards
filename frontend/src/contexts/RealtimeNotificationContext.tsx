import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { echo } from '../echo';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient as axiosClient } from '../api/client';

export interface NotificationItem {
    id: string; // Unique ID
    type: 'request' | 'service' | 'payment' | 'payment_success';
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
        
        // Notification Sound / TTS Logic
        if (item.type === 'payment_success') {
            try {
                // Text-to-Speech for Payment Success
                const utterance = new SpeechSynthesisUtterance(item.message);
                
                // Optimized Voice Selection
                const voices = window.speechSynthesis.getVoices();
                // Priority: Google Vietnamese -> Microsoft Vietnamese -> Any Vietnamese
                const vnVoice = voices.find(v => v.lang.includes('vi') && v.name.includes('Google')) 
                             || voices.find(v => v.lang.includes('vi') && v.name.includes('Vietton')) // Microsoft typically
                             || voices.find(v => v.lang.includes('vi'));
                             
                if (vnVoice) {
                    utterance.voice = vnVoice;
                }
                
                utterance.lang = 'vi-VN';
                utterance.rate = 1.0;

                // Play Ting sound first
                const tingAudio = new Audio('/ting.mp3');
                tingAudio.play()
                    .then(() => {
                        // Wait for sound to finish or mostly finish before speaking
                        tingAudio.onended = () => {
                             window.speechSynthesis.speak(utterance);
                        };
                        // Fallback in case onended doesn't fire for some reason (e.g. very short)
                        setTimeout(() => {
                            if (!window.speechSynthesis.speaking) {
                                // Double check status to avoid double speak if onended worked
                                // Actually safest to just rely on onended for standard audio
                            }
                        }, 2000);
                    })
                    .catch(e => {
                        console.error('Error playing ting.mp3, falling back to clean TTS', e);
                        window.speechSynthesis.speak(utterance);
                    });

            } catch (error) {
                console.error('Failed to play TTS', error);
                 // Fallback to ping
                 try {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(e => console.error('Error playing sound:', e));
                } catch(e) {}
            }
        } else {
            // Standard Ping for others
            try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.error('Error playing sound:', e));
            } catch (error) {
                console.error('Failed to initialize audio', error);
            }
        }
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
        // Treat payment_success as payment tab

        setNotifications(prev => prev.filter(n => {
            if (activeTab === 'payment') {
                return n.type !== 'payment' && n.type !== 'payment_success';
            }
            return n.type !== activeTab;
        }));
        
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
        
        return () => {
             channel.stopListening('.notification.created');
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
        } else if (notification.type === 'service' || notification.type === 'payment' || notification.type === 'payment_success') {
            // Navigate to Order Page
            const targetPath = user?.store?.slug 
                ? `/s/${user.store.slug}/staff/order/${notification.orderId}?view=bill` 
                : `/order/${notification.orderId}?view=bill`;
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
