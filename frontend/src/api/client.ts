import axios from 'axios';

const isProd = import.meta.env.PROD;
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://billiardscms.io.vn/api' : 'http://localhost:8000/api');

console.log('Current API configuration:', {
  isProd,
  baseUrl: API_BASE_URL,
  mode: import.meta.env.MODE
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Create a separate client for root-level requests like Sanctum CSRF
const rootUrl = isProd ? 'https://billiardscms.io.vn' : 'http://localhost:8000';
export const rootClient = axios.create({
  baseURL: rootUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export const getCsrfToken = async () => {
  await rootClient.get('/sanctum/csrf-cookie');
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Update activity timestamp on authenticated requests
    // This keeps the session alive as long as the user is making API calls
    const lastActivityAt = Date.now();
    localStorage.setItem('last_activity_at', lastActivityAt.toString());
  }

  // Inject Tenant Slug from URL (assuming path is /s/:slug/...)
  const match = window.location.pathname.match(/^\/s\/([^/]+)/);
  if (match && match[1]) {
      config.headers['X-Store-Slug'] = match[1];
  }
  
  return config;
});

let logoutCallback: (() => void) | null = null;
export const registerLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error.response?.status === 401 || error.response?.status === 419) {
      localStorage.removeItem('auth_token');
      if (logoutCallback) {
        logoutCallback();
      }
    }

    // Handle Store Expiry
    if (error.response?.status === 403 && error.response?.data?.code === 'STORE_EXPIRED') {
      const slug = error.response?.data?.store_slug;
      if (slug) {
        // Use window.location to avoid circular dependencies with router
        // Check if we are already on the extension page to avoid loops
        if (!window.location.pathname.includes(`/s/${slug}/extend`)) {
            window.location.href = `/s/${slug}/extend`;
        }
      }
    }

    return Promise.reject(error);
  }
);

