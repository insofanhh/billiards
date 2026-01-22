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

// Token initializer to sync auth from admin panel
const TokenInitializer = () => {
  const initFromUrlToken = useAuthStore((state) => state.initFromUrlToken);
  const syncTokenFromSession = useAuthStore((state) => state.syncTokenFromSession);
  
  useEffect(() => {
    const init = async () => {
      // First try URL token (from admin panel home button redirect)
      const fromUrl = await initFromUrlToken();
      
      // If no URL token, check if we have active session (from admin panel login)
      if (!fromUrl) {
        await syncTokenFromSession();
      }
    };
    
    init();
  }, [initFromUrlToken, syncTokenFromSession]);
  
  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TokenInitializer />
      <NotificationProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </NotificationProvider>
    </QueryClientProvider>
  </StrictMode>,
);
