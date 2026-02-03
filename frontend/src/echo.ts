import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

window.Pusher = Pusher;

const isProd = import.meta.env.PROD;

const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || '';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || (isProd ? 'billiardscms.io.vn' : window.location.hostname);
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || (isProd ? '443' : '8080');
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || (isProd ? 'https' : 'http');

const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://billiardscms.io.vn/api' : 'http://localhost:8000/api');
const LARAVEL_BASE_URL = API_BASE_URL.replace('/api', '') || 'https://billiardscms.io.vn';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || '';
  const headers: any = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const match = window.location.pathname.match(/^\/s\/([^/]+)/);
  if (match && match[1]) {
      headers['X-Store-Slug'] = match[1];
  }

  return headers;
};

export const echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_APP_KEY,
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: REVERB_PORT,
  forceTLS: REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  authorizer: (channel: any, _options: any) => {
      return {
          authorize: (socketId: string, callback: Function) => {
              const headers = getAuthHeaders();
              const url = `${API_BASE_URL.replace('/api', '')}/broadcasting/auth`;
              
              axios.post(url, {
                  socket_id: socketId,
                  channel_name: channel.name
              }, { headers })
              .then(response => {
                  callback(false, response.data);
              })
              .catch(error => {
                  callback(true, error);
              });
          }
      };
  },
  cluster: '',
  encrypted: REVERB_SCHEME === 'https',
  disableStats: true,
});



window.Echo = echo;

export default echo;

