import { useState, useEffect } from 'react';
import { platformClient } from '../../../api/platformClient';

interface StoreDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: number | null;
    isReadOnly?: boolean;
    onSaveSuccess: () => void;
}

export const StoreDetailModal = ({ isOpen, onClose, storeId, isReadOnly = false, onSaveSuccess }: StoreDetailModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
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
        if (isOpen && storeId) {
            fetchStore(storeId);
        } else {
            // Reset form when closed or no id
            setFormData({
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
        }
    }, [isOpen, storeId]);

    const fetchStore = async (id: number) => {
        setFetching(true);
        try {
            const res = await platformClient.get(`/platform/stores/${id}`);
            const data = res.data;
            setFormData({
                name: data.name || '',
                slug: data.slug || '',
                is_active: data.is_active ?? true,
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
            alert("Failed to load store data");
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSave = async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            await platformClient.put(`/platform/stores/${storeId}`, {
                ...formData,
                is_active: Boolean(formData.is_active)
            });
            alert('Updated successfully');
            onSaveSuccess();
            onClose();
        } catch (error) {
            alert('Failed to update');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1a202c] dark:bg-[#1a202c] w-full max-w-4xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-[#1a202c]">
                    <h3 className="text-xl font-bold text-white">Store Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {fetching ? (
                        <div className="flex justify-center items-center h-40">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            {/* Basic Info */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-blue-400 uppercase text-xs tracking-wider border-b border-gray-700 pb-1 mb-2">Basic Information</h4>
                                <div>
                                    <label className="block text-gray-400 mb-1">Store Name</label>
                                    <input 
                                        type="text" name="name" 
                                        disabled={isReadOnly}
                                        className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                        value={formData.name} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Slug (URL)</label>
                                    <input 
                                        type="text" name="slug" 
                                        disabled={isReadOnly}
                                        className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                        value={formData.slug} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Status</label>
                                    <select 
                                        name="is_active" 
                                        disabled={isReadOnly}
                                        className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors appearance-none disabled:opacity-70 disabled:cursor-not-allowed`}
                                        value={formData.is_active ? '1' : '0'} 
                                        onChange={(e) => setFormData({...formData, is_active: e.target.value === '1'})}
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Subscription */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-green-400 uppercase text-xs tracking-wider border-b border-gray-700 pb-1 mb-2">Subscription</h4>
                                <div>
                                    <label className="block text-gray-400 mb-1">Expires At</label>
                                    <input 
                                        type="datetime-local" name="expires_at" 
                                        disabled={isReadOnly}
                                        className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                        value={formData.expires_at} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 md:col-span-2">
                                <h4 className="font-semibold text-yellow-400 uppercase text-xs tracking-wider border-b border-gray-700 pb-1 mb-2">Owner Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 mb-1">Date of Birth</label>
                                        <input 
                                            type="date" name="birthday" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.birthday} onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">ID Card / Citizen ID</label>
                                        <input 
                                            type="text" name="cccd" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.cccd} onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Contact Phone</label>
                                        <input 
                                            type="text" name="phone_contact" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.phone_contact} onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Contact Email</label>
                                        <input 
                                            type="email" name="email_contact" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.email_contact} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="space-y-3 md:col-span-2">
                                <h4 className="font-semibold text-purple-400 uppercase text-xs tracking-wider border-b border-gray-700 pb-1 mb-2">Address</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-400 mb-1">Country</label>
                                        <input 
                                            type="text" name="country" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.country} onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Province / City</label>
                                        <input 
                                            type="text" name="province" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.province} onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Ward</label>
                                        <input 
                                            type="text" name="ward" 
                                            disabled={isReadOnly}
                                            className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                            value={formData.ward} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <label className="block text-gray-400 mb-1">Address Detail</label>
                                    <input 
                                        type="text" name="address_detail" 
                                        disabled={isReadOnly}
                                        className={`w-full bg-gray-800 border ${isReadOnly ? 'border-transparent' : 'border-gray-600'} rounded px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                                        value={formData.address_detail} onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                    {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-300 rounded-lg transition-colors border border-gray-600"
                    >
                        Close
                    </button>
                    {!isReadOnly && (
                         <button 
                            onClick={handleSave}
                            disabled={loading || fetching}
                            className="px-4 py-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 "
                        >
                            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
