import { create } from 'zustand';
import type { User } from '../types';
import { updateEchoAuth } from '../echo';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  canLogin: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'), // Initially rely on token, but verify below
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
  
  checkSession: async () => {
      try {
          const { checkSession } = await import('../api/auth'); 
          const user = await checkSession();
          get().setAuth(user, 'session-active'); 
      } catch (error) {
          // Silent failure is acceptable for initial session check
          console.warn("Session check failed, user might be guest");
      }
  },

  setAuth: (user: User, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    const canLogin = Array.isArray(user.permissions) && user.permissions.some((p) => {
      const s = String(p);
      return s.toLowerCase() === 'login' || s.toLowerCase().startsWith('login');
    });
    set({ user, token, isAuthenticated: true, canLogin });
    updateEchoAuth();
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, canLogin: false });
    updateEchoAuth();
  },
}));

