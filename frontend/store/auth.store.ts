import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { getAccessToken } from '../services/api';
import { oneSignalService } from '../services/onesignal.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user?._id || user?.id) {
      oneSignalService.login(String(user._id || user.id));
      if (user.email) {
        oneSignalService.addEmail(user.email);
      }
    }
  },

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getAccessToken();
      if (token) {
        const profile = await authService.getProfile();
        set({ user: profile, isAuthenticated: true });
        if (profile?._id || profile?.id) {
          oneSignalService.login(String(profile._id || profile.id));
          if (profile.email) {
            oneSignalService.addEmail(profile.email);
          }
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      oneSignalService.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

