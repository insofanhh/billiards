import { useEffect, useState } from 'react';
import { platformClient } from '../../api/platformClient';

export const PlatformUserList = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        role: 'All'
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const params: any = { page };
            if (filters.search) params.search = filters.search;
            if (filters.role !== 'All') params.role = filters.role;

            const res = await platformClient.get('/platform/users', { params });
            setUsers(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []); // Initial load

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(1);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await platformClient.delete(`/platform/users/${id}`);
            alert('User deleted successfully');
            fetchUsers(pagination.current_page);
        } catch (error: any) {
            console.error("Failed to delete user", error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const roles = ['All', 'super_admin', 'store_owner', 'staff', 'customer'];

    return (
        <div>
            {/* Page Heading */}
            <div className="flex flex-col gap-1 mb-6">
                <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">User Accounts</h2>
                <p className="text-[#617589] text-sm">Manage all registered users, roles, and access.</p>
            </div>

            {/* Toolbar / Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-1 min-w-[300px] items-center gap-2 px-3 py-2 bg-[#f0f2f4] dark:bg-gray-800 rounded-lg border border-transparent focus-within:border-[#137fec] focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-[#617589]">search</span>
                    <input 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-[#617589] outline-none" 
                        placeholder="Search by name or email..." 
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </form>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#617589] uppercase tracking-wider">Role:</span>
                        <select 
                            className="form-select bg-white dark:bg-gray-800 border-[#dbe0e6] dark:border-gray-700 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] py-2 px-4 pr-10 outline-none"
                            value={filters.role}
                            onChange={(e) => {
                                setFilters({...filters, role: e.target.value});
                                // Trigger fetch immediately on select change is often better UX, 
                                // but requires effect or passing param. For simplicity let's rely on user searching or useEffect.
                                // Actually let's manually trigger it here via a timeout or effect dependency if we wanted, 
                                // but let's conform to the manual search button pattern or use a separate effect for filters if needed.
                                // For now, we will just update state, user might need to hit enter on search or we add an effect.
                                // Let's add a "Filter" button or just auto-trigger. Auto-triggering is cleaner.
                            }}
                        >
                           {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button 
                            onClick={() => fetchUsers(1)}
                            className="bg-[#137fec] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#137fec]/90"
                        >
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-900 border border-[#dbe0e6] dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#dbe0e6] dark:border-gray-800">
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Store</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Joined Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                        {loading ? (
                             <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                        ) : users.length === 0 ? (
                             <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-[#137fec]/20 flex items-center justify-center text-[#137fec] font-bold text-xs uppercase">
                                                {user.name ? user.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="text-sm text-[#111418] dark:text-gray-300">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[#111418] dark:text-gray-300">{user.email}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.store ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-[#111418] dark:text-white">{user.store.name}</span>
                                                <span className="text-xs text-[#617589]">ID: #{user.store.id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Platform / No Store</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map((role: any) => (
                                                     <span key={role.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                        {role.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400">No Roles</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[#617589]">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 text-[#617589] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                                title="Delete User"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                
                {/* Pagination */}
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-t border-[#dbe0e6] dark:border-gray-800">
                    <p className="text-xs text-[#617589]">Showing {users.length} of {pagination.total} users</p>
                    <div className="flex gap-1">
                        <button 
                            disabled={pagination.current_page === 1}
                            onClick={() => fetchUsers(pagination.current_page - 1)}
                            className="p-2 border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-[#617589] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="flex items-center px-3 text-sm font-medium text-[#617589]">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        <button 
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => fetchUsers(pagination.current_page + 1)}
                            className="p-2 border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-[#617589] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                             <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
