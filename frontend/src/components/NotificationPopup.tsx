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
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 z-10">
        <p className="text-xs text-gray-500 mb-2">{window.location.host} says</p>
        <p className="text-lg text-gray-900 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

