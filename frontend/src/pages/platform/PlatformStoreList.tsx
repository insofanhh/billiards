import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformClient } from '../../api/platformClient';

export const PlatformStoreList = () => {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const fetchStores = async (page = 1) => {
        setLoading(true);
        try {
            const res = await platformClient.get('/platform/stores', { params: { page } });
            setStores(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            console.error("Failed to fetch stores", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this store? include data')) return;
        try {
            await platformClient.delete(`/platform/stores/${id}`);
            setStores(stores.filter(s => s.id !== id));
            alert('Store deleted successfully');
        } catch (error) {
            console.error("Failed to delete store", error);
            alert('Failed to delete store');
        }
    };

    const handleToggleStatus = async (store: any) => {
        const action = store.is_active ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this store?`)) return;
        
        try {
            await platformClient.put(`/platform/stores/${store.id}`, {
                ...store,
                is_active: !store.is_active
            });
            
            // Update local state
            setStores(stores.map(s => s.id === store.id ? { ...s, is_active: !s.is_active } : s));
            alert(`Store ${action}d successfully`);
        } catch (error: any) {
            console.error(`Failed to ${action} store`, error);
            const message = error.response?.data?.message || `Failed to ${action} store`;
            const errors = error.response?.data?.errors;
            if (errors) {
                alert(`${message}\n${JSON.stringify(errors)}`);
            } else {
                alert(message);
            }
        }
    };



    return (
        <div>
            {/* Page Heading */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">Store Management</h2>
                    <p className="text-[#617589] text-sm">Review, verify, and manage all retail partners on the platform.</p>
                </div>
                <Link 
                    to="/platform/stores/create"
                    className="flex items-center justify-center gap-2 bg-[#137fec] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-[#137fec]/90 transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Add New Store</span>
                </Link>
            </div>

            {/* Tabs Section */}
            <div className="mb-6 border-b border-[#dbe0e6] dark:border-gray-800">
                <div className="flex gap-8">
                    <a className="flex flex-col items-center border-b-[3px] border-[#137fec] text-[#137fec] pb-3 transition-all" href="#">
                        <span className="text-sm font-bold">All Stores</span>
                    </a>
                    <a className="flex flex-col items-center border-b-[3px] border-transparent text-[#617589] pb-3 hover:text-[#111418] transition-all" href="#">
                        <span className="text-sm font-bold">Active</span>
                    </a>
                    <a className="flex flex-col items-center border-b-[3px] border-transparent text-[#617589] pb-3 hover:text-[#111418] transition-all" href="#">
                        <span className="text-sm font-bold">Pending</span>
                    </a>
                    <a className="flex flex-col items-center border-b-[3px] border-transparent text-[#617589] pb-3 hover:text-[#111418] transition-all" href="#">
                        <span className="text-sm font-bold">Suspended</span>
                    </a>
                </div>
            </div>

            {/* Toolbar / Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <div className="flex flex-1 min-w-[300px] items-center gap-2 px-3 py-2 bg-[#f0f2f4] dark:bg-gray-800 rounded-lg border border-transparent focus-within:border-[#137fec] focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-[#617589]">search</span>
                    <input 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-[#617589] outline-none" 
                        placeholder="Search stores by name, owner, or ID..." 
                        type="text"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#617589] uppercase tracking-wider">Filter By:</span>
                        <select className="form-select bg-white dark:bg-gray-800 border-[#dbe0e6] dark:border-gray-700 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] py-2 px-4 pr-10 outline-none">
                            <option>All</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-900 border border-[#dbe0e6] dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#dbe0e6] dark:border-gray-800">
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Store Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider">Joined Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#617589] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : stores.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No stores found.</td></tr>
                        ) : (
                            stores.map((store) => (
                                <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-[#111418] dark:text-white">{store.name}</span>
                                            <span className="text-xs text-[#617589]">ID: #{store.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-[#137fec]/20 flex items-center justify-center text-[#137fec] font-bold text-xs uppercase">
                                                {store.owner?.name ? store.owner.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="text-sm text-[#111418] dark:text-gray-300">{store.owner?.name || 'No Owner'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[#111418] dark:text-gray-300 capitalize">
                                            {store.store_type || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            store.is_active 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {store.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[#617589]">
                                            {new Date().toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleToggleStatus(store)}
                                                className={`p-1.5 rounded-lg transition-all ${
                                                    store.is_active 
                                                        ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                                                        : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                }`}
                                                title={store.is_active ? "Deactivate Store" : "Activate Store"}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {store.is_active ? 'block' : 'check_circle'}
                                                </span>
                                            </button>
                                            <Link to={`/platform/stores/${store.id}`} className="p-1.5 text-[#617589] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-all" title="View Details">
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </Link>
                                            <Link to={`/platform/stores/${store.id}`} className="p-1.5 text-[#617589] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-all" title="Edit Store">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(store.id)}
                                                className="p-1.5 text-[#617589] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                                title="Delete Store"
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
                    <p className="text-xs text-[#617589]">Showing {stores.length} of {pagination.total} stores</p>
                    <div className="flex gap-1">
                        <button 
                            disabled={pagination.current_page === 1}
                            onClick={() => fetchStores(pagination.current_page - 1)}
                            className="p-2 border border-[#dbe0e6] dark:border-gray-700 rounded-lg text-[#617589] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="flex items-center px-3 text-sm font-medium text-[#617589]">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        <button 
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => fetchStores(pagination.current_page + 1)}
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
