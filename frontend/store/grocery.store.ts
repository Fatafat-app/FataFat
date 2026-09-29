import { create } from 'zustand';
import { GroceryProduct } from '../constants/GroceryData';

export interface GroceryCartItem {
  product: GroceryProduct;
  quantity: number;
}

interface GroceryStore {
  // Section — food is always default on app open
  activeSection: 'food' | 'grocery';

  // Cart
  cart: GroceryCartItem[];

  // Filters
  activeFilter: 'price' | 'popularity' | 'deals' | 'organic';

  // Wishlist (product ids)
  wishlist: (string | number)[];

  appliedCoupon: { code: string; discount: number } | null;

  // Actions
  setSection: (section: 'food' | 'grocery') => void;
  addToCart: (product: GroceryProduct, quantity?: number) => void;
  incrementQty: (productId: string | number) => void;
  decrementQty: (productId: string | number) => void;
  toggleWishlist: (productId: string | number) => void;
  setFilter: (filter: 'price' | 'popularity' | 'deals' | 'organic') => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
}

export const useGroceryStore = create<GroceryStore>((set, get) => ({
  // Default: food section first on app open
  activeSection: 'food',
  cart: [],
  activeFilter: 'popularity',
  wishlist: [],
  appliedCoupon: null,

  setSection: (section) => set({ activeSection: section }),

  addToCart: (product, quantity = 1) => {
    const prodId = product._id || product.id;
    const existing = get().cart.find((i) => (i.product._id || i.product.id) === prodId);
    if (existing) {
      set({
        cart: get().cart.map((i) =>
          (i.product._id || i.product.id) === prodId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({ cart: [...get().cart, { product, quantity }] });
    }
  },

  incrementQty: (productId) => {
    set({
      cart: get().cart.map((i) =>
        (i.product._id || i.product.id) === productId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ),
    });
  },

  decrementQty: (productId) => {
    const updated = get()
      .cart.map((i) =>
        (i.product._id || i.product.id) === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      )
      .filter((i) => i.quantity > 0);
    set({ cart: updated });
  },

  toggleWishlist: (productId) => {
    const { wishlist } = get();
    if (wishlist.includes(productId)) {
      set({ wishlist: wishlist.filter((id) => id !== productId) });
    } else {
      set({ wishlist: [...wishlist, productId] });
    }
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  applyCoupon: (code, discount) => set({ appliedCoupon: { code, discount } }),
  removeCoupon: () => set({ appliedCoupon: null }),

  clearCart: () => set({ cart: [] }),
}));

// Selectors
export const useGroceryCartCount = () =>
  useGroceryStore((s) => s.cart.reduce((sum, i) => sum + i.quantity, 0));

export const useGroceryCartTotal = () =>
  useGroceryStore((s) =>
    s.cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  );
