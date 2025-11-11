import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

window.Pusher = Pusher;

const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || '';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'billiardscms.io.vn';
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || '443';
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'https';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://billiardscms.io.vn/api';
const LARAVEL_BASE_URL = API_BASE_URL.replace('/api', '') || 'https://billiardscms.io.vn';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || '';
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
};

export const echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_APP_KEY,
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: REVERB_PORT,
  forceTLS: REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${LARAVEL_BASE_URL}/broadcasting/auth`,
  auth: {
    headers: getAuthHeaders(),
  },
  cluster: '',
  // Thêm cấu hình cho production
  encrypted: REVERB_SCHEME === 'https',
  disableStats: true,
});

export const updateEchoAuth = () => {
  if (echo.connector?.pusher?.config) {
    (echo.connector.pusher.config as any).auth = {
      headers: getAuthHeaders(),
    };
  }
};

window.Echo = echo;

export default echo;

