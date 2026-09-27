import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../services/order.service';
import { socketService } from '../../services/socket.service';
import { useOrderTrackingStore } from '../../store/orderTracking.store';
import { Order, OrderStatus } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { ErrorState } from '../../components/ui/ErrorState';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'flame' },
  { status: 'OUT_FOR_DELIVERY', label: 'On The Way', icon: 'bicycle' },
  { status: 'DELIVERED', label: 'Delivered', icon: 'home' },
];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Socket state
  const activeOrder = useOrderTrackingStore((state) => state.activeOrder);
  const riderLocation = useOrderTrackingStore((state) => state.riderLocation);
  const updateOrderStatus = useOrderTrackingStore((state) => state.updateOrderStatus);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load this order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  useEffect(() => {
    // Only connect socket if the order is active and we are viewing it
    const isFinished = !order || ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(
      (order.status || (order as any).orderStatus || '').toString().toUpperCase()
    );
    if (!isFinished && order) {
      socketService.connect().then(() => {
        socketService.joinOrderRoom(order._id);
      });
    }

    return () => {
      if (!isFinished && order) {
        socketService.leaveOrderRoom(order._id);
      }
    };
  }, [order]);

  const handleCancelOrder = async () => {
    if (!order) return;
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const cancelled = await orderService.cancelOrder(order._id, 'User requested cancellation from details');
            setOrder(cancelled);
            updateOrderStatus('CANCELLED');
            Alert.alert('Success', 'Order has been cancelled.');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not cancel order');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ErrorState title="Order Not Found" message={error} onRetry={fetchOrderDetails} />
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Display status from socket if it's the active order, else fallback to API fetched order
  const displayStatus = (activeOrder && activeOrder._id === order._id) ? activeOrder.status : order.status;

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0;
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(displayStatus);
  const isCancelled = displayStatus === 'CANCELLED';
  const restName =
    (typeof order.restaurant === 'object' && order.restaurant !== null && (order.restaurant as any).name)
    || (typeof order.restaurantId === 'object' && order.restaurantId !== null && (order.restaurantId as any).name)
    || (typeof (order as any).restaurantName === 'string' ? (order as any).restaurantName : null)
    || 'Partner Restaurant';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Tracking Timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>ORDER TRACKING</Text>
            <View style={styles.timelineRow}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <View key={step.status} style={styles.timelineStep}>
                    <View style={[styles.stepCircle, isPassed && styles.stepCirclePassed, isCurrent && styles.stepCircleCurrent]}>
                      <Ionicons name={step.icon} size={16} color={isPassed || isCurrent ? '#FFF' : '#9CA3AF'} />
                    </View>
                    <Text style={[styles.stepLabel, isPassed && styles.stepLabelPassed, isCurrent && styles.stepLabelCurrent]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {riderLocation && activeOrder?._id === order._id && displayStatus === 'OUT_FOR_DELIVERY' && (
              <View style={styles.riderAlertBox}>
                <Ionicons name="navigate" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.riderAlertText}>Delivery partner is arriving soon!</Text>
              </View>
            )}
            
            {['PENDING', 'CONFIRMED'].includes(displayStatus) && (
              <TouchableOpacity onPress={handleCancelOrder} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isCancelled && (
          <View style={[styles.card, styles.cancelledCard]}>
            <Ionicons name="close-circle" size={32} color={Colors.error} />
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledSubtitle}>This order has been cancelled.</Text>
          </View>
        )}

        {/* Restaurant Info */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>RESTAURANT</Text>
          <Text style={styles.restaurantName}>{restName}</Text>
          <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleString()}</Text>
        </View>

        {/* Items Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>ITEMS</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx !== order.items.length - 1 && styles.itemBorder]}>
              <View style={styles.itemLeft}>
                <View style={styles.qtyBox}><Text style={styles.qtyText}>{item.quantity}</Text></View>
                <Text style={styles.itemName}>x {item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPaise(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>BILL DETAILS</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPaise(order.pricing?.itemsTotal ?? (order as any).subtotal ?? 0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>{formatPaise(order.pricing?.deliveryFee ?? (order as any).deliveryFee ?? 0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST</Text>
            <Text style={styles.billValue}>{formatPaise(order.pricing?.gstAndTaxes ?? (order as any).taxAmount ?? 0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>{formatPaise(order.pricing?.platformFee ?? 500)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>{formatPaise(order.pricing?.totalAmount ?? (order as any).totalAmount ?? 0)}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        {order.deliveryAddress && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>DELIVERY DETAILS</Text>
            <View style={styles.addressBox}>
              <Text style={styles.addressType}>{order.deliveryAddress.label || 'Home'}</Text>
              <Text style={styles.addressStreet}>{order.deliveryAddress.line1}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  goBackButton: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  goBackText: { ...Typography.button, color: Colors.white },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeading: { ...Typography.label, letterSpacing: 0.5, marginBottom: 12, color: Colors.textSecondary },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingHorizontal: 4 },
  timelineStep: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepCirclePassed: { backgroundColor: Colors.success },
  stepCircleCurrent: { backgroundColor: Colors.primary },
  stepLabel: { ...Typography.caption, textAlign: 'center', fontSize: 10 },
  stepLabelPassed: { color: Colors.text },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '900' },
  riderAlertBox: { backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFEDD5' },
  riderAlertText: { ...Typography.subtitle, color: '#C2410C', fontSize: 12, flex: 1 },
  cancelButton: { backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', marginTop: 16 },
  cancelButtonText: { ...Typography.button, color: Colors.error },
  cancelledCard: { alignItems: 'center', paddingVertical: 24 },
  cancelledTitle: { ...Typography.heading, fontSize: 18, color: Colors.error, marginTop: 12 },
  cancelledSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  restaurantName: { ...Typography.title, fontSize: 18, marginBottom: 4 },
  dateText: { ...Typography.caption, color: Colors.textSecondary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.background },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  qtyBox: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  qtyText: { ...Typography.button, color: Colors.primary },
  itemName: { ...Typography.body, color: Colors.text },
  itemPrice: { ...Typography.title, fontSize: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  billValue: { ...Typography.subtitle, fontSize: 13 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { ...Typography.title, fontSize: 15 },
  grandTotalValue: { ...Typography.heading, fontSize: 17, color: Colors.primary },
  addressBox: { backgroundColor: Colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  addressType: { ...Typography.title, fontSize: 13, marginBottom: 4 },
  addressStreet: { ...Typography.bodySmall, color: Colors.text },
});
