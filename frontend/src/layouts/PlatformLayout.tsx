import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { platformClient } from '../api/platformClient';

export const PlatformLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('platform_token');
        if (!token) {
            navigate('/platform/login');
            return;
        }

        // Simple check or fetch user
        platformClient.get('/platform/me')
        .then(res => {
            setUser(res.data);
        }).catch(() => {
            localStorage.removeItem('platform_token');
            navigate('/platform/login');
        });
    }, [navigate]);

    const handleLogout = () => {
        platformClient.post('/platform/logout')
        .finally(() => {
            localStorage.removeItem('platform_token');
            navigate('/platform/login');
        });
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white">
                <div className="p-4 text-xl font-bold">Platform Admin</div>
                <nav className="mt-4">
                    <Link to="/platform/dashboard" className={`block py-2 px-4 hover:bg-gray-800 ${location.pathname.includes('dashboard') ? 'bg-gray-800' : ''}`}>
                        Dashboard
                    </Link>
                    <Link to="/platform/stores" className={`block py-2 px-4 hover:bg-gray-800 ${location.pathname.includes('stores') ? 'bg-gray-800' : ''}`}>
                        Stores
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-4 mb-4">
                   <div className="mb-4 text-sm text-gray-400">Logged in as {user.name}</div>
                   <button onClick={handleLogout} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-center">Logout</button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
