import { create } from 'zustand';
import { Restaurant, Order, OrderStatus, MenuCategory, MenuItem } from '../types';
import { ownerService, CreateMenuItemPayload } from '../services/owner.service';
import { restaurantService } from '../services/restaurant.service';

interface OwnerState {
  restaurant: Restaurant | null;
  orders: Order[];
  menuCategories: MenuCategory[];
  isLoading: boolean;
  isOpen: boolean;

  // Actions
  fetchOwnerData: () => Promise<void>;
  toggleStoreStatus: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  toggleItemStock: (itemId: string, isAvailable: boolean) => Promise<void>;
  addNewDish: (payload: CreateMenuItemPayload) => Promise<void>;
}

export const useOwnerStore = create<OwnerState>((set, get) => ({
  restaurant: null,
  orders: [],
  menuCategories: [],
  isLoading: true,
  isOpen: true,

  fetchOwnerData: async () => {
    try {
      set({ isLoading: true });
      const restaurants = await ownerService.getMyRestaurants();
      if (restaurants && restaurants.length > 0) {
        const rest = restaurants[0];
        set({ restaurant: rest, isOpen: rest.isOpen ?? true });

        // Fetch orders and menu in parallel
        const [ordersData, menuData] = await Promise.all([
          ownerService.getRestaurantOrders(rest._id),
          restaurantService.getRestaurantMenu(rest._id),
        ]);

        set({
          orders: ordersData || [],
          menuCategories: menuData || [],
        });
      }
    } catch (err) {
      console.warn('Failed to load owner data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleStoreStatus: async () => {
    const rest = get().restaurant;
    if (!rest) return;

    // Optimistic update
    const previous = get().isOpen;
    set({ isOpen: !previous });

    try {
      const updated = await ownerService.toggleStoreOpen(rest._id);
      set({ restaurant: updated, isOpen: updated.isOpen ?? !previous });
    } catch (err) {
      // Rollback on error
      set({ isOpen: previous });
      console.warn('Could not toggle store status:', err);
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await ownerService.updateOrderStatus(orderId, status);
      set((state) => ({
        orders: state.orders.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)),
      }));
    } catch (err) {
      console.warn('Could not update order status:', err);
      throw err;
    }
  },

  toggleItemStock: async (itemId: string, isAvailable: boolean) => {
    const rest = get().restaurant;
    if (!rest) return;

    // Optimistically update menu categories
    set((state) => ({
      menuCategories: state.menuCategories.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item._id === itemId ? { ...item, isAvailable } : item
        ),
      })),
    }));

    try {
      await ownerService.toggleItemAvailability(rest._id, itemId, isAvailable);
    } catch (err) {
      // Rollback
      set((state) => ({
        menuCategories: state.menuCategories.map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item._id === itemId ? { ...item, isAvailable: !isAvailable } : item
          ),
        })),
      }));
      console.warn('Failed to toggle item availability:', err);
    }
  },

  addNewDish: async (payload: CreateMenuItemPayload) => {
    const rest = get().restaurant;
    if (!rest) return;

    const newItem = await ownerService.addMenuItem(rest._id, payload);
    // Refresh menu
    const menuData = await restaurantService.getRestaurantMenu(rest._id);
    set({ menuCategories: menuData });
  },
}));
