import { createContext, useContext, useState, type ReactNode } from 'react';
import { NotificationPopup } from '../components/NotificationPopup';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<'success' | 'error' | 'info'>('success');

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage(msg);
    setType(type);
  };

  const closeNotification = () => {
    setMessage(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {message && (
        <NotificationPopup message={message} type={type} onClose={closeNotification} />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

