import { create } from 'zustand';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
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
  detectCurrentLocation: (forcePromptSettings?: boolean) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  selectedAddress: null,
  activeCity: 'New Delhi',
  locationTitle: 'Detecting Location...',
  locationSubtitle: 'Please wait...',
  isDetectingLocation: false,

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setSelectedAddress: (address) => {
    if (address) {
      const isGeneric =
        !address.label ||
        address.label.toLowerCase().includes('current gps') ||
        address.label.toLowerCase().includes('gps location');

      const placeName = isGeneric
        ? address.line1?.split(',')[0]?.trim() || address.city || 'Selected Area'
        : address.label;

      set({
        selectedAddress: isGeneric ? { ...address, label: placeName } : address,
        locationTitle: placeName,
        locationSubtitle: `${address.line1 || (address as any).street || ''}, ${address.city}`,
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

  detectCurrentLocation: async (forcePromptSettings = false) => {
    try {
      set({ isDetectingLocation: true });

      // 1. Check if location services (GPS hardware switch) are enabled
      try {
        const isServicesEnabled = await Location.hasServicesEnabledAsync();
        if (!isServicesEnabled) {
          Alert.alert(
            'GPS is Turned Off',
            'Please turn on your device GPS / Location services to automatically detect your address.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Turn On',
                onPress: () => {
                  if (Platform.OS === 'android') {
                    Location.enableNetworkProviderAsync().catch(() => Linking.openSettings());
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        }
      } catch (svcErr) {
        console.warn('[Location] Service check notice:', svcErr);
      }

      // 2. Request Foreground GPS Permission
      let permResponse = await Location.getForegroundPermissionsAsync();
      if (permResponse.status !== 'granted') {
        permResponse = await Location.requestForegroundPermissionsAsync();
      }

      if (permResponse.status !== 'granted') {
        set({
          locationTitle: 'Connaught Place',
          locationSubtitle: 'New Delhi, Delhi',
          activeCity: 'New Delhi',
          currentLocation: { latitude: 28.6139, longitude: 77.2090 },
          isDetectingLocation: false,
        });

        // If permission was denied and user cannot be asked again or requested explicitly
        if (!permResponse.canAskAgain || forcePromptSettings) {
          Alert.alert(
            'Location Permission Required',
            'Ftafat needs your location to show restaurants and grocery stores nearby. Please enable location access in App Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return;
      }

      // 3. Fast path: Check last known position first
      let position = await Location.getLastKnownPositionAsync();

      // 4. Current high/balanced accuracy position
      if (!position) {
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
        }
      }

      if (position?.coords) {
        const coords: GeoLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        set({ currentLocation: coords });

        // 5. Reverse geocode to get human-readable address
        try {
          const geocode = await Location.reverseGeocodeAsync(coords);
          if (geocode && geocode.length > 0) {
            const place = geocode[0];

            // Filter out plus codes or weird raw coordinate tokens
            const isPlusCode = (val?: string | null) =>
              !!val && (val.includes('+') || /^[0-9A-Z]{4,8}\+[0-9A-Z]{2,4}$/.test(val));

            const cleanName = place.name && !isPlusCode(place.name) ? place.name : null;
            const street = place.street || null;
            const district = place.district || place.subregion || null;
            const city = place.city || place.subregion || place.district || place.region || 'New Delhi';
            const state = place.region || place.country || 'Delhi';

            // Real recognizable place name (e.g. "Connaught Place", "Sector 18", "Rajiv Chowk", etc.)
            const placeName = cleanName || street || district || city || 'Current Location';

            const subtitleParts = [street || cleanName, district, city].filter(Boolean);
            const subtitle =
              Array.from(new Set(subtitleParts)).join(', ') || `${city}${state ? `, ${state}` : ''}`;

            set({
              locationTitle: placeName,
              locationSubtitle: subtitle,
              activeCity: city,
            });

            // If no address selected yet, create a ready-to-use temporary address object with real place name
            if (!get().selectedAddress || get().selectedAddress?._id === 'current-gps-loc') {
              const detectedAddr: Address = {
                _id: 'current-gps-loc',
                label: placeName,
                type: 'home',
                line1: `${place.streetNumber ? place.streetNumber + ', ' : ''}${street || cleanName || placeName}`,
                city,
                state,
                pincode: place.postalCode || '110001',
                location: {
                  type: 'Point',
                  coordinates: [coords.longitude, coords.latitude],
                },
                isDefault: true,
              };
              set({ selectedAddress: detectedAddr });
            }
          }
        } catch (geoErr) {
          console.warn('[Location] Reverse geocoding failed:', geoErr);
        }
      }
    } catch (err) {
      console.warn('[Location] GPS detection error:', err);
      set({
        locationTitle: 'Connaught Place',
        locationSubtitle: 'New Delhi, Delhi',
        activeCity: 'New Delhi',
        currentLocation: { latitude: 28.6139, longitude: 77.2090 },
      });
    } finally {
      set({ isDetectingLocation: false });
    }
  },
}));
