import React, { useState, useEffect } from 'react';
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
import { useOwnerStore } from '../../store/owner.store';
import { formatPaise } from '../../utils/formatters';
import { Order, OrderStatus } from '../../types';

type FilterTab = 'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';

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
    Alert.alert('Update Order', `Are you sure you want to ${actionTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdatingId(orderId);
            await updateOrderStatus(orderId, nextStatus);
            Alert.alert('Status Updated', `Order transitioned to ${nextStatus}`);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update order status');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedTab === 'ALL') return true;
    if (selectedTab === 'PENDING') return o.status === 'PENDING';
    if (selectedTab === 'PREPARING') return ['CONFIRMED', 'PREPARING'].includes(o.status);
    if (selectedTab === 'READY') return o.status === 'READY_FOR_PICKUP';
    if (selectedTab === 'COMPLETED') return ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(o.status);
    return true;
  });

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6000" />
        <Text style={styles.loadingText}>Loading kitchen orders...</Text>
      </SafeAreaView>
    );
  }

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const prepCount = orders.filter((o) => ['CONFIRMED', 'PREPARING'].includes(o.status)).length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Kitchen Display System</Text>
          <Text style={styles.pageSubtitle}>{restaurant?.name || 'Live Orders'}</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Pipeline Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TabButton
            label={`All (${orders.length})`}
            active={selectedTab === 'ALL'}
            onPress={() => setSelectedTab('ALL')}
          />
          <TabButton
            label={`Incoming (${pendingCount})`}
            active={selectedTab === 'PENDING'}
            onPress={() => setSelectedTab('PENDING')}
            badgeColor={pendingCount > 0 ? '#EF4444' : undefined}
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
          />
          <TabButton
            label="History"
            active={selectedTab === 'COMPLETED'}
            onPress={() => setSelectedTab('COMPLETED')}
          />
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6000']} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Orders in this Section</Text>
            <Text style={styles.emptySubtitle}>
              Incoming customer orders will appear here in real-time.
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPreparing = ['CONFIRMED', 'PREPARING'].includes(order.status);
            const isReady = order.status === 'READY_FOR_PICKUP';
            const isDispatched = order.status === 'OUT_FOR_DELIVERY';
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';

            const isProcessing = updatingId === order._id;

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
                {/* Header with Order Number & Time */}
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.orderNumberText}>Order #{order.orderNumber}</Text>
                    <Text style={styles.customerNameText}>
                      Customer: {order.deliveryAddress?.street?.slice(0, 24) || 'Customer'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isPending && styles.statusBadgePending,
                      isPreparing && styles.statusBadgePrep,
                      isReady && styles.statusBadgeReady,
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
                        isDelivered && styles.statusTextDelivered,
                        isCancelled && styles.statusTextCancelled,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Items Breakdown */}
                <View style={styles.itemsListContainer}>
                  {order.items?.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.qtyBox}>
                        <Text style={styles.qtyText}>{it.quantity}×</Text>
                      </View>
                      <Text style={styles.itemNameText}>{it.name}</Text>
                      <Text style={styles.itemPriceText}>{formatPaise(it.totalItemPrice)}</Text>
                    </View>
                  ))}
                </View>

                {/* Delivery Instructions note */}
                {order.deliveryInstructions ? (
                  <View style={styles.instructionsBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={styles.instructionsText}>
                      Note: {order.deliveryInstructions}
                    </Text>
                  </View>
                ) : null}

                {/* Footer with Total and Action Buttons */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Bill</Text>
                    <Text style={styles.totalAmountText}>
                      {formatPaise(order.pricing?.totalAmount)}
                    </Text>
                  </View>

                  {/* Dynamic Action Buttons based on order pipeline */}
                  {isProcessing ? (
                    <ActivityIndicator color="#FF6000" />
                  ) : isPending ? (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'CANCELLED', 'reject this order')}
                        style={styles.rejectBtn}
                      >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleStatusChange(order._id, 'PREPARING', 'accept and start preparing')}
                        style={styles.acceptBtn}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.acceptBtnText}>Accept & Prep</Text>
                      </TouchableOpacity>
                    </View>
                  ) : isPreparing ? (
                    <TouchableOpacity
                      onPress={() => handleStatusChange(order._id, 'READY_FOR_PICKUP', 'mark food as ready for pickup')}
                      style={styles.readyBtn}
                    >
                      <Ionicons name="flame" size={16} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.readyBtnText}>Mark Food Ready</Text>
                    </TouchableOpacity>
                  ) : isReady ? (
                    <View style={styles.waitingRiderBadge}>
                      <Ionicons name="bicycle" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                      <Text style={styles.waitingRiderText}>Waiting for Delivery Partner</Text>
                    </View>
                  ) : (
                    <Text style={styles.completedTimestamp}>
                      {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
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
        badgeColor && !active ? { borderColor: badgeColor } : undefined,
      ]}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
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
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 12,
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  refreshBtn: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 10,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtnActive: {
    backgroundColor: '#FF6000',
    borderColor: '#FF6000',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardPending: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFDFD',
  },
  orderCardPrep: {
    borderColor: '#FCD34D',
  },
  orderCardReady: {
    borderColor: '#93C5FD',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  customerNameText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statusBadgePending: { backgroundColor: '#FEE2E2' },
  statusBadgePrep: { backgroundColor: '#FEF3C7' },
  statusBadgeReady: { backgroundColor: '#DBEAFE' },
  statusBadgeDelivered: { backgroundColor: '#DCFCE7' },
  statusBadgeCancelled: { backgroundColor: '#F3F4F6' },

  statusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  statusTextPending: { color: '#DC2626' },
  statusTextPrep: { color: '#D97706' },
  statusTextReady: { color: '#2563EB' },
  statusTextDelivered: { color: '#16A34A' },
  statusTextCancelled: { color: '#6B7280' },

  itemsListContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  qtyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF6000',
  },
  itemNameText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  totalAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  acceptBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readyBtn: {
    backgroundColor: '#FF6000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  readyBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  waitingRiderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  waitingRiderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  completedTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
