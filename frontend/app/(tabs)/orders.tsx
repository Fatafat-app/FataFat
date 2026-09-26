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
      setOrders(data.items || []);

      const ongoing = data.items?.find((o) =>
        ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(
          o.status
        )
      );
      if (ongoing) {
        setActiveOrder(ongoing);
        socketService.joinOrderRoom(ongoing._id);
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
        <ActivityIndicator size="large" color="#FF6000" />
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
          <Ionicons name="refresh" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6000']} />}
      >
        {/* Active Live Tracking Card */}
        {activeOrder && activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED' && (
          <View style={styles.activeCard}>
            <View style={styles.activeHeaderRow}>
              <View>
                <View style={styles.badgeRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.liveBadgeText}>LIVE ORDER ACTIVE</Text>
                </View>
                <Text style={styles.activeOrderNumber}>Order #{activeOrder.orderNumber}</Text>
              </View>

              {['PENDING', 'CONFIRMED'].includes(activeOrder.status) && (
                <TouchableOpacity
                  onPress={() => handleCancelOrder(activeOrder._id)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
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
                <Ionicons name="navigate" size={16} color="#FF6000" style={{ marginRight: 6 }} />
                <Text style={styles.riderAlertText}>Delivery partner is on the move!</Text>
              </View>
            )}

            {/* Order Items Preview */}
            <View style={styles.activeOrderFooter}>
              <Text style={styles.itemsPreviewText} numberOfLines={1}>
                {activeOrder.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
              </Text>
              <Text style={styles.priceHighlight}>
                {formatPaise(activeOrder.pricing?.totalAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Past Orders Header */}
        <Text style={styles.sectionHeading}>PAST ORDERS</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>You haven't placed any orders yet.</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.orderNowButton}
            >
              <Text style={styles.orderNowText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => {
            const restName =
              typeof order.restaurantId === 'object' && order.restaurantId !== null
                ? order.restaurantId.name
                : 'Ftafat Restaurant';

            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <View key={order._id} style={styles.orderCard}>
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
                    {formatPaise(order.pricing?.totalAmount)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 12,
    fontSize: 13,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  refreshButton: {
    padding: 6,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  activeOrderNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCirclePassed: {
    backgroundColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#FF6000',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelPassed: {
    color: '#374151',
  },
  stepLabelCurrent: {
    color: '#FF6000',
    fontWeight: '900',
  },
  riderAlertBox: {
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  riderAlertText: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: '700',
    flex: 1,
  },
  activeOrderFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsPreviewText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  priceHighlight: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#374151',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  orderNowButton: {
    marginTop: 16,
    backgroundColor: '#FF6000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  orderNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  orderNumberSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C2410C',
    textTransform: 'uppercase',
  },
  statusDeliveredText: {
    color: '#15803D',
  },
  statusCancelledText: {
    color: '#B91C1C',
  },
  itemList: {
    marginVertical: 6,
  },
  itemText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    lineHeight: 18,
  },
  orderCardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
});
