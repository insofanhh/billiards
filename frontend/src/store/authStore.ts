import { create } from 'zustand';
import type { User } from '../types';
import { updateEchoAuth } from '../echo';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  canLogin: boolean;
  lastActivityAt: number | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
  updateActivity: () => void;
}

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

export const useAuthStore = create<AuthState>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  lastActivityAt: localStorage.getItem('last_activity_at') 
    ? parseInt(localStorage.getItem('last_activity_at')!) 
    : null,
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
  
  updateActivity: () => {
    const now = Date.now();
    localStorage.setItem('last_activity_at', now.toString());
    set({ lastActivityAt: now });
  },
  
  checkSession: async () => {
    const state = get();
    
    // If not authenticated, no need to check session
    if (!state.isAuthenticated || !state.token) {
      return;
    }

    // Check if we need to verify session based on inactivity
    const now = Date.now();
    const lastActivity = state.lastActivityAt || 0;
    const timeSinceLastActivity = now - lastActivity;

    // If last activity was less than 1 hour ago, session is still valid
    if (timeSinceLastActivity < INACTIVITY_TIMEOUT) {
      // Update activity timestamp to show user is active
      get().updateActivity();
      return;
    }

    // If more than 1 hour has passed, verify session with backend
    try {
      const { checkSession } = await import('../api/auth'); 
      const user = await checkSession();
      
      // Session is still valid on backend, update local state
      localStorage.setItem('user', JSON.stringify(user));
      const canLogin = Array.isArray(user.permissions) && user.permissions.some((p) => {
        const s = String(p);
        return s.toLowerCase() === 'login' || s.toLowerCase().startsWith('login');
      });
      
      set({ user, canLogin });
      get().updateActivity();
    } catch (error: any) {
      // Only logout on explicit authentication errors (401, 419)
      if (error?.response?.status === 401 || error?.response?.status === 419) {
        get().logout();
        console.warn("Session expired, user logged out");
      } else {
        // For other errors (network, server errors), keep user logged in
        // They might just have temporary connectivity issues
        console.warn("Session check failed, but keeping user logged in", error);
      }
    }
  },

  setAuth: (user: User, token: string) => {
    const now = Date.now();
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('last_activity_at', now.toString());
    
    const canLogin = Array.isArray(user.permissions) && user.permissions.some((p) => {
      const s = String(p);
      return s.toLowerCase() === 'login' || s.toLowerCase().startsWith('login');
    });
    
    set({ user, token, isAuthenticated: true, canLogin, lastActivityAt: now });
    updateEchoAuth();
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity_at');
    set({ user: null, token: null, isAuthenticated: false, canLogin: false, lastActivityAt: null });
    updateEchoAuth();
  },
}));

