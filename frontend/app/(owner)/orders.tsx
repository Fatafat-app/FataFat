import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerStore } from '../../store/owner.store';
import { formatPaise } from '../../utils/formatters';
import { Order, OrderStatus } from '../../types';
import { Typography, Colors } from '../../constants/Theme';

type FilterTab = 'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED';

export default function OwnerOrdersScreen() {
  const { restaurant, orders, isLoading, fetchOwnerData, updateOrderStatus } = useOwnerStore();
  const [selectedTab, setSelectedTab] = useState<FilterTab>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOwnerData();
    setRefreshing(false);
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus, actionTitle: string) => {
    Alert.alert('Update Order Status', `Are you sure you want to ${actionTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdatingId(orderId);
            await updateOrderStatus(orderId, nextStatus);
            Alert.alert('Success', `Order status updated to ${nextStatus}`);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update order status');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const handleCallCustomer = (phone?: string) => {
    if (!phone) {
      Alert.alert('Phone Not Available', 'Customer phone number was not provided for this order.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call on this device.');
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedTab === 'ALL') return true;
    if (selectedTab === 'PENDING') return o.status === 'PENDING';
    if (selectedTab === 'PREPARING') return ['CONFIRMED', 'PREPARING'].includes(o.status);
    if (selectedTab === 'READY') return o.status === 'READY_FOR_PICKUP';
    if (selectedTab === 'OUT_FOR_DELIVERY') return o.status === 'OUT_FOR_DELIVERY';
    if (selectedTab === 'COMPLETED') return ['DELIVERED', 'CANCELLED'].includes(o.status);
    return true;
  });

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading kitchen orders...</Text>
      </SafeAreaView>
    );
  }

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const prepCount = orders.filter((o) => ['CONFIRMED', 'PREPARING'].includes(o.status)).length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;
  const outCount = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Kitchen Order Manager</Text>
          <Text style={styles.pageSubtitle}>{restaurant?.name || 'Live Orders'}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TabButton label={`All (${orders.length})`} active={selectedTab === 'ALL'} onPress={() => setSelectedTab('ALL')} />
          <TabButton
            label={`Incoming (${pendingCount})`}
            active={selectedTab === 'PENDING'}
            onPress={() => setSelectedTab('PENDING')}
            badgeColor={pendingCount > 0 ? Colors.error : undefined}
          />
          <TabButton
            label={`In Kitchen (${prepCount})`}
            active={selectedTab === 'PREPARING'}
            onPress={() => setSelectedTab('PREPARING')}
            badgeColor={prepCount > 0 ? '#F59E0B' : undefined}
          />
          <TabButton
            label={`Ready (${readyCount})`}
            active={selectedTab === 'READY'}
            onPress={() => setSelectedTab('READY')}
            badgeColor={readyCount > 0 ? '#3B82F6' : undefined}
          />
          <TabButton
            label={`On Way (${outCount})`}
            active={selectedTab === 'OUT_FOR_DELIVERY'}
            onPress={() => setSelectedTab('OUT_FOR_DELIVERY')}
          />
          <TabButton label="Delivered / History" active={selectedTab === 'COMPLETED'} onPress={() => setSelectedTab('COMPLETED')} />
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Orders in this Section</Text>
            <Text style={styles.emptySubtitle}>Incoming customer orders will appear here in real-time.</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPreparing = ['CONFIRMED', 'PREPARING'].includes(order.status);
            const isReady = order.status === 'READY_FOR_PICKUP';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';
            const isProcessing = updatingId === order._id;

            const customerName = (order.user as any)?.name || (order as any).customerName || 'Customer';
            const customerPhone = (order.user as any)?.phone || '';
            const fullAddress = order.deliveryAddress
              ? `${order.deliveryAddress.line1 || ''}${order.deliveryAddress.line2 ? ', ' + order.deliveryAddress.line2 : ''}, ${order.deliveryAddress.city || ''} ${order.deliveryAddress.pincode ? '- ' + order.deliveryAddress.pincode : ''}`
              : 'Delivery Address Not Specified';

            const instructions = (order as any).specialInstructions || order.deliveryInstructions;
            const totalPrice = order.pricing?.totalAmount || (order as any).totalAmount || 0;
            const paymentMethod = (order as any).paymentMethod || ((order as any).payment?.method) || 'COD';

            return (
              <View
                key={order._id}
                style={[
                  styles.orderCard,
                  isPending && styles.orderCardPending,
                  isPreparing && styles.orderCardPrep,
                  isReady && styles.orderCardReady,
                ]}
              >
                {/* Header: Order ID & Status */}
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.orderNumberText}>Order #{order.orderNumber}</Text>
                    <Text style={styles.orderDateSub}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isPending && styles.statusBadgePending,
                      isPreparing && styles.statusBadgePrep,
                      isReady && styles.statusBadgeReady,
                      isOutForDelivery && styles.statusBadgeOut,
                      isDelivered && styles.statusBadgeDelivered,
                      isCancelled && styles.statusBadgeCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isPending && styles.statusTextPending,
                        isPreparing && styles.statusTextPrep,
                        isReady && styles.statusTextReady,
                        isOutForDelivery && styles.statusTextOut,
                        isDelivered && styles.statusTextDelivered,
                        isCancelled && styles.statusTextCancelled,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Customer Details Box */}
                <View style={styles.customerBox}>
                  <View style={styles.customerHeaderRow}>
                    <View style={styles.customerInfoLeft}>
                      <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
                      <Text style={styles.customerName}>{customerName}</Text>
                    </View>

                    {customerPhone ? (
                      <TouchableOpacity
                        onPress={() => handleCallCustomer(customerPhone)}
                        style={styles.callButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="call" size={13} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.callButtonText}>{customerPhone}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Delivery Address */}
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={15} color={Colors.textSecondary} style={{ marginTop: 2, marginRight: 5 }} />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {fullAddress}
                    </Text>
                  </View>
                </View>

                {/* Special Instructions Note */}
                {instructions ? (
                  <View style={styles.instructionsBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={styles.instructionsText}>Note: {instructions}</Text>
                  </View>
                ) : null}

                {/* Items Ordered */}
                <View style={styles.itemsListContainer}>
                  <Text style={styles.itemsSectionTitle}>ORDERED ITEMS ({order.items?.length || 0})</Text>
                  {order.items?.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.qtyBox}>
                        <Text style={styles.qtyText}>{it.quantity}×</Text>
                      </View>
                      <Text style={styles.itemNameText}>{it.name}</Text>
                      <Text style={styles.itemPriceText}>{formatPaise(it.totalItemPrice || (it.price * it.quantity))}</Text>
                    </View>
                  ))}
                </View>

                {/* Bill Breakdown & Payment */}
                <View style={styles.billDetailsRow}>
                  <View>
                    <Text style={styles.paymentModeLabel}>Payment Mode</Text>
                    <View style={styles.paymentBadge}>
                      <Ionicons
                        name={paymentMethod === 'ONLINE' ? 'card-outline' : 'cash-outline'}
                        size={14}
                        color={paymentMethod === 'ONLINE' ? '#2563EB' : '#16A34A'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.paymentBadgeText, { color: paymentMethod === 'ONLINE' ? '#2563EB' : '#16A34A' }]}>
                        {paymentMethod === 'ONLINE' ? 'Online Paid' : 'Cash on Delivery (COD)'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalAmountText}>{formatPaise(totalPrice)}</Text>
                  </View>
                </View>

                {/* Action Buttons for Kitchen Workflow */}
                <View style={styles.cardFooter}>
                  {isProcessing ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />
                  ) : isPending ? (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'CANCELLED', 'reject this order')}
                        style={styles.rejectBtn}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={Colors.error} style={{ marginRight: 4 }} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'PREPARING', 'accept and start cooking')}
                        style={styles.acceptBtn}
                      >
                        <Ionicons name="checkmark-circle" size={16} color={Colors.white} style={{ marginRight: 4 }} />
                        <Text style={styles.acceptBtnText}>Accept & Prep</Text>
                      </TouchableOpacity>
                    </View>
                  ) : isPreparing ? (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'READY_FOR_PICKUP', 'mark food as ready for pickup')}
                        style={styles.readyBtn}
                      >
                        <Ionicons name="flame" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                        <Text style={styles.readyBtnText}>Food Ready for Pickup</Text>
                      </TouchableOpacity>
                    </View>
                  ) : isReady ? (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'OUT_FOR_DELIVERY', 'dispatch this order with delivery partner')}
                        style={styles.dispatchBtn}
                      >
                        <Ionicons name="bicycle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                        <Text style={styles.dispatchBtnText}>Dispatch / Out for Delivery</Text>
                      </TouchableOpacity>
                    </View>
                  ) : isOutForDelivery ? (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'DELIVERED', 'mark this order as delivered')}
                        style={styles.deliverBtn}
                      >
                        <Ionicons name="checkmark-done" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                        <Text style={styles.deliverBtnText}>Mark as Delivered</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.completedBadge}>
                      <Ionicons
                        name={isDelivered ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={isDelivered ? Colors.success : Colors.error}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.completedTimestamp, isDelivered ? { color: Colors.success } : { color: Colors.error }]}>
                        {isDelivered ? 'Order Completed' : 'Order Cancelled'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
  badgeColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  badgeColor?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabBtn,
        active && styles.tabBtnActive,
        badgeColor && !active ? { borderColor: badgeColor, borderWidth: 1.5 } : undefined,
      ]}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  navbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: { ...Typography.heading, fontSize: 19 },
  pageSubtitle: { ...Typography.bodySmall, fontSize: 12, color: Colors.primary, marginTop: 1 },
  refreshBtn: { backgroundColor: Colors.background, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  tabContainer: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10 },
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnText: { ...Typography.button, fontSize: 12, color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.white, fontWeight: '700' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  emptySubtitle: { ...Typography.caption, textAlign: 'center', marginTop: 4 },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardPending: { borderColor: '#FCA5A5', backgroundColor: '#FFFDFD' },
  orderCardPrep: { borderColor: '#FCD34D' },
  orderCardReady: { borderColor: '#93C5FD' },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
    paddingBottom: 10,
  },
  orderNumberText: { ...Typography.title, fontSize: 17 },
  orderDateSub: { ...Typography.caption, fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: Colors.background },
  statusBadgePending: { backgroundColor: '#FEE2E2' },
  statusBadgePrep: { backgroundColor: '#FEF3C7' },
  statusBadgeReady: { backgroundColor: '#DBEAFE' },
  statusBadgeOut: { backgroundColor: '#E0E7FF' },
  statusBadgeDelivered: { backgroundColor: '#DCFCE7' },
  statusBadgeCancelled: { backgroundColor: Colors.background },
  statusBadgeText: { ...Typography.label, fontSize: 10, fontWeight: '700' },
  statusTextPending: { color: Colors.error },
  statusTextPrep: { color: '#D97706' },
  statusTextReady: { color: '#2563EB' },
  statusTextOut: { color: '#4F46E5' },
  statusTextDelivered: { color: Colors.success },
  statusTextCancelled: { color: Colors.textSecondary },

  customerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerName: { ...Typography.title, fontSize: 14, color: '#1E293B' },
  callButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  callButtonText: { ...Typography.button, color: '#FFF', fontSize: 11 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 },
  addressText: { ...Typography.bodySmall, fontSize: 12, color: '#475569', flex: 1 },

  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 9,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionsText: { ...Typography.caption, color: '#92400E', flex: 1, fontSize: 12 },

  itemsListContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemsSectionTitle: { ...Typography.label, fontSize: 10, color: Colors.textSecondary, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  qtyBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  qtyText: { ...Typography.button, fontSize: 11, color: Colors.primary },
  itemNameText: { ...Typography.bodySmall, flex: 1, fontSize: 13, fontWeight: '500' },
  itemPriceText: { ...Typography.subtitle, fontSize: 12 },

  billDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    marginBottom: 6,
  },
  paymentModeLabel: { ...Typography.caption, fontSize: 10 },
  paymentBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  paymentBadgeText: { ...Typography.button, fontSize: 11 },
  totalLabel: { ...Typography.caption, fontSize: 10 },
  totalAmountText: { ...Typography.heading, fontSize: 16, color: Colors.text },

  cardFooter: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButtonsRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { ...Typography.button, fontSize: 13, color: Colors.error },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptBtnText: { ...Typography.button, fontSize: 13, color: Colors.white },
  readyBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  readyBtnText: { ...Typography.heading, fontSize: 14, color: Colors.white },
  dispatchBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  dispatchBtnText: { ...Typography.heading, fontSize: 13, color: Colors.white },
  deliverBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  deliverBtnText: { ...Typography.heading, fontSize: 13, color: Colors.white },
  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  completedTimestamp: { ...Typography.button, fontSize: 12 },
});
