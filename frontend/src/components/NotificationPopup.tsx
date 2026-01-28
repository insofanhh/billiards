import { useEffect } from 'react';

interface NotificationPopupProps {
  message: string;
  onClose: () => void;
}

export function NotificationPopup({ message, onClose }: NotificationPopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Auto close after 1.2 seconds
    const timer = setTimeout(() => {
        onClose();
    }, 1200);

    return () => {
        document.removeEventListener('keydown', handleEscape);
        clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" />
      <div 
        className="relative bg-[#272a37] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 z-10 border border-gray-800 pointer-events-auto transform transition-all animate-fade-in-up"
      >
        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#13ec6d]/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#13ec6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="text-lg font-bold text-white mb-2">Thông báo</p>
            <p className="text-sm text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  );
}

