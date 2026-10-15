import { create } from 'zustand';
import { DeliveryPartner, deliveryService, DeliveryHistoryResponse } from '../services/delivery.service';
import { Order } from '../types';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface RiderState {
  partner: DeliveryPartner | null;
  history: DeliveryHistoryResponse | null;
  availableOrders: Order[];
  isLoading: boolean;
  isUpdatingLocation: boolean;
  
  fetchProfile: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  fetchAvailableOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<boolean>;
  removeClaimedOrder: (orderId: string) => void;
  addAvailableOrder: (order: any) => void;
  updateDeliveryStatus: (orderId: string, status: string) => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  updateLiveLocation: () => Promise<void>;
}

export const useRiderStore = create<RiderState>((set, get) => ({
  partner: null,
  history: null,
  availableOrders: [],
  isLoading: false,
  isUpdatingLocation: false,

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const partner = await deliveryService.getProfile();
      set({ partner });
    } catch (error) {
      console.error('[RiderStore] Error fetching profile', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleOnline: async () => {
    const { partner } = get();
    if (!partner) return;
    const nextState = !partner.isOnline;
    
    // Check permission before going online
    if (nextState) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is strictly required to receive orders and go online.');
        return;
      }
    }

    try {
      set({ isLoading: true });
      const updatedPartner = await deliveryService.toggleOnline(nextState);
      set({ partner: updatedPartner });
      if (nextState) {
        get().fetchAvailableOrders();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not change status');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAvailableOrders: async () => {
    try {
      const orders = await deliveryService.getAvailableOrders();
      if (__DEV__) {
        console.log(`[RiderStore] Fetched ${orders.length} available orders`);
      }
      set({ availableOrders: orders });
    } catch (error) {
      console.warn('[RiderStore] fetchAvailableOrders error:', error);
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      set({ isLoading: true });
      await deliveryService.acceptOrder(orderId);
      set((state) => ({
        availableOrders: state.availableOrders.filter((o) => (o._id || (o as any).id) !== orderId),
      }));
      await get().fetchProfile();
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ye order kisi aur delivery partner ne accept kar liya hai.';
      Alert.alert('Order Unavailable', msg);
      set((state) => ({
        availableOrders: state.availableOrders.filter((o) => (o._id || (o as any).id) !== orderId),
      }));
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  removeClaimedOrder: (orderId: string) => {
    set((state) => ({
      availableOrders: state.availableOrders.filter((o) => (o._id || (o as any).id) !== orderId),
    }));
  },

  addAvailableOrder: (newOrder: any) => {
    set((state) => {
      const exists = state.availableOrders.some((o) => (o._id || (o as any).id) === (newOrder._id || newOrder.orderId));
      if (exists) return state;
      return { availableOrders: [newOrder, ...state.availableOrders] };
    });
  },

  updateDeliveryStatus: async (orderId, status) => {
    try {
      set({ isLoading: true });
      // Optimistic update
      set((state) => {
        if (!state.partner?.activeOrder) return state;
        const isDelivered = status.toUpperCase() === 'DELIVERED';
        if (isDelivered) {
          return {
            partner: {
              ...state.partner,
              activeOrder: null,
              isAvailable: state.partner.isOnline,
            },
          };
        }
        return {
          partner: {
            ...state.partner,
            activeOrder: {
              ...state.partner.activeOrder,
              status: status as any,
              orderStatus: status,
            },
          },
        };
      });

      await deliveryService.updateDeliveryStatus(orderId, status);
      // Fresh profile to ensure server-synced earnings, stats, etc.
      const partner = await deliveryService.getProfile();
      set({ partner });
    } catch (error: any) {
      await get().fetchProfile();
      Alert.alert('Error', error.response?.data?.message || 'Could not update delivery status');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async (page = 1) => {
    try {
      set({ isLoading: true });
      const history = await deliveryService.getHistory({ page, limit: 20 });
      set({ history });
    } catch (error) {
      console.error('[RiderStore] Error fetching history', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateLiveLocation: async () => {
    const { partner, isUpdatingLocation } = get();
    if (!partner || !partner.isOnline || isUpdatingLocation) return;

    try {
      set({ isUpdatingLocation: true });
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await deliveryService.updateLocation(
        location.coords.latitude,
        location.coords.longitude,
        partner.activeOrder?._id
      );
    } catch (error) {
      console.warn('[RiderStore] Silent fail updating location', error);
    } finally {
      set({ isUpdatingLocation: false });
    }
  }
}));
