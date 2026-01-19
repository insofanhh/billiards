import axios from 'axios';

const isProd = import.meta.env.PROD;
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://billiardscms.io.vn/api' : 'http://localhost:8000/api');

export const platformClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

platformClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('platform_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

platformClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('platform_token');
      // Optional: Redirect to login if needed, or handle in component
      // window.location.href = '/platform/login';
    }
    return Promise.reject(error);
  }
);
