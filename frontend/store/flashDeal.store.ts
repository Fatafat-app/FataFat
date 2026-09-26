import { create } from 'zustand';
import { FlashDealConfig } from '../types';

interface FlashDealState {
  config: FlashDealConfig;
  updateConfig: (newConfig: Partial<FlashDealConfig>) => void;
  toggleFlashDeal: (isEnabled: boolean) => void;
}

export const useFlashDealStore = create<FlashDealState>((set) => ({
  config: {
    isEnabled: true,
    title: 'Midnight Hunger?',
    discountText: 'Flat 50% Off on large orders',
    durationSeconds: 8640, // 2h 24m
    imageUrl: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
    targetCategory: 'Pizza',
  },

  updateConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),

  toggleFlashDeal: (isEnabled) =>
    set((state) => ({
      config: { ...state.config, isEnabled },
    })),
}));
