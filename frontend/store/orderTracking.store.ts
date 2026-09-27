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

  setActiveOrder: (order) => {
    if (!order) {
      set({ activeOrder: null, riderLocation: null });
      return;
    }
    const status = (order.status || (order as any).orderStatus || '').toString().toUpperCase();
    if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status)) {
      set({ activeOrder: null, riderLocation: null });
      return;
    }
    set({ activeOrder: order });
  },
  
  updateOrderStatus: (status) =>
    set((state) => {
      const upperStatus = (status || '').toString().toUpperCase();
      if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(upperStatus)) {
        return { activeOrder: null, riderLocation: null };
      }
      return {
        activeOrder: state.activeOrder ? { ...state.activeOrder, status: upperStatus as OrderStatus } : null,
      };
    }),

  updateRiderLocation: (location) => set({ riderLocation: location }),

  clearTracking: () => set({ activeOrder: null, riderLocation: null }),
}));
