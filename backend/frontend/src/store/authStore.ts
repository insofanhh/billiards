import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  canLogin: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  canLogin: (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return false;
      const u: User = JSON.parse(userStr);
      if (!Array.isArray(u.permissions)) return false;
      return u.permissions.some((p) => {
        if (!p) return false;
        const s = String(p);
        return s.toLowerCase() === 'login' || s.toLowerCase().startsWith('login');
      });
    } catch { return false; }
  })(),
  
  setAuth: (user: User, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    const canLogin = Array.isArray(user.permissions) && user.permissions.some((p) => {
      const s = String(p);
      return s.toLowerCase() === 'login' || s.toLowerCase().startsWith('login');
    });
    set({ user, token, isAuthenticated: true, canLogin });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, canLogin: false });
  },
}));

