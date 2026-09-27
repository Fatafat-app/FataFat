import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addressService } from '../../services/address.service';
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
  const [loading, setLoading] = useState(false);

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
        line2,
        city,
        state: stateName,
        pincode,
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139], // Defaulting coords since map isn't built yet
        }
      };
      await addressService.addAddress(payload);
      Alert.alert('Success', 'Address added successfully', [
        { text: 'OK', onPress: () => router.back() }
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
});
