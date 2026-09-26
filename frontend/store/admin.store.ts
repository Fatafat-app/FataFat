import { create } from 'zustand';
import {
  AdminDashboardOverview,
  adminService,
  CreateRestaurantPayload,
} from '../services/admin.service';
import { User, Restaurant, Coupon, CreateCouponPayload } from '../types';

interface AdminState {
  overview: AdminDashboardOverview | null;
  users: User[];
  restaurants: Restaurant[];
  coupons: Coupon[];
  isLoading: boolean;

  fetchAdminOverview: () => Promise<void>;
  fetchUsers: (role?: string, search?: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  toggleUserStatus: (userId: string, currentActive: boolean) => Promise<void>;

  fetchRestaurants: () => Promise<void>;
  createRestaurant: (payload: CreateRestaurantPayload) => Promise<void>;
  toggleRestaurantStatus: (restaurantId: string, currentActive: boolean) => Promise<void>;

  fetchCoupons: () => Promise<void>;
  createCoupon: (payload: CreateCouponPayload) => Promise<void>;
  toggleCoupon: (couponId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  overview: null,
  users: [],
  restaurants: [],
  coupons: [],
  isLoading: true,

  fetchAdminOverview: async () => {
    try {
      set({ isLoading: true });
      const data = await adminService.getDashboardOverview();
      set({ overview: data });
    } catch (err) {
      console.warn('Failed to load admin overview:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUsers: async (role, search) => {
    try {
      const data = await adminService.listUsers({ role, search, limit: 100 });
      set({ users: data.items || [] });
    } catch (err) {
      console.warn('Failed to load users:', err);
    }
  },

  updateUserRole: async (userId, role) => {
    // Optimistic update
    set((state) => ({
      users: state.users.map((u) => (u._id === userId ? { ...u, role: role as any } : u)),
    }));

    try {
      await adminService.updateUser(userId, { role });
    } catch (err) {
      console.warn('Failed to update user role:', err);
      // Refresh list on error
      await get().fetchUsers();
    }
  },

  toggleUserStatus: async (userId, currentActive) => {
    set((state) => ({
      users: state.users.map((u) =>
        u._id === userId ? { ...u, isActive: !currentActive } : u
      ),
    }));

    try {
      await adminService.updateUser(userId, { isActive: !currentActive });
    } catch (err) {
      await get().fetchUsers();
      console.warn('Failed to update user status:', err);
    }
  },

  fetchRestaurants: async () => {
    try {
      const list = await adminService.listAllRestaurants();
      set({ restaurants: list });
    } catch (err) {
      console.warn('Failed to load restaurants:', err);
    }
  },

  createRestaurant: async (payload) => {
    await adminService.createRestaurant(payload);
    await get().fetchRestaurants();
    await get().fetchAdminOverview();
  },

  toggleRestaurantStatus: async (restaurantId, currentActive) => {
    set((state) => ({
      restaurants: state.restaurants.map((r) =>
        r._id === restaurantId ? { ...r, isActive: !currentActive } : r
      ),
    }));

    try {
      await adminService.updateRestaurantStatus(restaurantId, { isActive: !currentActive });
    } catch (err) {
      await get().fetchRestaurants();
      console.warn('Failed to update restaurant status:', err);
    }
  },

  fetchCoupons: async () => {
    try {
      const list = await adminService.listCoupons();
      set({ coupons: list });
    } catch (err) {
      console.warn('Failed to load coupons:', err);
    }
  },

  createCoupon: async (payload) => {
    await adminService.createCoupon(payload);
    await get().fetchCoupons();
  },

  toggleCoupon: async (couponId) => {
    set((state) => ({
      coupons: state.coupons.map((c) =>
        c._id === couponId ? { ...c, isActive: !c.isActive } : c
      ),
    }));

    try {
      await adminService.toggleCoupon(couponId);
    } catch (err) {
      await get().fetchCoupons();
      console.warn('Failed to toggle coupon:', err);
    }
  },
}));
