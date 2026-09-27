import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { addressService } from '../../services/address.service';
import { useLocationStore } from '../../store/location.store';
import { CreateAddressPayload, AddressType } from '../../types';
import { Typography, Colors } from '../../constants/Theme';
import { Button } from '../../components/ui/Button';

export default function AddAddressScreen() {
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([77.2090, 28.6139]);
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant GPS permission to detect your current location.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = position.coords;
      setCoordinates([coords.longitude, coords.latitude]);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const streetName = [place.name, place.street].filter(Boolean).join(', ') || place.district || 'Current Location';
        const areaName = [place.subregion, place.district].filter(Boolean).filter((v) => v !== streetName).join(', ');
        const detectedCity = place.city || place.subregion || place.region || 'New Delhi';
        const detectedState = place.region || place.country || 'Delhi';
        const detectedPin = place.postalCode || '';

        setLine1(streetName);
        if (areaName) setLine2(areaName);
        if (detectedCity) setCity(detectedCity);
        if (detectedState) setStateName(detectedState);
        if (detectedPin) setPincode(detectedPin);

        Alert.alert('Location Detected 📍', 'Address details have been filled from your current GPS location.');
      } else {
        Alert.alert('GPS Located', 'Coordinates detected. Please complete street details.');
      }
    } catch (err: any) {
      Alert.alert('GPS Error', err.message || 'Could not detect current location.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSave = async () => {
    if (!line1 || !city || !stateName || !pincode) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload: CreateAddressPayload = {
        label,
        line1,
        line2: line2.trim() || undefined,
        city,
        state: stateName,
        pincode,
        location: {
          type: 'Point',
          coordinates,
        },
      };
      await addressService.addAddress(payload);
      Alert.alert('Success', 'Address added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add address';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const addressTypes: AddressType[] = ['Home', 'Work', 'Other'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Add New Address</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* USE CURRENT LOCATION BUTTON */}
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleUseCurrentLocation}
          disabled={detectingGps}
          activeOpacity={0.8}
        >
          {detectingGps ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="navigate-circle" size={22} color={Colors.primary} style={{ marginRight: 8 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsButtonTitle}>
              {detectingGps ? 'Detecting Your Location...' : 'Use Current GPS Location'}
            </Text>
            <Text style={styles.gpsButtonSubtitle}>Auto-fills address, city & pincode</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>Address Label</Text>
        <View style={styles.typeContainer}>
          {['Home', 'Work', 'Other'].map((t) => (
            <TouchableOpacity 
              key={t}
              style={[styles.typePill, label === t && styles.typePillActive]}
              onPress={() => setLabel(t)}
            >
              <Text style={[styles.typeText, label === t && styles.typeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Address Line 1 (House / Street)</Text>
        <TextInput 
          value={line1}
          onChangeText={setLine1}
          placeholder="Flat 402, Sunshine Heights"
          style={styles.input}
          placeholderTextColor={Colors.borderDark}
        />

        <Text style={styles.label}>Address Line 2 (Area / Landmark) - Optional</Text>
        <TextInput 
          value={line2}
          onChangeText={setLine2}
          placeholder="Near Connaught Place"
          style={styles.input}
          placeholderTextColor={Colors.borderDark}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>City</Text>
            <TextInput 
              value={city}
              onChangeText={setCity}
              placeholder="New Delhi"
              style={styles.input}
              placeholderTextColor={Colors.borderDark}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput 
              value={pincode}
              onChangeText={setPincode}
              placeholder="110001"
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor={Colors.borderDark}
            />
          </View>
        </View>

        <Text style={styles.label}>State</Text>
        <TextInput 
          value={stateName}
          onChangeText={setStateName}
          placeholder="Delhi"
          style={styles.input}
          placeholderTextColor={Colors.borderDark}
        />

        <View style={styles.spacer} />
        
        <Button 
          title="Save Address" 
          onPress={handleSave}
          loading={loading}
          disabled={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 20 },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
  typeContainer: { flexDirection: 'row', gap: 10 },
  typePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  typePillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeText: { ...Typography.bodySmall, color: Colors.text },
  typeTextActive: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },
  input: { ...Typography.body, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: Colors.text },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  spacer: { height: 32 },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  gpsButtonTitle: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 14,
  },
  gpsButtonSubtitle: {
    ...Typography.caption,
    color: '#9A3412',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
