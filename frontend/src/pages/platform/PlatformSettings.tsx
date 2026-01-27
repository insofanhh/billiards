import { useState, useEffect } from 'react';
import { platformClient } from '../../api/platformClient';
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
}

export const PlatformSettings = () => {
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

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
            </div>

            <div className="bg-white dark:bg-[#1a2c24] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Homepage SEO Configuration</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Page Title
                        </label>
                        <input
                            type="text"
                            value={settings.seo_title}
                            onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                            maxLength={60}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="e.g. Billiards CMS - Professional Management Platform"
                        />
                        <p className="mt-1 text-xs text-gray-500">Max 60 characters. Displayed on browser tab and Google search results.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Meta Description
                        </label>
                        <textarea
                            value={settings.seo_description}
                            onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                            maxLength={160}
                            rows={3}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="A brief description of your page..."
                        />
                        <p className="mt-1 text-xs text-gray-500">Max 160 characters. Summary of the page content.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Meta Keywords
                        </label>
                        <input
                            type="text"
                            value={settings.seo_keywords}
                            onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="billiards, cms, management, software"
                        />
                        <p className="mt-1 text-xs text-gray-500">Comma separated keywords.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Learn More URL (Home Button)
                        </label>
                        <input
                            type="text"
                            value={settings.learn_more_url || ''}
                            onChange={(e) => setSettings({ ...settings, learn_more_url: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="https://example.com/learn-more"
                        />
                         <p className="mt-1 text-xs text-gray-500">Destination URL for the "Tìm hiểu thêm" button.</p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-lg bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-[#10d863] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-[#1a2c24] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Support Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Messenger URL
                        </label>
                        <input
                            type="text"
                            value={settings.support_messenger || ''}
                            onChange={(e) => setSettings({ ...settings, support_messenger: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="https://m.me/yourpage"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hotline Number
                        </label>
                        <input
                            type="text"
                            value={settings.support_hotline || ''}
                            onChange={(e) => setSettings({ ...settings, support_hotline: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="0123.456.789"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            YouTube URL
                        </label>
                        <input
                            type="text"
                            value={settings.support_youtube || ''}
                            onChange={(e) => setSettings({ ...settings, support_youtube: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="https://youtube.com/@channel"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Telegram URL
                        </label>
                        <input
                            type="text"
                            value={settings.support_telegram || ''}
                            onChange={(e) => setSettings({ ...settings, support_telegram: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                            placeholder="https://t.me/username"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                     <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="rounded-lg bg-[#13ec6d] px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-[#10d863] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'Saving...' : 'Update Support Links'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a2c24] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h2>
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                </label>
                <input
                    type="password"
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    required
                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                </label>
                <input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                </label>
                <input
                    type="password"
                    value={formData.new_password_confirmation}
                    onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
                    required
                    minLength={8}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-[#13ec6d] focus:border-[#13ec6d]"
                />
            </div>
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-[#13fec] text-white px-4 py-2 text-sm font-bold bg-[#137fec] hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
    );
};
