import { apiClient } from './client';
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
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  getCsrfToken: async (): Promise<void> => {
    await apiClient.get('/sanctum/csrf-cookie');
  },

  checkSession: async (): Promise<User> => {
    await apiClient.get('/sanctum/csrf-cookie'); // Ensure we have a token first
    const response = await apiClient.get('/user');
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.post('/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    await apiClient.get('/sanctum/csrf-cookie');
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
};

// Export standalone checkSession for dynamic import usage if needed, or just rely on authApi
export const checkSession = authApi.checkSession;

