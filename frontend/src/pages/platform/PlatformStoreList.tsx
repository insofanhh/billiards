import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformClient } from '../../api/platformClient';

export const PlatformStoreList = () => {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await platformClient.get('/platform/stores');
                setStores(res.data.data);
            } catch (error) {
                console.error("Failed to fetch stores", error);
            } finally {
                setLoading(false);
            }
        };

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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Stores</h1>
                <Link to="/platform/stores/create" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Create Store
                </Link>
            </div>
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stores.map((store) => (
                            <tr key={store.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{store.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{store.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{store.slug}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{store.owner?.name || 'No Owner'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/platform/stores/${store.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                    <button 
                                        onClick={() => handleDelete(store.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
