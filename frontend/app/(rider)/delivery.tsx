import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRiderStore } from '../../store/rider.store';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

export default function RiderDeliveryScreen() {
  const { partner, isLoading, fetchProfile, updateDeliveryStatus } = useRiderStore();

  const handleUpdateStatus = (status: string, actionName: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to mark this delivery as ${actionName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateDeliveryStatus(partner!.activeOrder!._id, status);
              Alert.alert('Success', `Order marked as ${actionName}`);
              if (status === 'DELIVERED') {
                router.replace('/(rider)/dashboard');
              }
            } catch (err) {
              // handled in store
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => fetchProfile();

  if (isLoading && !partner) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading delivery data...</Text>
      </SafeAreaView>
    );
  }

  const order = partner?.activeOrder;

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navbar}>
          <Text style={styles.pageTitle}>Current Run</Text>
        </View>
        <ScrollView contentContainerStyle={styles.centerContainer} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}>
          <Ionicons name="bicycle-outline" size={64} color={Colors.borderDark} />
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptySubtitle}>You are currently not assigned to any order. Go online to receive orders.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isPreparing = ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status);
  const isReady = order.status === 'READY_FOR_PICKUP';
  const isOut = order.status === 'OUT_FOR_DELIVERY';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Live Delivery</Text>
          <Text style={styles.pageSubtitle}>Order #{order.orderNumber}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Status Tracker */}
        <View style={styles.trackerCard}>
          <Text style={styles.trackerLabel}>CURRENT STATUS</Text>
          <Text style={[styles.trackerValue, { color: isOut ? '#2563EB' : isReady ? '#059669' : '#D97706' }]}>
            {order.status.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Restaurant Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="storefront" size={20} color="#D97706" />
            </View>
            <Text style={styles.sectionTitle}>1. Pickup From</Text>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressName}>{typeof order.restaurant === 'object' ? order.restaurant.name : 'Restaurant'}</Text>
            <Text style={styles.addressText}>{typeof order.restaurant === 'object' ? order.restaurant.address?.street : 'Loading...'}</Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="location" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.sectionTitle}>2. Deliver To</Text>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressName}>Customer Name</Text>
            <Text style={styles.addressText}>{order.deliveryAddress?.street}</Text>
            <Text style={styles.addressText}>{order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}</Text>
            {order.deliveryInstructions ? (
              <View style={styles.instructionsBox}>
                <Ionicons name="information-circle" size={14} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.instructionsText}>{order.deliveryInstructions}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Payment & Items */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="cash" size={20} color="#16A34A" />
            </View>
            <Text style={styles.sectionTitle}>Order Amount</Text>
          </View>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTotal}>{formatPaise(order.pricing?.totalAmount)}</Text>
            <View style={styles.paymentTag}>
              <Text style={styles.paymentTagText}>PAID ONLINE</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isOut ? (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('OUT_FOR_DELIVERY', 'Out for Delivery')}
              disabled={isPreparing}
              style={[styles.primaryBtn, isPreparing && styles.disabledBtn]}
            >
              <Ionicons name="bicycle" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>
                {isPreparing ? 'Waiting for Kitchen...' : 'Start Delivery Route'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('DELIVERED', 'Delivered')}
              style={[styles.primaryBtn, { backgroundColor: Colors.success }]}
            >
              <Ionicons name="checkmark-done" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 20 },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  emptyTitle: { ...Typography.heading, fontSize: 18, marginTop: 16 },
  emptySubtitle: { ...Typography.bodySmall, textAlign: 'center', marginTop: 8 },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { ...Typography.heading, fontSize: 18 },
  pageSubtitle: { ...Typography.bodySmall, fontSize: 11 },
  refreshBtn: { backgroundColor: Colors.background, padding: 8, borderRadius: 10 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },
  trackerCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  trackerLabel: { ...Typography.label, fontSize: 10, color: Colors.textSecondary, marginBottom: 4 },
  trackerValue: { ...Typography.heading, fontSize: 22, textTransform: 'uppercase' },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { ...Typography.title, fontSize: 14 },
  addressBox: { backgroundColor: Colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  addressName: { ...Typography.title, fontSize: 14, marginBottom: 4 },
  addressText: { ...Typography.bodySmall, fontSize: 13, color: Colors.textSecondary },
  instructionsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, marginTop: 8 },
  instructionsText: { ...Typography.caption, color: '#92400E', flex: 1 },
  paymentBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  paymentTotal: { ...Typography.heading, fontSize: 20 },
  paymentTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paymentTagText: { ...Typography.label, fontSize: 9, color: '#16A34A' },
  actionsContainer: { marginTop: 10 },
  primaryBtn: { backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { backgroundColor: '#93C5FD', opacity: 0.8 },
  primaryBtnText: { ...Typography.heading, color: Colors.white, fontSize: 16 },
});
