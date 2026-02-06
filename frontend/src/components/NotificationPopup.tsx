import { useEffect } from 'react';

interface NotificationPopupProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function NotificationPopup({ message, type = 'success', onClose }: NotificationPopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Auto close after 1.5 seconds (slightly longer)
    const timer = setTimeout(() => {
        onClose();
    }, 1500);

    return () => {
        document.removeEventListener('keydown', handleEscape);
        clearTimeout(timer);
    };
  }, [onClose]);

  const styles = {
      success: {
          bg: 'bg-[#13ec6d]/10',
          text: 'text-[#13ec6d]',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      },
      error: {
          bg: 'bg-red-500/10',
          text: 'text-red-500',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      },
      info: {
          bg: 'bg-blue-500/10',
          text: 'text-blue-500',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      }
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" />
      <div 
        className="relative bg-[#272a37] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 z-10 border border-gray-800 pointer-events-auto transform transition-all animate-fade-in-up"
      >
        <div className="flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full ${currentStyle.bg} flex items-center justify-center mb-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${currentStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {currentStyle.icon}
                </svg>
            </div>
            <p className="text-lg font-bold text-white mb-2">{type === 'error' ? 'Lỗi' : 'Thông báo'}</p>
            <p className="text-sm text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  );
}

