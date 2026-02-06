import { useState, useEffect } from 'react';
import { platformClient } from '../../api/platformClient';
import { useNotification } from '../../contexts/NotificationContext';
import { toast } from 'react-hot-toast';

interface SeoSettings {
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    support_messenger?: string;
    support_hotline?: string;
    support_youtube?: string;
    support_telegram?: string;
    learn_more_url?: string;
    trial_days?: number;
    bank_name?: string;
    bank_account?: string;
    bank_account_name?: string;
    sepay_api_key?: string;
    sepay_webhook_token?: string;
}

export const PlatformSettings = () => {
    const { showNotification } = useNotification();
    const [settings, setSettings] = useState<SeoSettings>({
        seo_title: '',
        seo_description: '',
        seo_keywords: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        platformClient.get('/platform/settings')
            .then(res => {
                setSettings({
                    seo_title: res.data.seo_title || '',
                    seo_description: res.data.seo_description || '',
                    seo_keywords: res.data.seo_keywords || '',
                    support_messenger: res.data.support_messenger || '',
                    support_hotline: res.data.support_hotline || '',
                    support_youtube: res.data.support_youtube || '',
                    support_telegram: res.data.support_telegram || '',
                    learn_more_url: res.data.learn_more_url || '',
                    trial_days: res.data.trial_days || 7,
                    bank_name: res.data.bank_name || '',
                    bank_account: res.data.bank_account || '',
                    bank_account_name: res.data.bank_account_name || '',
                    sepay_api_key: res.data.sepay_api_key || '',
                    sepay_webhook_token: res.data.sepay_webhook_token || '',
                });
            })
            .catch(() => {
                toast.error('Failed to load settings');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await platformClient.put('/platform/settings', settings);
            toast.success('Settings updated successfully');
        } catch {
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-gray-400 p-6">Loading settings...</div>;

    const InputField = ({ label, value, onChange, placeholder, type = "text", maxLength, readOnly = false }: any) => (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                readOnly={readOnly}
                disabled={readOnly}
                className={`w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            </div>

            {/* Trial Configuration */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Trial Configuration</h2>
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Default Trial Period (Days)
                    </label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input
                                type="number"
                                min="0"
                                value={settings.trial_days ?? 0}
                                onChange={(e) => setSettings({ ...settings, trial_days: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Number of days a new store can use the platform for free.</p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>

            {/* SEO Configuration */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Homepage SEO Configuration</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField 
                        label="Page Title"
                        value={settings.seo_title}
                        onChange={(e: any) => setSettings({ ...settings, seo_title: e.target.value })}
                        maxLength={60}
                        placeholder="e.g. Billiards CMS - Professional Management Platform"
                    />
                    <p className="-mt-3 text-xs text-gray-500">Max 60 characters. Displayed on browser tab and Google search results.</p>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Meta Description
                        </label>
                        <textarea
                            value={settings.seo_description}
                            onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                            maxLength={160}
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="A brief description of your page..."
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Max 160 characters. Summary of the page content.</p>
                    </div>

                    <InputField 
                        label="Meta Keywords"
                        value={settings.seo_keywords}
                        onChange={(e: any) => setSettings({ ...settings, seo_keywords: e.target.value })}
                        placeholder="billiards, cms, management, software"
                    />
                    <p className="-mt-3 text-xs text-gray-500">Comma separated keywords.</p>

                    <InputField 
                        label="Learn More URL (Home Button)"
                        value={settings.learn_more_url || ''}
                        onChange={(e: any) => setSettings({ ...settings, learn_more_url: e.target.value })}
                        placeholder="https://example.com/learn-more"
                    />

                    <div className="pt-4 flex justify-end border-t border-gray-700 mt-6">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Payment Configuration */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Payment & SePay Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Bank Name"
                        value={settings.bank_name || ''}
                        onChange={(e: any) => setSettings({ ...settings, bank_name: e.target.value })}
                        placeholder="e.g. MB Bank"
                    />
                    <InputField 
                        label="Bank Account Number"
                        value={settings.bank_account || ''}
                        onChange={(e: any) => setSettings({ ...settings, bank_account: e.target.value })}
                        placeholder="e.g. 0123456789"
                    />
                    <InputField 
                        label="Account Holder Name"
                        value={settings.bank_account_name || ''}
                        onChange={(e: any) => setSettings({ ...settings, bank_account_name: e.target.value })}
                        placeholder="e.g. NGUYEN VAN A"
                    />
                    <InputField 
                        label="SePay API Key"
                        value={settings.sepay_api_key || ''}
                        onChange={(e: any) => setSettings({ ...settings, sepay_api_key: e.target.value })}
                        placeholder="SePay API Key"
                    />
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Webhook URL (Auto-generated)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={settings.sepay_webhook_token ? `${window.location.protocol}//${window.location.hostname}:8000/api/webhook/platform/sepay/${settings.sepay_webhook_token}` : ''}
                                readOnly
                                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-gray-400 cursor-not-allowed font-mono text-sm"
                            />
                             <button
                                onClick={() => {
                                    const url = settings.sepay_webhook_token ? `${window.location.protocol}//${window.location.hostname}:8000/api/webhook/platform/sepay/${settings.sepay_webhook_token}` : '';
                                    navigator.clipboard.writeText(url);
                                    toast.success('Webhook URL copied!');
                                }}
                                type="button"
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500">Use this token when configuring Webhook in SePay dashboard.</p>
                    </div>
                </div>
                <div className="mt-8 flex justify-end border-t border-gray-700 pt-4">
                     <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {isSaving ? 'Saving...' : 'Update Payment Settings'}
                    </button>
                </div>
            </div>

            {/* Support Configuration */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Support Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Messenger URL"
                        value={settings.support_messenger || ''}
                        onChange={(e: any) => setSettings({ ...settings, support_messenger: e.target.value })}
                        placeholder="https://m.me/yourpage"
                    />
                    <InputField 
                        label="Hotline Number"
                        value={settings.support_hotline || ''}
                        onChange={(e: any) => setSettings({ ...settings, support_hotline: e.target.value })}
                        placeholder="0123.456.789"
                    />
                    <InputField 
                        label="YouTube URL"
                        value={settings.support_youtube || ''}
                        onChange={(e: any) => setSettings({ ...settings, support_youtube: e.target.value })}
                        placeholder="https://youtube.com/@channel"
                    />
                    <InputField 
                        label="Telegram URL"
                        value={settings.support_telegram || ''}
                        onChange={(e: any) => setSettings({ ...settings, support_telegram: e.target.value })}
                        placeholder="https://t.me/username"
                    />
                </div>
                <div className="mt-8 flex justify-end border-t border-gray-700 pt-4">
                     <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {isSaving ? 'Saving...' : 'Update Support Links'}
                    </button>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Security Settings</h2>
                <ChangePasswordForm />
            </div>
        </div>
    );
};

const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.new_password !== formData.new_password_confirmation) {
            toast.error('New passwords do not match');
            return;
        }

        setIsSaving(true);
        try {
            await platformClient.post('/platform/change-password', formData);
            toast.success('Password changed successfully');
            setFormData({
                current_password: '',
                new_password: '',
                new_password_confirmation: ''
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
            const errors = error.response?.data?.errors;
            if (errors) {
                 Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Current Password
                </label>
                <input
                    type="password"
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter current password"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    New Password
                </label>
                <input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Min 8 characters"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Confirm New Password
                </label>
                <input
                    type="password"
                    value={formData.new_password_confirmation}
                    onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
                    required
                    minLength={8}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Re-enter new password"
                />
            </div>
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-fit"
                >
                    {isSaving ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
    );
};
