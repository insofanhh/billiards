import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AdminNavigation } from '../components/AdminNavigation';
import { useAuthStore } from '../store/authStore';
import { NotificationProvider } from '../contexts/NotificationContext';
import { RealtimeNotificationProvider } from '../contexts/RealtimeNotificationContext';
import { NotificationDrawer } from '../components/common/NotificationDrawer';

export function StaffLayout() {
    const { user, logout } = useAuthStore();

    useEffect(() => {
        if (user?.store) {
            console.log("StaffLayout check:", { 
                is_expired: user.store.is_expired, 
                is_active: user.store.is_active,
                expires_at: user.store.expires_at // if available
            });
            // Check if store is expired or inactive
            if (user.store.is_expired || user.store.is_active === false) {
                 console.warn("Redirecting to extend from StaffLayout due to expiry");
                 window.location.href = `/s/${user.store.slug}/extend`;
            }
        }
    }, [user]);

    return (
        <NotificationProvider>
            <RealtimeNotificationProvider>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <AdminNavigation userName={user?.name} userRoles={user?.roles} storeName={user?.store?.name} onLogout={logout} />
                    <Outlet />
                    <NotificationDrawer />
                </div>
            </RealtimeNotificationProvider>
        </NotificationProvider>
    );
}
