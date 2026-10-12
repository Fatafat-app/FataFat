import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type FavoriteItem = {
  _id: string;
  name: string;
  price: number | string;
  images?: string[];
  image?: string;
  tag?: string;
  isVeg?: boolean;
  type: 'product' | 'restaurant';
  cuisine?: string;
  rating?: number;
  addedAt: number; // timestamp
};

type FavoritesStore = {
  favorites: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (item: FavoriteItem) => boolean; // returns true if added, false if removed
  clearFavorites: () => void;
};

const memoryFallback: Record<string, string> = {};

const safeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(name);
        }
        return memoryFallback[name] || null;
      }
      const val = await SecureStore.getItemAsync(name);
      return val ?? memoryFallback[name] ?? null;
    } catch {
      return memoryFallback[name] || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    memoryFallback[name] = value;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(name, value);
        }
        return;
      }
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Memory fallback is already saved
    }
  },
  removeItem: async (name: string): Promise<void> => {
    delete memoryFallback[name];
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(name);
        }
        return;
      }
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Memory fallback is already deleted
    }
  },
};

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (id: string) =>
        get().favorites.some((f) => String(f._id) === String(id)),

      addFavorite: (item: FavoriteItem) => {
        if (get().isFavorite(item._id)) return;
        set((state) => ({
          favorites: [{ ...item, addedAt: Date.now() }, ...state.favorites],
        }));
      },

      removeFavorite: (id: string) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => String(f._id) !== String(id)),
        }));
      },

      toggleFavorite: (item: FavoriteItem) => {
        const already = get().isFavorite(item._id);
        if (already) {
          get().removeFavorite(item._id);
          return false;
        } else {
          get().addFavorite(item);
          return true;
        }
      },

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'ftafat-favorites',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
