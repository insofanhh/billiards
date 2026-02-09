import { apiClient, getCsrfToken } from './client';
import type { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  store_slug?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  getCsrfToken: async (): Promise<void> => {
    await getCsrfToken();
  },

  checkSession: async (): Promise<User> => {
    // We try to fetch the user directly. If it fails with 401/419, the interceptor or caller handles it.
    // However, for checkSession, we might want to ensure CSRF cookie is set if not present?
    // Actually, simply getting /user should be enough if the cookie is there.
    // If we are strictly doing SPA auth, we might need to hit csrf-cookie first if we haven't.
    // But usually the browser handles the cookie.
    // Let's just try to get user. If we explicitly need to refresh CSRF, we can.
    await getCsrfToken(); 
    const response = await apiClient.get('/user');
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await getCsrfToken();
    const response = await apiClient.post('/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    await getCsrfToken();
    const response = await apiClient.post('/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/user');
    return response.data;
  },

  syncTokenFromSession: async (): Promise<AuthResponse> => {
    // Try to generate token from active session (cookies)
    // This works if user logged in via admin panel
    await getCsrfToken();
    const response = await apiClient.post('/auth/sync-token');
    return response.data;
  },

  verifyEmail: async (id: string, hash: string, query: string) => {
    // No CSRF needed for simple GET, but good practice if session involved
    const response = await apiClient.get(`/email/verify/${id}/${hash}?${query}`);
    return response.data;
  },

  resendVerification: async () => {
    await getCsrfToken();
    const response = await apiClient.post('/email/resend');
    return response.data;
  },
};

// Export standalone checkSession for dynamic import usage if needed, or just rely on authApi
export const checkSession = authApi.checkSession;
export const syncTokenFromSession = authApi.syncTokenFromSession;
export const logout = authApi.logout;

