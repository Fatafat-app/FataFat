import { create } from 'zustand';
import * as Location from 'expo-location';
import { Address, GeoLocation } from '../types';

interface LocationState {
  currentLocation: GeoLocation | null;
  selectedAddress: Address | null;
  activeCity: string;
  locationTitle: string;
  locationSubtitle: string;
  isDetectingLocation: boolean;

  setCurrentLocation: (location: GeoLocation) => void;
  setSelectedAddress: (address: Address | null) => void;
  setActiveCity: (city: string) => void;
  detectCurrentLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: {
    latitude: 28.6139,
    longitude: 77.2090,
  },
  selectedAddress: null,
  activeCity: 'New Delhi',
  locationTitle: 'Fetching Location...',
  locationSubtitle: 'Detecting GPS...',
  isDetectingLocation: false,

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setSelectedAddress: (address) => {
    if (address) {
      set({
        selectedAddress: address,
        locationTitle: address.type || 'Home',
        locationSubtitle: `${address.street}, ${address.city}`,
        currentLocation: {
          latitude: address.location?.coordinates?.[1] || 28.6139,
          longitude: address.location?.coordinates?.[0] || 77.2090,
        },
        activeCity: address.city,
      });
    } else {
      set({ selectedAddress: null });
    }
  },
  setActiveCity: (city) => set({ activeCity: city }),

  detectCurrentLocation: async () => {
    try {
      set({ isDetectingLocation: true });

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback default
        set({
          locationTitle: 'Connaught Place',
          locationSubtitle: 'New Delhi, Delhi',
          isDetectingLocation: false,
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      set({ currentLocation: coords });

      // Reverse geocode to get human readable address
      const geocode = await Location.reverseGeocodeAsync(coords);
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const title = place.name || place.district || place.subregion || place.street || 'Current Location';
        const city = place.city || place.subregion || place.region || 'Delhi';
        const state = place.region || place.country || '';
        const subtitle = `${city}${state ? `, ${state}` : ''}`;

        set({
          locationTitle: title,
          locationSubtitle: subtitle,
          activeCity: city,
        });
      } else {
        set({
          locationTitle: 'Current Location',
          locationSubtitle: 'Live GPS Location',
        });
      }
    } catch (err) {
      console.warn('GPS location detection error:', err);
      set({
        locationTitle: 'Connaught Place',
        locationSubtitle: 'New Delhi, Delhi',
      });
    } finally {
      set({ isDetectingLocation: false });
    }
  },
}));
