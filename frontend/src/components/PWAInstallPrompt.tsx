import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPrompt = () => {
    const { isInstallable, promptInstall } = usePWAInstall();

    if (!isInstallable) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-700 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm mb-1">
                            Cài đặt ứng dụng
                        </h3>
                        <p className="text-gray-300 text-xs mb-3">
                            Thêm Billiards vào màn hình chính để truy cập nhanh hơn
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={promptInstall}
                                className="flex-1 bg-white text-black px-3 py-2 rounded-md text-xs font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Cài đặt
                            </button>
                            <button
                                onClick={() => {
                                    // Hide the prompt (will show again on next visit)
                                    const event = new Event('beforeinstallprompt');
                                    window.dispatchEvent(event);
                                }}
                                className="px-3 py-2 text-gray-400 hover:text-white text-xs transition-colors"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
