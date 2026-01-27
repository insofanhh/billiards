import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface SupportSettings {
    support_messenger?: string;
    support_hotline?: string;
    support_youtube?: string;
    support_telegram?: string;
}

export const SupportWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [links, setLinks] = useState<SupportSettings>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/settings/banners')
            .then(res => {
                setLinks({
                    support_messenger: res.data.support_messenger,
                    support_hotline: res.data.support_hotline,
                    support_youtube: res.data.support_youtube,
                    support_telegram: res.data.support_telegram,
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;

    // Only render if at least one link is configured
    const hasLinks = Object.values(links).some(link => link && link.length > 0);
    if (!hasLinks) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-72 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 fade-in duration-200">
                     <div className="p-2 space-y-1">
                        {links.support_messenger && (
                            <a 
                                href={links.support_messenger} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                            >
                                <img src="/fb-messenger.webp" className="size-10 rounded-full shadow-sm group-hover:scale-110 transition-transform" alt="Messenger" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">Facebook Messenger</span>
                                    <span className="text-xs text-gray-500">Live chat support 24/7</span>
                                </div>
                            </a>
                        )}
                        
                        {links.support_hotline && (
                            <a 
                                href={`tel:${links.support_hotline}`}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                            >
                                <div className="size-10 rounded-full flex items-center justify-center bg-[#24D366] text-white shadow-sm group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 5.25V4.5Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">Hotline</span>
                                    <span className="text-xs text-gray-500">Call for support</span>
                                </div>
                            </a>
                        )}

                        {links.support_telegram && (
                            <a 
                                href={links.support_telegram}
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                            >
                                <img src="/telegram-social.webp" className="size-10 rounded-full shadow-sm group-hover:scale-110 transition-transform" alt="Telegram" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">Telegram</span>
                                    <span className="text-xs text-gray-500">Join our channel</span>
                                </div>
                            </a>
                        )}

                        {links.support_youtube && (
                            <a 
                                href={links.support_youtube}
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                            >
                                <img src="/youtube-social.webp" className="size-10 rounded-full shadow-sm group-hover:scale-110 transition-transform" alt="YouTube" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">YouTube</span>
                                    <span className="text-xs text-gray-500">Watch tutorials</span>
                                </div>
                            </a>
                        )}
                     </div>
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`size-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-gray-200 rotate-90 text-gray-600' : 'bg-gradient-to-r from-[#13ec6d] to-[#137fec] text-white'}`}
            >
                {isOpen ? (
                     <span className="material-symbols-outlined text-[28px]">close</span>
                ) : (
                     <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
                )}
            </button>
        </div>
    );
};
