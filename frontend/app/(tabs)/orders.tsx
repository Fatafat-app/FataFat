import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { orderService } from '../../services/order.service';
import { socketService } from '../../services/socket.service';
import { useOrderTrackingStore } from '../../store/orderTracking.store';
import { Order, OrderStatus } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'flame' },
  { status: 'OUT_FOR_DELIVERY', label: 'On The Way', icon: 'bicycle' },
  { status: 'DELIVERED', label: 'Delivered', icon: 'home' },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeOrder = useOrderTrackingStore((state) => state.activeOrder);
  const riderLocation = useOrderTrackingStore((state) => state.riderLocation);
  const setActiveOrder = useOrderTrackingStore((state) => state.setActiveOrder);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getOrders({ page: 1, limit: 15 });
      const orderList = data.items || [];
      setOrders(orderList);

      const ongoing = orderList.find((o) => {
        const s = (o.status || (o as any).orderStatus || '').toString().toUpperCase();
        return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(s);
      });

      if (ongoing) {
        setActiveOrder(ongoing);
        socketService.joinOrderRoom(ongoing._id);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setActiveOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await orderService.cancelOrder(orderId, 'User requested cancellation');
            Alert.alert('Success', 'Order has been cancelled.');
            fetchOrders();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not cancel order');
          }
        },
      },
    ]);
  };

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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching your orders...</Text>
      </SafeAreaView>
    );
  }

  const currentStep = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Active Live Tracking Card */}
        {activeOrder && !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes((activeOrder.status || (activeOrder as any).orderStatus || '').toString().toUpperCase()) && (
          <TouchableOpacity 
            style={styles.activeCard} 
            onPress={() => router.push(`/order/${activeOrder._id}`)}
            activeOpacity={0.9}
          >
            <View style={styles.activeHeaderRow}>
              <View>
                <View style={styles.badgeRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.liveBadgeText}>LIVE ORDER ACTIVE</Text>
                </View>
                <Text style={styles.activeOrderNumber}>Order #{activeOrder.orderNumber}</Text>
              </View>
            </View>

            {/* Live Timeline Status */}
            <View style={styles.timelineRow}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <View key={step.status} style={styles.timelineStep}>
                    <View
                      style={[
                        styles.stepCircle,
                        isPassed && styles.stepCirclePassed,
                        isCurrent && styles.stepCircleCurrent,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={16}
                        color={isPassed || isCurrent ? '#FFF' : '#9CA3AF'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isPassed && styles.stepLabelPassed,
                        isCurrent && styles.stepLabelCurrent,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Rider GPS Location Alert */}
            {riderLocation && (
              <View style={styles.riderAlertBox}>
                <Ionicons name="navigate" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.riderAlertText}>Delivery partner is on the move!</Text>
              </View>
            )}

            {/* Order Items Preview */}
            <View style={styles.activeOrderFooter}>
              <Text style={styles.itemsPreviewText} numberOfLines={1}>
                {activeOrder.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
              </Text>
              <Text style={styles.priceHighlight}>
                {formatPaise(activeOrder.pricing?.totalAmount || (activeOrder as any).totalAmount || 0)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Past Orders Header */}
        <Text style={styles.sectionHeading}>PAST ORDERS</Text>

        {orders.length === 0 ? (
          <EmptyState 
            icon="receipt-outline" 
            title="No Orders Found" 
            message="You haven't placed any orders yet." 
            actionText="Order Now"
            onAction={() => router.replace('/(tabs)')}
          />
        ) : (
          orders.map((order) => {
            const restName =
              (order as any).restaurant?.name ||
              (typeof order.restaurantId === 'object' && order.restaurantId !== null ? order.restaurantId.name : null) ||
              'Partner Restaurant';

            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';
            const totalPrice = order.pricing?.totalAmount || (order as any).totalAmount || 0;

            return (
              <TouchableOpacity 
                key={order._id} 
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order._id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.orderCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.restaurantName}>{restName}</Text>
                    <Text style={styles.orderNumberSub}>Order #{order.orderNumber}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isDelivered && styles.statusDelivered,
                      isCancelled && styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isDelivered && styles.statusDeliveredText,
                        isCancelled && styles.statusCancelledText,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Items Summary */}
                <View style={styles.itemList}>
                  {order.items?.map((it, idx) => (
                    <Text key={idx} style={styles.itemText}>
                      {it.quantity} × {it.name}
                    </Text>
                  ))}
                </View>

                {/* Footer with Price and Details */}
                <View style={styles.orderCardFooter}>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.orderTotal}>
                    {formatPaise(totalPrice)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  header: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { ...Typography.heading, fontSize: 22 },
  refreshButton: { padding: 6 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 110 },
  activeCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 2, borderColor: '#FED7AA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  activeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 6 },
  liveBadgeText: { ...Typography.label, color: Colors.success, letterSpacing: 0.5 },
  activeOrderNumber: { ...Typography.title, fontSize: 16, marginTop: 2 },
  cancelButton: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  cancelButtonText: { ...Typography.button, color: Colors.error, fontSize: 11 },
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
  activeOrderFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsPreviewText: { ...Typography.bodySmall, flex: 1, marginRight: 8 },
  priceHighlight: { ...Typography.title, fontSize: 15 },
  sectionHeading: { ...Typography.label, letterSpacing: 0.5, marginBottom: 10 },
  orderCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  restaurantName: { ...Typography.title, fontSize: 16 },
  orderNumberSub: { ...Typography.caption, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: Colors.primaryLight },
  statusDelivered: { backgroundColor: '#DCFCE7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusPillText: { ...Typography.button, fontSize: 10, color: '#C2410C' },
  statusDeliveredText: { color: Colors.success },
  statusCancelledText: { color: Colors.error },
  itemList: { marginVertical: 6 },
  itemText: { ...Typography.bodySmall, fontSize: 13 },
  orderCardFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.background, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { ...Typography.caption },
  orderTotal: { ...Typography.title, fontSize: 15 },
});
