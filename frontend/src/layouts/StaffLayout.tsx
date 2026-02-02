import { Outlet } from 'react-router-dom';
import { AdminNavigation } from '../components/AdminNavigation';
import { useAuthStore } from '../store/authStore';
import { NotificationProvider } from '../contexts/NotificationContext';
import { RealtimeNotificationProvider } from '../contexts/RealtimeNotificationContext';
import { NotificationDrawer } from '../components/common/NotificationDrawer';

export function StaffLayout() {
    const { user, logout } = useAuthStore();

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
