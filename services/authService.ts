import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';

export const login = async (username: string, password: string): Promise<{ token: string; user: string }> => {
  return safeApiCall(async () => {
    // Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Verify against Environment Variables
    if (username === CONFIG.ADMIN_USER && password === CONFIG.ADMIN_PASSWORD) {
      const token = `sess_${Math.random().toString(36).substr(2)}_${Date.now()}`;
      localStorage.setItem('admin_session', token);
      return { token, user: 'Admin' };
    } else {
      throw new Error('Invalid credentials');
    }
  }, 'auth/login', { skipAuth: true });
};

export const logout = async (): Promise<void> => {
  return safeApiCall(async () => {
    localStorage.removeItem('admin_session');
    // Optional: Call server to invalidate session if backend existed
  }, 'auth/logout', { skipAuth: true });
};

export const checkSession = (): boolean => {
  return !!localStorage.getItem('admin_session');
};