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

export const getCsrfToken = async () => {
  await apiClient.get('/sanctum/csrf-cookie');
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Inject Tenant Slug from URL (assuming path is /s/:slug/...)
  const match = window.location.pathname.match(/^\/s\/([^/]+)/);
  if (match && match[1]) {
      config.headers['X-Store-Slug'] = match[1];
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // window.location.href = '/login'; // Removed to prevent forced login on public pages
    }
    return Promise.reject(error);
  }
);

