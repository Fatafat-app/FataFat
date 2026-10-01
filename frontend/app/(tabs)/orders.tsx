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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { orderService } from '../../services/order.service';
import { socketService } from '../../services/socket.service';
import { useOrderTrackingStore } from '../../store/orderTracking.store';
import { useAuthStore } from '../../store/auth.store';
import { Order } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_STEPS = [
  { status: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle' as const },
  { status: 'PREPARING', label: 'Preparing', icon: 'flame' as const },
  { status: 'PICKED_UP', label: 'On The Way', icon: 'bicycle' as const },
  { status: 'DELIVERED', label: 'Delivered', icon: 'home' as const },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeOrder = useOrderTrackingStore((state) => state.activeOrder);
  const riderLocation = useOrderTrackingStore((state) => state.riderLocation);
  const setActiveOrder = useOrderTrackingStore((state) => state.setActiveOrder);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setActiveOrder(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await orderService.getOrders({ page: 1, limit: 30 });
      const orderList = data.items || [];
      setOrders(orderList);

      const ongoing = orderList.find((o) => {
        const s = (o.status || (o as any).orderStatus || '').toString().toUpperCase();
        return [
          'PAYMENT_PENDING',
          'PLACED',
          'ACCEPTED',
          'PENDING',
          'CONFIRMED',
          'PREPARING',
          'READY',
          'READY_FOR_PICKUP',
          'PICKED_UP',
          'OUT_FOR_DELIVERY',
        ].includes(s);
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
  }, [isAuthenticated, setActiveOrder]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStepIndex = (rawStatus: string) => {
    const status = (rawStatus || '').toUpperCase();
    switch (status) {
      case 'PAYMENT_PENDING':
      case 'PLACED':
      case 'PENDING':
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 0;
      case 'PREPARING':
      case 'READY':
      case 'READY_FOR_PICKUP':
        return 1;
      case 'PICKED_UP':
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

  const currentStatusStr = (activeOrder?.status || (activeOrder as any)?.orderStatus || '').toString().toUpperCase();
  const currentStep = activeOrder ? getStepIndex(currentStatusStr) : 0;

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
        {activeOrder && !['DELIVERED', 'CANCELLED', 'REFUNDED', 'REJECTED', 'EXPIRED'].includes(currentStatusStr) && (
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
                {formatPaise(activeOrder.pricing?.totalAmount || (activeOrder as any).totalAmount || (activeOrder as any).pricing?.totalPaise || 0)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Past Orders Header */}
        <Text style={styles.sectionHeading}>PAST ORDERS</Text>

        {!isAuthenticated ? (
          <EmptyState 
            icon="log-in-outline" 
            title="Login Required" 
            message="Please login to view and track your orders." 
            actionText="Login Now"
            onAction={() => router.push('/(auth)/login')}
          />
        ) : orders.length === 0 ? (
          <EmptyState 
            icon="receipt-outline" 
            title="No Orders Found" 
            message="You haven't placed any orders yet." 
            actionText="Order Now"
            onAction={() => router.replace('/(tabs)')}
          />
        ) : (
          orders.map((order) => {
            const isGroceryOrder = (order as any).vertical === 'grocery' || (order as any).orderType === 'grocery';
            const restName = isGroceryOrder
              ? 'Ftafat Fresh Grocery Mart'
              : ((order as any).restaurant?.name || (order as any).vendor?.name || 'Partner Restaurant');
            const restImage = isGroceryOrder
              ? 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300'
              : ((order as any).restaurant?.coverImage || (order as any).vendor?.images?.banner || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg');

            const orderStatusUpper = (order.status || (order as any).orderStatus || '').toString().toUpperCase();
            const isDelivered = orderStatusUpper === 'DELIVERED';
            const isCancelled = ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(orderStatusUpper);
            const totalPrice = order.pricing?.totalAmount || (order as any).totalAmount || (order as any).pricing?.totalPaise || 0;

            return (
              <TouchableOpacity 
                key={order._id} 
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order._id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.orderCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <Image source={{ uri: restImage }} style={styles.restLogo} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restaurantName} numberOfLines={1}>{restName}</Text>
                      <Text style={styles.orderNumberSub}>Order #{order.orderNumber}</Text>
                    </View>
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
                      {orderStatusUpper}
                    </Text>
                  </View>
                </View>

                {/* Items Summary with Images */}
                <View style={styles.itemList}>
                  {order.items?.map((it, idx) => {
                    const imageUrl = (it as any).menuItem?.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg';
                    const isVeg = (it as any).menuItem?.isVeg;
                    
                    return (
                      <View key={idx} style={styles.itemRow}>
                        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                        <View style={styles.itemTextContainer}>
                          <View style={styles.itemNameRow}>
                            {isVeg !== undefined && (
                              <View style={[styles.vegSquare, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                                <View style={[styles.vegDot, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
                              </View>
                            )}
                            <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                          </View>
                          <Text style={styles.itemQuantity}>Qty: {it.quantity}</Text>
                        </View>
                        <Text style={styles.itemPrice}>
                          {formatPaise(it.totalItemPrice || (it.price * it.quantity))}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Footer with Price and Details */}
                <View style={styles.orderCardFooter}>
                  <View>
                    <Text style={styles.orderTotal}>
                      {formatPaise(totalPrice)}
                    </Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    {isDelivered && (
                      <TouchableOpacity style={styles.rateBtn} onPress={() => Alert.alert('Rate Order', 'Rate this delivery (Feature coming soon)')}>
                        <Ionicons name="star" size={14} color="#EA580C" />
                        <Text style={styles.rateText}>Rate</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => {
                        if (isGroceryOrder) {
                          router.push('/(tabs)');
                        } else {
                          const rId = (order as any).vendor?._id || (order as any).restaurant?._id || order.restaurantId;
                          if (rId) router.push(`/restaurant/${rId}`);
                        }
                      }}
                    >
                      <Ionicons name="refresh" size={14} color={Colors.white} />
                      <Text style={styles.reorderText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
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
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 130 },
  activeCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 2, borderColor: '#FED7AA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  activeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 6 },
  liveBadgeText: { ...Typography.label, color: Colors.success, letterSpacing: 0.5 },
  activeOrderNumber: { ...Typography.title, fontSize: 16, marginTop: 2 },
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
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  restLogo: { width: 36, height: 36, borderRadius: 8, marginRight: 10, backgroundColor: '#F3F4F6' },
  restaurantName: { ...Typography.title, fontSize: 16 },
  orderNumberSub: { ...Typography.caption, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: Colors.primaryLight, alignSelf: 'flex-start' },
  statusDelivered: { backgroundColor: '#DCFCE7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusPillText: { ...Typography.button, fontSize: 10, color: '#C2410C' },
  statusDeliveredText: { color: Colors.success },
  statusCancelledText: { color: Colors.error },
  itemList: { marginVertical: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemImage: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.border },
  itemTextContainer: { flex: 1, marginLeft: 12, marginRight: 8 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  vegSquare: { width: 12, height: 12, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { ...Typography.subtitle, fontSize: 14, flex: 1 },
  itemQuantity: { ...Typography.caption, color: Colors.textSecondary },
  itemPrice: { ...Typography.title, fontSize: 14, color: Colors.text },
  orderCardFooter: { marginTop: 4, paddingTop: 14, borderTopWidth: 1, borderTopStyle: 'dashed', borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, fontSize: 11 },
  orderTotal: { ...Typography.heading, fontSize: 16 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  rateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEDD5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  rateText: { ...Typography.button, color: '#EA580C', fontSize: 12, marginLeft: 4 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  reorderText: { ...Typography.button, color: Colors.white, fontSize: 12, marginLeft: 4 },
});
