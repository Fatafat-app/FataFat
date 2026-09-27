import { create } from 'zustand';
import { MenuItem, MenuItemModifierOption, Restaurant } from '../types';
import { orderService } from '../services/order.service';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers?: MenuItemModifierOption[];
  totalItemPrice: number; // in paise
}

export interface FeeConfigState {
  platformFee: number;
  platformFeeEnabled: boolean;
  taxPercent: number;
  taxEnabled: boolean;
  baseDeliveryFee: number;
  deliveryFeeEnabled: boolean;
  packagingFee: number;
  packagingFeeEnabled: boolean;
  surgeFee: number;
  surgeFeeEnabled: boolean;
  customFees: { name: string; amount: number; isEnabled: boolean; description?: string }[];
}

interface CartState {
  restaurant: Restaurant | null;
  items: CartItem[];
  feeConfig: FeeConfigState | null;

  fetchFeeConfig: () => Promise<void>;
  addItem: (item: MenuItem, restaurant: Restaurant, modifiers?: MenuItemModifierOption[]) => boolean;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  
  // Computed values
  getItemsCount: () => number;
  getItemsTotal: () => number; // in paise
  getDeliveryFee: () => number; // in paise
  getGstAndTaxes: () => number; // in paise
  getPlatformFee: () => number; // in paise
  getPackagingFee: () => number; // in paise
  getSurgeFee: () => number; // in paise
  getCustomFeesTotal: () => number; // in paise
  getGrandTotal: () => number; // in paise
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurant: null,
  items: [],
  feeConfig: null,

  fetchFeeConfig: async () => {
    try {
      const config = await orderService.getCurrentFees();
      if (config) {
        set({ feeConfig: config });
      }
    } catch (err) {
      console.warn('[CartStore] Could not fetch live fee config:', err);
    }
  },

  addItem: (menuItem, restaurant, modifiers = []) => {
    const currentRestaurant = get().restaurant;
    
    // Check if adding from different restaurant
    if (currentRestaurant && currentRestaurant._id !== restaurant._id) {
      return false; // Signals caller that cart belongs to another restaurant
    }

    const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.price || 0), 0);
    const unitPrice = menuItem.price + modifierPrice;

    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.menuItem._id === menuItem._id);
      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const current = updatedItems[existingIndex];
        const newQty = current.quantity + 1;
        updatedItems[existingIndex] = {
          ...current,
          quantity: newQty,
          totalItemPrice: newQty * unitPrice,
        };
        return { items: updatedItems, restaurant };
      } else {
        return {
          items: [
            ...state.items,
            {
              menuItem,
              quantity: 1,
              selectedModifiers: modifiers,
              totalItemPrice: unitPrice,
            },
          ],
          restaurant,
        };
      }
    });

    // Make sure latest fee structure is fetched
    if (!get().feeConfig) {
      get().fetchFeeConfig();
    }

    return true;
  },

  removeItem: (menuItemId) => {
    set((state) => {
      const updated = state.items.filter((i) => i.menuItem._id !== menuItemId);
      return {
        items: updated,
        restaurant: updated.length === 0 ? null : state.restaurant,
      };
    });
  },

  updateQuantity: (menuItemId, delta) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.menuItem._id === menuItemId);
      if (existingIndex === -1) return state;

      const updated = [...state.items];
      const item = updated[existingIndex];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        updated.splice(existingIndex, 1);
      } else {
        const modifierPrice = (item.selectedModifiers || []).reduce((sum, mod) => sum + (mod.price || 0), 0);
        const unitPrice = item.menuItem.price + modifierPrice;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          totalItemPrice: newQty * unitPrice,
        };
      }

      return {
        items: updated,
        restaurant: updated.length === 0 ? null : state.restaurant,
      };
    });
  },

  clearCart: () => set({ items: [], restaurant: null }),

  getItemsCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getItemsTotal: () => {
    return get().items.reduce((sum, item) => sum + item.totalItemPrice, 0);
  },

  getDeliveryFee: () => {
    const { feeConfig, restaurant } = get();
    if (feeConfig) {
      if (feeConfig.deliveryFeeEnabled === false) return 0;
      return feeConfig.baseDeliveryFee ?? (restaurant?.pricing?.deliveryCharge || 3000);
    }
    return restaurant?.pricing?.deliveryCharge ?? 3000;
  },

  getGstAndTaxes: () => {
    const { feeConfig, restaurant } = get();
    const itemsTotal = get().getItemsTotal();
    if (feeConfig) {
      if (feeConfig.taxEnabled === false) return 0;
      const rate = feeConfig.taxPercent ?? (restaurant?.taxPercent || 5);
      return Math.round((itemsTotal * rate) / 100);
    }
    return Math.round(itemsTotal * 0.05); // Default 5%
  },

  getPlatformFee: () => {
    const { feeConfig } = get();
    if (feeConfig) {
      if (feeConfig.platformFeeEnabled === false) return 0;
      return feeConfig.platformFee ?? 500;
    }
    return 500; // Default ₹5
  },

  getPackagingFee: () => {
    const { feeConfig } = get();
    if (feeConfig && feeConfig.packagingFeeEnabled) {
      return feeConfig.packagingFee || 0;
    }
    return 0;
  },

  getSurgeFee: () => {
    const { feeConfig } = get();
    if (feeConfig && feeConfig.surgeFeeEnabled) {
      return feeConfig.surgeFee || 0;
    }
    return 0;
  },

  getCustomFeesTotal: () => {
    const { feeConfig } = get();
    if (feeConfig && feeConfig.customFees && feeConfig.customFees.length > 0) {
      return feeConfig.customFees
        .filter((f) => f.isEnabled)
        .reduce((sum, f) => sum + (f.amount || 0), 0);
    }
    return 0;
  },

  getGrandTotal: () => {
    const itemsTotal = get().getItemsTotal();
    if (itemsTotal === 0) return 0;
    return (
      itemsTotal +
      get().getDeliveryFee() +
      get().getGstAndTaxes() +
      get().getPlatformFee() +
      get().getPackagingFee() +
      get().getSurgeFee() +
      get().getCustomFeesTotal()
    );
  },
}));
