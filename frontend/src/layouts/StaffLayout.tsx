import { Outlet } from 'react-router-dom';
import { AdminNavigation } from '../components/AdminNavigation';
import { useAuthStore } from '../store/authStore';

export function StaffLayout() {
    const { user, logout } = useAuthStore();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <AdminNavigation userName={user?.name} userRoles={user?.roles} onLogout={logout} />
            <Outlet />
        </div>
    );
}
