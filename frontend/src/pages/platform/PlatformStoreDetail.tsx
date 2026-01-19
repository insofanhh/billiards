import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { platformClient } from '../../api/platformClient';

export const PlatformStoreDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const res = await platformClient.get(`/platform/stores/${id}`);
                setStore(res.data);
                setName(res.data.name);
                setSlug(res.data.slug);
            } catch (error) {
                console.error("Failed to fetch store", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [id]);

    const handleSave = async () => {
        try {
            await platformClient.put(`/platform/stores/${id}`, {
                name,
                slug
            });
            alert('Updated successfully');
            navigate('/platform/stores');
        } catch (error) {
            alert('Failed to update');
            console.error(error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!store) return <div>Store not found</div>;

    return (
        <div className="bg-white p-6 rounded shadow max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Edit Store: {store.name}</h1>
            
            <div className="mb-4">
                <label className="block text-gray-700">Store Name</label>
                <input 
                    type="text" 
                    className="w-full border p-2 rounded mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700">Slug (URL)</label>
                <input 
                    type="text" 
                    className="w-full border p-2 rounded mt-1"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                />
            </div>

            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Save Changes
            </button>
        </div>
    );
};
