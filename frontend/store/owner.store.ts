import { create } from 'zustand';
import { Restaurant, Order, OrderStatus, MenuCategory, MenuItem } from '../types';
import { ownerService, CreateMenuItemPayload } from '../services/owner.service';
import { api } from '../services/api';
import { ApiResponse } from '../types';

interface OwnerState {
  restaurant: Restaurant | null;
  orders: Order[];
  menuCategories: MenuCategory[];
  isLoading: boolean;
  isOpen: boolean;

  fetchOwnerData: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  toggleStoreStatus: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  toggleItemStock: (itemId: string, isAvailable: boolean) => Promise<void>;
  addNewDish: (payload: CreateMenuItemPayload) => Promise<void>;
  updateDish: (itemId: string, payload: Partial<CreateMenuItemPayload>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
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

        const [ordersData, menuResp] = await Promise.all([
          ownerService.getRestaurantOrders(rest._id),
          api.get<ApiResponse<any>>(`/restaurants/${rest._id}/menu`),
        ]);

        const rawMenu = menuResp.data.data;
        const menuArr = rawMenu?.menu ?? rawMenu;
        const menuData: MenuCategory[] = Array.isArray(menuArr) ? menuArr : [];

        set({
          orders: ordersData || [],
          menuCategories: menuData,
        });
      }
    } catch (err) {
      console.warn('Failed to load owner data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshMenu: async () => {
    const rest = get().restaurant;
    if (!rest) return;
    try {
      const menuResp = await api.get<ApiResponse<any>>(`/restaurants/${rest._id}/menu`);
      const rawMenu = menuResp.data.data;
      const menuArr = rawMenu?.menu ?? rawMenu;
      // Only update state if we got valid data — never overwrite with empty
      if (Array.isArray(menuArr) && menuArr.length > 0) {
        set({ menuCategories: menuArr as MenuCategory[] });
      }
    } catch (err) {
      console.warn('Failed to refresh menu:', err);
    }
  },

  toggleStoreStatus: async () => {
    const rest = get().restaurant;
    if (!rest) return;

    const previous = get().isOpen;
    set({ isOpen: !previous });

    try {
      const updated = await ownerService.toggleStoreOpen(rest._id);
      set({ restaurant: updated, isOpen: updated.isOpen ?? !previous });
    } catch (err) {
      set({ isOpen: previous });
      console.warn('Could not toggle store status:', err);
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await ownerService.updateOrderStatus(orderId, status);
      set((state) => ({
        orders: state.orders.map((o) => (o._id === orderId ? { ...o, ...updated, status: updated.status } : o)),
      }));
    } catch (err) {
      console.warn('Could not update order status:', err);
      throw err;
    }
  },

  toggleItemStock: async (itemId: string, isAvailable: boolean) => {
    const rest = get().restaurant;
    if (!rest) return;

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
    if (!rest) {
      throw new Error('Restaurant profile not loaded. Please pull to refresh.');
    }
    const newItem = await ownerService.addMenuItem(rest._id, payload);
    set((state) => {
      const targetCat = newItem?.category?.toString();
      let matched = false;
      const updated = state.menuCategories.map((group) => {
        const groupId = (group as any)._id?.toString();
        const groupName = (group.name || group.category || '').toLowerCase();
        const payloadCat = (payload.category || '').toLowerCase();
        if ((groupId && targetCat && groupId === targetCat) || (groupName && groupName === payloadCat)) {
          matched = true;
          return { ...group, items: [...group.items, newItem] };
        }
        return group;
      });

      if (!matched) {
        return {
          menuCategories: [
            ...updated,
            {
              _id: targetCat || Date.now().toString(),
              name: payload.category,
              category: payload.category,
              items: [newItem],
            },
          ],
        };
      }

      return { menuCategories: updated };
    });
  },

  updateDish: async (itemId: string, payload: Partial<CreateMenuItemPayload>) => {
    const rest = get().restaurant;
    if (!rest) {
      throw new Error('Restaurant profile not loaded. Please pull to refresh.');
    }
    const updated = await ownerService.updateMenuItem(rest._id, itemId, payload);
    // Optimistic: update item in state directly
    set((state) => ({
      menuCategories: state.menuCategories.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item._id === itemId ? { ...item, ...updated } : item
        ),
      })),
    }));
  },

  addCategory: async (name: string) => {
    const rest = get().restaurant;
    if (!rest) {
      throw new Error('Restaurant profile not loaded. Please pull to refresh.');
    }
    const newCat = await ownerService.addCategory(rest._id, name);
    // Directly append the new category to state — no extra API call needed
    set((state) => ({
      menuCategories: [
        ...state.menuCategories,
        {
          _id: (newCat as any)?._id || Date.now().toString(),
          name: (newCat as any)?.name || name,
          category: (newCat as any)?.name || name,
          items: [],
        },
      ],
    }));
  },
}));

