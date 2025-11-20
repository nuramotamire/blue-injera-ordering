// 📄 store/auth.store.ts

import { account, getCurrentUser, signOut } from '@/lib/appwrite'; // ✅ ensure `account` is exported
import { User } from '@/type';
import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  role: 'user' | 'admin' | 'chef';
  isLoading: boolean;

  // ✅ Actions
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setRole: (role: 'user' | 'admin' | 'chef') => void;
  setLoading: (loading: boolean) => void;

  fetchAuthenticatedUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  role: 'user',
  isLoading: true,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (value) => set({ isLoading: value }),

  // 🔁 Fetch current user (called on app init)
  fetchAuthenticatedUser: async () => {
    set({ isLoading: true });
    try {
      const userData = await getCurrentUser();
      if (userData) {
        const role = (userData as any).role || 'user';
        const validatedRole = ['user', 'admin', 'chef'].includes(role) 
          ? (role as 'user' | 'admin' | 'chef') 
          : 'user';

        set({
          isAuthenticated: true,
          user: userData as unknown as User,
          role: validatedRole,
        });
      } else {
        set({ isAuthenticated: false, user: null, role: 'user' });
      }
    } catch (e) {
      console.log('fetchAuthenticatedUser error', e);
      set({ isAuthenticated: false, user: null, role: 'user' });
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ Safe login with session guard
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // 🔐 Step 1: Ensure no active session
      try {
        const currentSession = await account.getSession('current');
        if (currentSession) {
          console.warn('Active session detected — logging out first');
          await get().logout(); // auto-cleanup
        }
      } catch (e) {
        // No active session — safe to proceed
      }

      // 🔐 Step 2: Create new session
      await account.createEmailPasswordSession(email, password);

      // 🔐 Step 3: Fetch user + role
      const userData = await getCurrentUser();
      if (!userData) throw new Error('User data unavailable after login');

      const role = (userData as any).role || 'user';
      const validatedRole = ['user', 'admin', 'chef'].includes(role)
        ? (role as 'user' | 'admin' | 'chef')
        : 'user';

      set({
        isAuthenticated: true,
        user: userData as unknown as User,
        role: validatedRole,
        isLoading: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      return {
        success: false,
        error: error.message.includes('prohibited')
          ? 'Session conflict — please restart the app or try again.'
          : error.message || 'Login failed',
      };
    }
  },

  // ✅ Full logout: destroy session + reset state
  logout: async () => {
  set({ isLoading: true });
  try {
    // 🔥 Use the new signOut helper
    await signOut();
  } finally {
    // 🧹 Reset local state regardless of network success
    set({
      isAuthenticated: false,
      user: null,
      role: 'user',
      isLoading: false,
    });
  }
},
}));

export default useAuthStore;