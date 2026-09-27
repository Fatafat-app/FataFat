import { create } from 'zustand';
import { DeliveryPartner, deliveryService, DeliveryHistoryResponse } from '../services/delivery.service';
import { Order } from '../types';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface RiderState {
  partner: DeliveryPartner | null;
  history: DeliveryHistoryResponse | null;
  isLoading: boolean;
  isUpdatingLocation: boolean;
  
  fetchProfile: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  updateDeliveryStatus: (orderId: string, status: string) => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  updateLiveLocation: () => Promise<void>;
}

export const useRiderStore = create<RiderState>((set, get) => ({
  partner: null,
  history: null,
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
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not change status');
    } finally {
      set({ isLoading: false });
    }
  },

  updateDeliveryStatus: async (orderId, status) => {
    try {
      set({ isLoading: true });
      await deliveryService.updateDeliveryStatus(orderId, status);
      // Refresh profile to pull down new active order state (null if delivered)
      const partner = await deliveryService.getProfile();
      set({ partner });
    } catch (error: any) {
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
