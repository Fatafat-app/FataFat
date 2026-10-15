import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRiderStore } from '../../store/rider.store';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

export default function RiderDeliveryScreen() {
  const { partner, isLoading, fetchProfile, updateDeliveryStatus } = useRiderStore();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => fetchProfile();

  const handleCallNumber = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('Phone Unavailable', `No phone number found for ${name || 'contact'}.`);
      return;
    }
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call on this device.');
    });
  };

  const handleOpenMaps = (coords?: number[], addressStr?: string, label?: string) => {
    if (coords && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
      // GeoJSON coordinates are [longitude, latitude]
      const [lng, lat] = coords;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url).catch(() => {
        if (addressStr) {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`);
        }
      });
    } else if (addressStr) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`);
    } else {
      Alert.alert('Address Missing', `Location not available for ${label || 'destination'}.`);
    }
  };

  const handleUpdateStatus = (targetStatus: string, actionName: string) => {
    if (!partner?.activeOrder?._id) return;

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to mark this delivery as "${actionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await updateDeliveryStatus(partner.activeOrder!._id, targetStatus);

              if (targetStatus === 'DELIVERED') {
                Alert.alert(
                  'Delivery Completed! 🎉',
                  'Great job! The order has been marked delivered and your delivery earnings have been credited.',
                  [
                    {
                      text: 'Back to Dashboard',
                      onPress: () => router.replace('/(rider)/dashboard'),
                    },
                  ]
                );
              } else {
                Alert.alert('Route Started! 🛵', 'You are now out for delivery. Drive safe!');
              }
            } catch (err: any) {
              console.error('[Delivery] update status error', err);
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

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
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyIconBg}>
            <Ionicons name="bicycle-outline" size={56} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptySubtitle}>
            You are currently not assigned to any order. Available orders will appear on your dashboard.
          </Text>
          <TouchableOpacity
            style={styles.backDashboardBtn}
            onPress={() => router.replace('/(rider)/dashboard')}
          >
            <Ionicons name="grid-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.backDashboardBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Current status normalized
  const currentStatus = (order.orderStatus || order.status || '').toUpperCase();
  const isOut = currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'PICKED_UP';
  const isDelivered = currentStatus === 'DELIVERED';

  // Customer details resolution
  const customer =
    (order.customerId && typeof order.customerId === 'object' ? order.customerId : null) ||
    (order.user && typeof order.user === 'object' ? order.user : null);

  const customerName =
    customer?.name ||
    (order.deliveryAddress as any)?.contactName ||
    'Customer';

  const customerPhone =
    customer?.phone ||
    (order.deliveryAddress as any)?.contactPhone ||
    '';

  const addressLine1 =
    order.deliveryAddress?.line1 ||
    (order.deliveryAddress as any)?.street ||
    'Main Address';

  const addressLine2 = order.deliveryAddress?.line2 || '';
  const addressCity = order.deliveryAddress?.city || '';
  const addressState = order.deliveryAddress?.state || '';
  const addressPincode = order.deliveryAddress?.pincode ? ` - ${order.deliveryAddress.pincode}` : '';
  const cityStatePin = [addressCity, addressState].filter(Boolean).join(', ') + addressPincode;
  const fullCustomerAddress = [addressLine1, addressLine2, cityStatePin].filter(Boolean).join(', ');

  const customerCoords = order.deliveryAddress?.location?.coordinates;

  // Restaurant details resolution
  const restaurantObj =
    typeof order.restaurant === 'object' && order.restaurant ? order.restaurant : null;
  const vendorObj =
    typeof (order as any).vendorId === 'object' && (order as any).vendorId ? (order as any).vendorId : null;

  const restaurantName = restaurantObj?.name || vendorObj?.name || 'Restaurant / Store';
  const restaurantPhone = restaurantObj?.phone || vendorObj?.phone || '';
  const restLine1 =
    restaurantObj?.address?.line1 ||
    restaurantObj?.address?.street ||
    vendorObj?.address?.line1 ||
    vendorObj?.address?.street ||
    'Store Address';
  const restLine2 = restaurantObj?.address?.line2 || vendorObj?.address?.line2 || '';
  const restCityState = [
    restaurantObj?.address?.city || vendorObj?.address?.city,
    restaurantObj?.address?.state || vendorObj?.address?.state,
  ]
    .filter(Boolean)
    .join(', ');
  const restPin =
    restaurantObj?.address?.pincode || vendorObj?.address?.pincode
      ? ` - ${restaurantObj?.address?.pincode || vendorObj?.address?.pincode}`
      : '';
  const fullRestAddress = [restLine1, restLine2, restCityState + restPin].filter(Boolean).join(', ');
  const restCoords = restaurantObj?.location?.coordinates || vendorObj?.location?.coordinates;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View>
          <View style={styles.liveTagRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTagText}>ACTIVE RUN</Text>
          </View>
          <Text style={styles.pageTitle}>Order #{order.orderNumber}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Step Progress Tracker */}
        <View style={styles.progressTrackerCard}>
          <Text style={styles.trackerHeading}>DELIVERY PROGRESS</Text>
          <View style={styles.stepsRow}>
            {/* Step 1: Store Pickup */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Ionicons name="storefront" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepTitle}>Pickup</Text>
              <Text style={styles.stepSub}>{isOut || isDelivered ? 'Done' : 'Collect'}</Text>
            </View>

            {/* Connecting Bar 1 */}
            <View style={[styles.stepConnector, (isOut || isDelivered) && styles.connectorActive]} />

            {/* Step 2: Out for Delivery */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isOut ? styles.stepActive : isDelivered ? styles.stepCompleted : styles.stepPending,
                ]}
              >
                <Ionicons
                  name="bicycle"
                  size={16}
                  color={isOut || isDelivered ? '#FFFFFF' : '#94A3B8'}
                />
              </View>
              <Text style={[styles.stepTitle, isOut && styles.stepTitleActive]}>On The Way</Text>
              <Text style={styles.stepSub}>{isOut ? 'In Transit' : isDelivered ? 'Done' : 'Next'}</Text>
            </View>

            {/* Connecting Bar 2 */}
            <View style={[styles.stepConnector, isDelivered && styles.connectorActive]} />

            {/* Step 3: Delivered */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, isDelivered ? styles.stepCompleted : styles.stepPending]}>
                <Ionicons name="checkmark-done" size={16} color={isDelivered ? '#FFFFFF' : '#94A3B8'} />
              </View>
              <Text style={[styles.stepTitle, isDelivered && styles.stepTitleActive]}>Delivered</Text>
              <Text style={styles.stepSub}>{isDelivered ? 'Success' : 'Drop-off'}</Text>
            </View>
          </View>

          {/* Current Status Badge */}
          <View style={styles.statusBadgeRow}>
            <Text style={styles.statusBadgeLabel}>Current Status:</Text>
            <View
              style={[
                styles.statusBadgePill,
                {
                  backgroundColor: isDelivered ? '#DCFCE7' : isOut ? '#DBEAFE' : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: isDelivered ? '#15803D' : isOut ? '#1D4ED8' : '#B45309',
                  },
                ]}
              >
                {currentStatus.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* 1. Pickup From Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="storefront" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTag}>STEP 1: PICKUP POINT</Text>
              <Text style={styles.cardHeaderTitle}>{restaurantName}</Text>
            </View>
            {restaurantPhone ? (
              <TouchableOpacity
                style={styles.callCircleBtn}
                onPress={() => handleCallNumber(restaurantPhone, restaurantName)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={18} color="#16A34A" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressLine}>{fullRestAddress}</Text>
            {restaurantPhone ? (
              <Text style={styles.phoneSubtext}>📞 Phone: {restaurantPhone}</Text>
            ) : null}
          </View>

          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={() => handleOpenMaps(restCoords, fullRestAddress, restaurantName)}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.navigateBtnText}>Navigate to Store</Text>
            </TouchableOpacity>

            {restaurantPhone ? (
              <TouchableOpacity
                style={styles.callPillBtn}
                onPress={() => handleCallNumber(restaurantPhone, restaurantName)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={16} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.callPillBtnText}>Call Store</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 2. Deliver To Customer Section */}
        <View style={[styles.card, isOut && styles.cardHighlighted]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="location" size={22} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardHeaderTag, { color: '#4F46E5' }]}>STEP 2: DELIVER TO CUSTOMER</Text>
              <Text style={styles.customerNameTitle}>{customerName}</Text>
            </View>
            {customerPhone ? (
              <TouchableOpacity
                style={[styles.callCircleBtn, { backgroundColor: '#DCFCE7' }]}
                onPress={() => handleCallNumber(customerPhone, customerName)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={18} color="#15803D" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.addressBox}>
            <View style={styles.customerDetailRow}>
              <Ionicons name="person-circle" size={18} color="#4F46E5" style={{ marginRight: 6 }} />
              <Text style={styles.customerNameBold}>{customerName}</Text>
            </View>

            <View style={styles.customerDetailRow}>
              <Ionicons name="home-outline" size={16} color="#64748B" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.addressLine}>{fullCustomerAddress}</Text>
            </View>

            {customerPhone ? (
              <View style={styles.customerDetailRow}>
                <Ionicons name="call-outline" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={styles.phoneHighlight}>+91 {customerPhone.replace(/^\+91/, '')}</Text>
              </View>
            ) : (
              <Text style={styles.noPhoneText}>No direct phone registered</Text>
            )}

            {order.deliveryInstructions ? (
              <View style={styles.instructionsBox}>
                <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.instructionsText}>
                  Note: {order.deliveryInstructions}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={[styles.navigateBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
              onPress={() => handleOpenMaps(customerCoords, fullCustomerAddress, customerName)}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={18} color="#4F46E5" style={{ marginRight: 6 }} />
              <Text style={[styles.navigateBtnText, { color: '#4F46E5' }]}>Navigate to Customer</Text>
            </TouchableOpacity>

            {customerPhone ? (
              <TouchableOpacity
                style={styles.callPillBtn}
                onPress={() => handleCallNumber(customerPhone, customerName)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.callPillBtnText}>Call Customer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Order Items & Earnings Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="wallet-outline" size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTag}>EARNINGS & ORDER VALUE</Text>
              <Text style={styles.cardHeaderTitle}>Delivery Payout</Text>
            </View>
            <View style={styles.payoutBadge}>
              <Text style={styles.payoutBadgeText}>+₹40 EARNED</Text>
            </View>
          </View>

          <View style={styles.paymentBox}>
            <View>
              <Text style={styles.paymentLabel}>Customer Paid</Text>
              <Text style={styles.paymentTotal}>
                {formatPaise(order.pricing?.totalAmount || (order as any)?.totalAmount || 0)}
              </Text>
            </View>
            <View style={styles.paidOnlineTag}>
              <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={styles.paidOnlineText}>PREPAID ONLINE</Text>
            </View>
          </View>
        </View>

        {/* PRIMARY ACTION BUTTONS */}
        <View style={styles.actionSection}>
          {!isOut && !isDelivered ? (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('OUT_FOR_DELIVERY', 'Out for Delivery')}
              disabled={isUpdating}
              style={[styles.primaryActionBtn, { backgroundColor: '#2563EB' }]}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="bicycle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.primaryActionBtnText}>Start Delivery Route 🛵</Text>
                    <Text style={styles.primaryActionBtnSubtext}>
                      Order collected • Head to {customerName}
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ) : isOut ? (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('DELIVERED', 'Delivered')}
              disabled={isUpdating}
              style={[styles.primaryActionBtn, { backgroundColor: '#16A34A' }]}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={26} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.primaryActionBtnText}>Mark Order Delivered ✅</Text>
                    <Text style={styles.primaryActionBtnSubtext}>
                      Handed over food • Complete & credit ₹40
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.replace('/(rider)/dashboard')}
              style={[styles.primaryActionBtn, { backgroundColor: '#475569' }]}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Order Delivered • Return to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: { ...Typography.bodySmall, color: '#64748B', marginTop: 12 },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { ...Typography.heading, fontSize: 20, color: '#1E293B', marginBottom: 8 },
  emptySubtitle: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },
  backDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backDashboardBtnText: { ...Typography.title, color: '#FFFFFF', fontSize: 14 },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginRight: 6 },
  liveTagText: { ...Typography.label, fontSize: 10, color: '#16A34A', fontWeight: '700' },
  pageTitle: { ...Typography.heading, fontSize: 18, color: '#0F172A' },
  refreshBtn: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 50 },

  // Progress tracker
  progressTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  trackerHeading: {
    ...Typography.label,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 14,
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepItem: { alignItems: 'center', width: 70 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCompleted: { backgroundColor: '#16A34A' },
  stepActive: { backgroundColor: '#2563EB' },
  stepPending: { backgroundColor: '#E2E8F0' },
  stepTitle: { ...Typography.label, fontSize: 11, color: '#64748B', textAlign: 'center' },
  stepTitleActive: { color: '#0F172A', fontWeight: '700' },
  stepSub: { ...Typography.caption, fontSize: 10, color: '#94A3B8', marginTop: 1 },
  stepConnector: { flex: 1, height: 3, backgroundColor: '#E2E8F0', marginTop: -18 },
  connectorActive: { backgroundColor: '#16A34A' },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusBadgeLabel: { ...Typography.caption, color: '#64748B', marginRight: 6 },
  statusBadgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { ...Typography.label, fontSize: 11, fontWeight: '700' },

  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHighlighted: {
    borderColor: '#818CF8',
    backgroundColor: '#FAFAFF',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTag: { ...Typography.label, fontSize: 10, color: '#D97706', fontWeight: '700' },
  cardHeaderTitle: { ...Typography.heading, fontSize: 16, color: '#0F172A' },
  customerNameTitle: { ...Typography.heading, fontSize: 17, color: '#1E1B4B' },
  callCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  customerDetailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  customerNameBold: { ...Typography.title, fontSize: 15, color: '#0F172A', fontWeight: '700' },
  addressLine: { ...Typography.bodySmall, fontSize: 13, color: '#334155', flex: 1, lineHeight: 18 },
  phoneHighlight: { ...Typography.title, fontSize: 13, color: '#15803D', fontWeight: '600' },
  phoneSubtext: { ...Typography.caption, color: '#475569', marginTop: 4 },
  noPhoneText: { ...Typography.caption, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  instructionsText: { ...Typography.caption, color: '#92400E', flex: 1, fontWeight: '500' },
  cardActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 10,
  },
  navigateBtnText: { ...Typography.title, fontSize: 13, color: '#2563EB', fontWeight: '600' },
  callPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callPillBtnText: { ...Typography.title, fontSize: 13, color: '#15803D', fontWeight: '600' },

  // Earnings & Payment
  payoutBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  payoutBadgeText: { ...Typography.label, fontSize: 11, color: '#15803D', fontWeight: '700' },
  paymentBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentLabel: { ...Typography.caption, color: '#64748B' },
  paymentTotal: { ...Typography.heading, fontSize: 18, color: '#0F172A', marginTop: 2 },
  paidOnlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paidOnlineText: { ...Typography.label, fontSize: 10, color: '#15803D', fontWeight: '700' },

  // Primary Actions
  actionSection: { marginTop: 12, marginBottom: 20 },
  primaryActionBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnText: {
    ...Typography.heading,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  primaryActionBtnSubtext: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
});
