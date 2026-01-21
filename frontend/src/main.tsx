import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuthStore } from './store/authStore';
import { registerLogoutCallback } from './api/client';
import './index.css';
import './echo';

// Sync 401/419 responses to store logout
registerLogoutCallback(() => {
  useAuthStore.getState().logout();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const SessionSync = () => {
  const checkSession = useAuthStore((state) => state.checkSession);
  useEffect(() => {
    checkSession();
  }, [checkSession]);
  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionSync />
      <NotificationProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </NotificationProvider>
    </QueryClientProvider>
  </StrictMode>,
);
