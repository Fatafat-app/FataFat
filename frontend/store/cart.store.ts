import { create } from 'zustand';
import { MenuItem, MenuItemModifierOption, Restaurant } from '../types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers?: MenuItemModifierOption[];
  totalItemPrice: number; // in paise
}

interface CartState {
  restaurant: Restaurant | null;
  items: CartItem[];
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
  getGrandTotal: () => number; // in paise
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurant: null,
  items: [],

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
    const restaurant = get().restaurant;
    return restaurant?.pricing?.deliveryCharge || 3000; // default ₹30 (3000 paise)
  },

  getGstAndTaxes: () => {
    const itemsTotal = get().getItemsTotal();
    return Math.round(itemsTotal * 0.05); // 5% GST
  },

  getPlatformFee: () => {
    return 500; // ₹5 (500 paise)
  },

  getGrandTotal: () => {
    const itemsTotal = get().getItemsTotal();
    if (itemsTotal === 0) return 0;
    return itemsTotal + get().getDeliveryFee() + get().getGstAndTaxes() + get().getPlatformFee();
  },
}));
