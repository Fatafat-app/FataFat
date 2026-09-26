import { create } from 'zustand';
import { Order, OrderStatus } from '../types';

interface RiderLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  updatedAt: string;
}

interface OrderTrackingState {
  activeOrder: Order | null;
  riderLocation: RiderLocation | null;
  setActiveOrder: (order: Order | null) => void;
  updateOrderStatus: (status: OrderStatus) => void;
  updateRiderLocation: (location: RiderLocation) => void;
  clearTracking: () => void;
}

export const useOrderTrackingStore = create<OrderTrackingState>((set) => ({
  activeOrder: null,
  riderLocation: null,

  setActiveOrder: (order) => set({ activeOrder: order }),
  
  updateOrderStatus: (status) =>
    set((state) => ({
      activeOrder: state.activeOrder ? { ...state.activeOrder, status } : null,
    })),

  updateRiderLocation: (location) => set({ riderLocation: location }),

  clearTracking: () => set({ activeOrder: null, riderLocation: null }),
}));
