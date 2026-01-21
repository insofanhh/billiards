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

    if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-sans text-[#111418] dark:text-white">
            {/* Side Navigation */}
            <aside className="w-64 border-r border-[#dbe0e6] dark:border-gray-800 bg-white dark:bg-[#101922] flex flex-col justify-between p-4">
                <div className="flex flex-col gap-6">
                    <div className="flex gap-3 items-center px-2">
                        <div 
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200" 
                            style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=Admin+Panel&background=random")' }}
                        ></div>
                        <div className="flex flex-col overflow-hidden">
                            <h1 className="text-[#111418] dark:text-white text-base font-semibold leading-tight truncate">Admin Panel</h1>
                            <p className="text-[#617589] text-xs font-normal">{user.name}</p>
                        </div>
                    </div>
                    
                    <nav className="flex flex-col gap-1">
                        <Link 
                            to="/platform/dashboard" 
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive('/platform/dashboard') 
                                ? 'bg-[#137fec]/10 text-[#137fec]' 
                                : 'text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${isActive('/platform/dashboard') ? 'active-icon' : ''}`}>dashboard</span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        
                        <Link 
                            to="/platform/stores" 
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive('/platform/stores') 
                                ? 'bg-[#137fec]/10 text-[#137fec]' 
                                : 'text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${isActive('/platform/stores') ? 'active-icon' : ''}`}>storefront</span>
                            <span className="text-sm font-medium">Store Management</span>
                        </Link>

                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined">group</span>
                            <span className="text-sm font-medium">User Accounts</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined">analytics</span>
                            <span className="text-sm font-medium">Analytics</span>
                        </a>

                        <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>

                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined">settings</span>
                            <span className="text-sm font-medium">Settings</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined">help</span>
                            <span className="text-sm font-medium">Help Center</span>
                        </a>
                    </nav>
                </div>

                <div className="px-2 pb-2">
                    <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2 text-[#617589] hover:text-red-500 transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto scroll-smooth">
                 <div className="max-w-[1200px] mx-auto p-8">
                    <Outlet />
                 </div>
            </main>
        </div>
    );
};
