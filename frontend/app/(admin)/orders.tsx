import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminService } from '../../services/admin.service';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_LIST = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
const VERTICAL_LIST = ['ALL', 'FOOD', 'GROCERY'];

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedVertical, setSelectedVertical] = useState('ALL');
  const [statusModalOrder, setStatusModalOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedVertical !== 'ALL') params.vertical = selectedVertical.toLowerCase();
      if (search.trim()) params.search = search.trim();

      const res = await adminService.listOrders(params);
      setOrders(res.items || []);
    } catch (err: any) {
      console.warn('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, selectedVertical, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!statusModalOrder) return;
    try {
      setUpdating(true);
      await adminService.updateOrderStatus(statusModalOrder._id, { status: newStatus });
      Alert.alert('Status Updated', `Order #${statusModalOrder.orderNumber} updated to ${newStatus}`);
      setStatusModalOrder(null);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (rawStatus: string) => {
    const s = (rawStatus || '').toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return '#16A34A';
      case 'CANCELLED':
      case 'REJECTED':
      case 'EXPIRED':
        return '#DC2626';
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return '#2563EB';
      case 'PREPARING':
      case 'READY':
        return '#EA580C';
      default:
        return '#D97706';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Live Orders & Ops</Text>
            <Text style={styles.headerSubtitle}>Monitor & control all food and grocery orders</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#6B7280" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by Order # or Address..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={fetchOrders}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Vertical Filter Pills */}
      <View style={styles.verticalFilterRow}>
        {VERTICAL_LIST.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setSelectedVertical(v)}
            style={[styles.verticalPill, selectedVertical === v && styles.verticalPillActive]}
          >
            <Text style={[styles.verticalPillText, selectedVertical === v && styles.verticalPillTextActive]}>
              {v === 'FOOD' ? '🍔 Food' : v === 'GROCERY' ? '🥦 Grocery' : 'All Verticals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Filter Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilterScroll}
      >
        {STATUS_LIST.map((st) => (
          <TouchableOpacity
            key={st}
            onPress={() => setSelectedStatus(st)}
            style={[styles.statusPill, selectedStatus === st && styles.statusPillActive]}
          >
            <Text style={[styles.statusPillText, selectedStatus === st && styles.statusPillTextActive]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Orders Found"
            message="No active or past orders match your filters."
          />
        ) : (
          orders.map((order) => {
            const isGrocery = (order.vertical || order.orderType) === 'grocery';
            const statusUpper = (order.orderStatus || order.status || 'PLACED').toString().toUpperCase();
            const statusColor = getStatusColor(statusUpper);
            const totalPaise = order.pricing?.totalPaise || order.pricing?.totalAmount || order.totalAmount || 0;
            const customerName = order.user?.name || order.customerId?.name || 'Customer';
            const customerPhone = order.user?.phone || order.customerId?.phone || '';
            const storeName = isGrocery
              ? 'Ftafat Fresh Grocery Mart'
              : (order.restaurant?.name || order.vendorId?.name || 'Partner Restaurant');

            return (
              <View key={order._id} style={styles.orderCard}>
                {/* Top Row: Vertical Badge + Status Pill */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.verticalTag}>
                    <Ionicons
                      name={isGrocery ? 'basket' : 'restaurant'}
                      size={14}
                      color={isGrocery ? '#16A34A' : '#EA580C'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.verticalTagText, { color: isGrocery ? '#16A34A' : '#EA580C' }]}>
                      {isGrocery ? 'GROCERY' : 'FOOD'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setStatusModalOrder(order)}
                    style={[styles.orderStatusBadge, { backgroundColor: `${statusColor}15`, borderColor: statusColor }]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.orderStatusBadgeText, { color: statusColor }]}>{statusUpper}</Text>
                    <Ionicons name="chevron-down" size={12} color={statusColor} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>

                {/* Order Number & Store */}
                <View style={styles.cardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumberText}>Order #{order.orderNumber}</Text>
                    <Text style={styles.storeNameText} numberOfLines={1}>{storeName}</Text>
                  </View>
                  <Text style={styles.totalPriceText}>{formatPaise(totalPaise)}</Text>
                </View>

                {/* Customer Details */}
                <View style={styles.customerBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.customerName}>{customerName} {customerPhone ? `(${customerPhone})` : ''}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="location" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {order.deliveryAddress?.line1}, {order.deliveryAddress?.city}
                    </Text>
                  </View>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsBox}>
                  <Text style={styles.itemsLabel}>ITEMS ({order.items?.length || 0}):</Text>
                  <Text style={styles.itemsSummary} numberOfLines={2}>
                    {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                  </Text>
                </View>

                {/* Actions Row */}
                <View style={styles.cardFooter}>
                  <Text style={styles.dateLabel}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <TouchableOpacity
                    style={styles.changeStatusBtn}
                    onPress={() => setStatusModalOrder(order)}
                  >
                    <Text style={styles.changeStatusBtnText}>Manage Status</Text>
                    <Ionicons name="create-outline" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Status Override Modal */}
      <Modal
        visible={!!statusModalOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setStatusModalOrder(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Order #{statusModalOrder?.orderNumber} ({statusModalOrder?.vertical?.toUpperCase()})
            </Text>

            <ScrollView style={{ maxHeight: 350, marginVertical: 12 }}>
              {['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusOption,
                    (statusModalOrder?.orderStatus || '').toUpperCase() === st && styles.statusOptionActive,
                  ]}
                  onPress={() => handleUpdateStatus(st)}
                  disabled={updating}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      (statusModalOrder?.orderStatus || '').toUpperCase() === st && styles.statusOptionTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                  {(statusModalOrder?.orderStatus || '').toUpperCase() === st && (
                    <Ionicons name="checkmark" size={18} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {updating && <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 8 }} />}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: { ...Typography.heading, fontSize: 18, color: '#0F172A' },
  headerSubtitle: { ...Typography.caption, color: '#64748B', fontSize: 11 },
  refreshBtn: { padding: 6, backgroundColor: '#EEF2FF', borderRadius: 8 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, ...Typography.body, fontSize: 13, color: '#0F172A' },

  verticalFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  verticalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  verticalPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  verticalPillText: { ...Typography.button, fontSize: 12, color: '#475569' },
  verticalPillTextActive: { color: '#FFFFFF' },

  statusFilterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  statusPillText: { ...Typography.caption, fontSize: 11, color: '#64748B' },
  statusPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { ...Typography.bodySmall, color: '#64748B', marginTop: 10 },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verticalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verticalTagText: { ...Typography.label, fontSize: 10 },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  orderStatusBadgeText: { ...Typography.button, fontSize: 10 },

  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumberText: { ...Typography.title, fontSize: 15, color: '#0F172A' },
  storeNameText: { ...Typography.caption, color: '#64748B', marginTop: 2, fontSize: 12 },
  totalPriceText: { ...Typography.heading, fontSize: 16, color: '#0F172A' },

  customerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  customerName: { ...Typography.subtitle, fontSize: 12, color: '#334155' },
  addressText: { ...Typography.caption, color: '#64748B', fontSize: 11, flex: 1 },

  itemsBox: { marginBottom: 12 },
  itemsLabel: { ...Typography.label, fontSize: 10, color: '#94A3B8', marginBottom: 2 },
  itemsSummary: { ...Typography.bodySmall, color: '#475569', fontSize: 12 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateLabel: { ...Typography.caption, color: '#94A3B8', fontSize: 11 },
  changeStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeStatusBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 11 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { ...Typography.heading, fontSize: 18, color: '#0F172A' },
  modalSubtitle: { ...Typography.caption, color: '#64748B', marginTop: 4 },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  statusOptionActive: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  statusOptionText: { ...Typography.subtitle, fontSize: 14, color: '#334155' },
  statusOptionTextActive: { color: '#4F46E5', fontWeight: '700' },
});
