import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addressService } from '../../services/address.service';
import { useLocationStore } from '../../store/location.store';
import { Address } from '../../types';
import { Typography, Colors } from '../../constants/Theme';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';

export default function AddressSelectionScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedAddress = useLocationStore((state) => state.selectedAddress);
  const setSelectedAddress = useLocationStore((state) => state.setSelectedAddress);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    router.back();
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Could not set as default');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await addressService.deleteAddress(id);
            if (selectedAddress?._id === id) {
              setSelectedAddress(null);
            }
            fetchAddresses();
          } catch (err) {
            Alert.alert('Error', 'Could not delete address');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Select Address</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/address/add')}>
          <Text style={styles.addText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Loading />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState 
            icon="location-outline" 
            title="No Saved Addresses" 
            message="You don't have any saved addresses yet." 
            actionText="Add New Address"
            onAction={() => router.push('/address/add')}
          />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {(addresses ?? []).map((address) => {
            const isSelected = selectedAddress?._id === address._id;
            return (
              <TouchableOpacity 
                key={address._id} 
                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                onPress={() => handleSelectAddress(address)}
              >
                <View style={styles.addressLeft}>
                  <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={24} color={isSelected ? Colors.primary : Colors.borderDark} />
                  <View style={styles.addressInfo}>
                    <View style={styles.typeRow}>
                      <Text style={styles.addressType}>{address.label}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressStreet}>{address.line1} {address.line2 ? `, ${address.line2}` : ''}</Text>
                    <Text style={styles.addressCity}>{address.city}, {address.state} - {address.pincode}</Text>
                  </View>
                </View>
                <View style={styles.actionsContainer}>
                  {!address.isDefault && (
                    <TouchableOpacity onPress={() => handleSetDefault(address._id)} style={styles.defaultBtn}>
                      <Text style={styles.setDefaultText}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteAddress(address._id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  addText: { ...Typography.button, color: Colors.primary },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, padding: 24 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  addressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  addressCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  addressLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  addressInfo: { marginLeft: 12, flex: 1 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressType: { ...Typography.title, fontSize: 15 },
  defaultBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  defaultBadgeText: { ...Typography.label, color: Colors.white, fontSize: 10 },
  addressStreet: { ...Typography.bodySmall, color: Colors.text, marginBottom: 2 },
  addressCity: { ...Typography.caption, color: Colors.textSecondary },
  actionsContainer: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
  defaultBtn: { marginBottom: 8, backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: Colors.primary },
  setDefaultText: { ...Typography.caption, color: Colors.primary },
  deleteBtn: { padding: 8 },
});
