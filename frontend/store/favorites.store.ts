import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (id: string) =>
        get().favorites.some((f) => f._id === id),

      addFavorite: (item: FavoriteItem) => {
        if (get().isFavorite(item._id)) return;
        set((state) => ({
          favorites: [{ ...item, addedAt: Date.now() }, ...state.favorites],
        }));
      },

      removeFavorite: (id: string) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f._id !== id),
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
