import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformClient } from '../../api/platformClient';

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
            await platformClient.post('/platform/stores', formData);
            alert('Store created successfully');
            navigate('/platform/stores');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create store');
            if (err.response?.data?.errors) {
                setError(JSON.stringify(err.response.data.errors));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Create New Store</h1>
                <button 
                    onClick={() => navigate('/platform/stores')}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors border border-gray-600"
                >
                    Back to List
                </button>
            </div>
            
            <div className="bg-[#1a202c] p-8 rounded-xl border border-gray-700 shadow-xl">
                {error && <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6 border border-red-800 break-words">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Store Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Store Details</h3>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Store Name</label>
                                <input 
                                    type="text"
                                    name="store_name"
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                                    value={formData.store_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Billiards Pro Center"
                                />
                            </div>
                        </div>

                        {/* Owner Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-yellow-400 border-b border-gray-700 pb-2">Owner Account</h3>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Owner Name</label>
                                <input 
                                    type="text"
                                    name="owner_name"
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                                    value={formData.owner_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Owner Email</label>
                                <input 
                                    type="email"
                                    name="email"
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        {/* Security */}
                        <div className="space-y-4 md:col-span-2">
                             <h3 className="text-lg font-semibold text-purple-400 border-b border-gray-700 pb-2">Security</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                                    <input 
                                        type="password"
                                        name="password"
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                                    <input 
                                        type="password"
                                        name="password_confirmation"
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        required
                                        placeholder="Re-enter password"
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50 -mx-8 -mb-8 rounded-b-xl mt-6">
                        <button 
                            type="button" 
                            onClick={() => navigate('/platform/stores')}
                            className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-300 rounded-lg transition-colors border border-gray-600"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-6 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                            {loading ? 'Creating...' : 'Create Store'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
