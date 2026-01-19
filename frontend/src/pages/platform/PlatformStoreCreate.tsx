import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const PlatformStoreCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        store_name: '',
        owner_name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('platform_token');
            await axios.post('http://localhost:8000/api/platform/stores', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Store created successfully');
            navigate('/platform/stores');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create store');
            if (err.response?.data?.errors) {
                // simple error display
                setError(JSON.stringify(err.response.data.errors));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Store</h1>
            
            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 break-words">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">Store Name</label>
                    <input 
                        type="text"
                        name="store_name"
                        className="w-full border p-2 rounded mt-1"
                        value={formData.store_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">Owner Name</label>
                    <input 
                        type="text"
                        name="owner_name"
                        className="w-full border p-2 rounded mt-1"
                        value={formData.owner_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">Owner Email</label>
                    <input 
                        type="email"
                        name="email"
                        className="w-full border p-2 rounded mt-1"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input 
                        type="password"
                        name="password"
                        className="w-full border p-2 rounded mt-1"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700">Confirm Password</label>
                    <input 
                        type="password"
                        name="password_confirmation"
                        className="w-full border p-2 rounded mt-1"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button 
                        type="button" 
                        onClick={() => navigate('/platform/stores')}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Store'}
                    </button>
                </div>
            </form>
        </div>
    );
};
