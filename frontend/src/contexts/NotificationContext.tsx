import { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationPopup } from '../components/NotificationPopup';

interface NotificationContextType {
  showNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setMessage(msg);
  };

  const closeNotification = () => {
    setMessage(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {message && (
        <NotificationPopup message={message} onClose={closeNotification} />
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

