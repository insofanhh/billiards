import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { platformClient } from '../../api/platformClient';

export const PlatformStoreDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        is_active: true,
        expires_at: '',
        birthday: '',
        cccd: '',
        phone_contact: '',
        email_contact: '',
        country: 'Vietnam',
        province: '',
        ward: '',
        address_detail: ''
    });

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const res = await platformClient.get(`/platform/stores/${id}`);
                const data = res.data;
                setFormData({
                    name: data.name || '',
                    slug: data.slug || '',
                    is_active: data.is_active,
                    expires_at: data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : '',
                    birthday: data.birthday || '',
                    cccd: data.cccd || '',
                    phone_contact: data.phone_contact || '',
                    email_contact: data.email_contact || '',
                    country: data.country || 'Vietnam',
                    province: data.province || '',
                    ward: data.ward || '',
                    address_detail: data.address_detail || ''
                });
            } catch (error) {
                console.error("Failed to fetch store", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSave = async () => {
        try {
            await platformClient.put(`/platform/stores/${id}`, {
                ...formData,
                is_active: Boolean(formData.is_active) // Ensure boolean
            });
            alert('Updated successfully');
            navigate('/platform/stores');
        } catch (error) {
            alert('Failed to update');
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Edit Store Details</h1>
                <button 
                    onClick={() => navigate('/platform/stores')}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                    Back to List
                </button>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Basic Information</h3>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Store Name</label>
                            <input 
                                type="text" name="name" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.name} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Slug (URL)</label>
                            <input 
                                type="text" name="slug" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.slug} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <select 
                                name="is_active" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.is_active ? '1' : '0'} 
                                onChange={(e) => setFormData({...formData, is_active: e.target.value === '1'})}
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-green-400 border-b border-gray-700 pb-2">Subscription</h3>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Expires At</label>
                            <input 
                                type="datetime-local" name="expires_at" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.expires_at} onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-yellow-400 border-b border-gray-700 pb-2">Owner Profile</h3>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Birthday</label>
                            <input 
                                type="date" name="birthday" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.birthday} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">CCCD / ID Card</label>
                            <input 
                                type="text" name="cccd" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.cccd} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact Phone</label>
                            <input 
                                type="text" name="phone_contact" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.phone_contact} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact Email</label>
                            <input 
                                type="email" name="email_contact" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.email_contact} onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Address Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-purple-400 border-b border-gray-700 pb-2">Address</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Country</label>
                                <input 
                                    type="text" name="country" 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.country} onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Province/City</label>
                                <input 
                                    type="text" name="province" 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.province} onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Ward</label>
                                <input 
                                    type="text" name="ward" 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.ward} onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Address Detail</label>
                            <input 
                                type="text" name="address_detail" 
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                value={formData.address_detail} onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4 border-t border-gray-700 pt-6">
                    <button 
                         onClick={() => navigate('/platform/stores')}
                        className="px-6 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
