import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Image,
  Animated,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { orderService } from '../../services/order.service';
import { useAuthStore } from '../../store/auth.store';
import { Order, OrderItem, Restaurant } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';

// Human readable status labels
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Being Prepared',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  REFUNDED: 'Refunded',
};

const formatOrderNumber = (num?: string, id?: string) => {
  const target = num || id || '';
  if (/^[a-f\d]{24}$/i.test(target)) {
    return target.slice(-6).toUpperCase();
  }
  return target;
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // orderId -> star rating (1-5) once submitted
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Rating modal state
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Item detail modal state
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, DELIVERED, CANCELLED

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await orderService.getOrders({ page: 1, limit: 30 });
      setOrders(data.items || []);
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return '#059669';
    if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return '#DC2626';
    if (['PREPARING', 'CONFIRMED'].includes(s)) return '#D97706';
    if (s === 'OUT_FOR_DELIVERY') return '#2563EB';
    return Colors.primary;
  };

  const getStatusBgColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return '#D1FAE5';
    if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return '#FEE2E2';
    if (['PREPARING', 'CONFIRMED'].includes(s)) return '#FEF3C7';
    if (s === 'OUT_FOR_DELIVERY') return '#DBEAFE';
    return Colors.primaryLight;
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0) {
      Alert.alert('Select Rating', 'Please tap on the stars to rate your order.');
      return;
    }
    setRatingSubmitting(true);
    // Simulate API call - replace with actual rating API
    setTimeout(() => {
      // Save rating locally so it shows on the card
      if (ratingOrder) {
        setRatings(prev => ({ ...prev, [ratingOrder._id]: ratingValue }));
      }
      setRatingSubmitting(false);
      setRatingOrder(null);
      setRatingValue(0);
      Alert.alert('Thank You! ⭐', 'Your rating has been submitted successfully.');
    }, 800);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // First apply Search and Filter on ALL orders
  let filteredOrders = orders;

  if (selectedFilter !== 'ALL') {
    filteredOrders = filteredOrders.filter(o => {
      const s = (o.status || '').toUpperCase();
      if (selectedFilter === 'DELIVERED' && s === 'DELIVERED') return true;
      if (selectedFilter === 'CANCELLED' && ['CANCELLED', 'REJECTED', 'FAILED', 'REFUNDED'].includes(s)) return true;
      return false;
    });
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(o => {
      const r = o.restaurantId as unknown as Restaurant;
      const restName = (r?.name || 'Partner Restaurant').toLowerCase();
      const itemsMatch = o.items?.some(i => (i.name || '').toLowerCase().includes(q));
      return restName.includes(q) || itemsMatch;
    });
  }

  // Then split into active and past
  const ongoingOrder = filteredOrders.find(o =>
    !['DELIVERED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes((o.status || '').toUpperCase())
  );
  let pastOrders = filteredOrders.filter(o => o !== ongoingOrder);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
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
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search orders, restaurants..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['ALL', 'DELIVERED', 'CANCELLED'].map(filter => (
              <TouchableOpacity 
                key={filter} 
                style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                  {filter.charAt(0) + filter.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!isAuthenticated ? (
          <EmptyState icon="log-in-outline" title="Login Required" message="Please login to view your orders." actionText="Login Now" onAction={() => router.push('/(auth)/login')} />
        ) : orders.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No Orders Yet" message="Looks like you haven't placed any orders yet." actionText="Start Exploring" onAction={() => router.replace('/(tabs)')} />
        ) : (
          <View>
            {/* ── ACTIVE ORDER ── */}
            {ongoingOrder && (
              <View style={styles.activeSection}>
                <Text style={styles.sectionHeading}>ACTIVE ORDER</Text>
                <TouchableOpacity style={styles.activeCard} activeOpacity={0.9} onPress={() => router.push(`/order/${ongoingOrder._id}`)}>
                  <LinearGradient colors={[Colors.primary, '#0B7A75']} style={styles.activeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.activeTop}>
                      <View>
                        <Text style={styles.activeStatusText}>
                          {STATUS_LABEL[(ongoingOrder.status || '').toUpperCase()] || (ongoingOrder.status || 'Processing').replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <View style={styles.liveIndicator}>
                        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                        <Text style={styles.liveText}>TRACK</Text>
                      </View>
                    </View>
                    <View style={styles.activeDivider} />
                    <Text style={styles.activeItems} numberOfLines={1}>
                      {ongoingOrder.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* ── PAST ORDERS ── */}
            {pastOrders.length > 0 && (
              <View style={styles.pastSection}>
                <Text style={styles.sectionHeading}>PAST ORDERS</Text>
                {pastOrders.map((order) => {
                  const restaurant = order.restaurantId as unknown as Restaurant;
                  const restName = restaurant?.name || 'Partner Restaurant';
                  const restImage = restaurant?.images?.[0] || (restaurant as any)?.coverImage || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg';
                  const status = (order.status || 'UNKNOWN').toUpperCase();
                  const isDelivered = status === 'DELIVERED';
                  const total = order.pricing?.totalAmount || 0;
                  const totalItemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                  return (
                    <TouchableOpacity
                      key={order._id}
                      style={styles.orderCard}
                      onPress={() => router.push(`/order/${order._id}`)}
                      activeOpacity={0.8}
                    >
                      {/* Header: Restaurant + Status */}
                      <View style={styles.cardHeader}>
                        <Image source={{ uri: restImage }} style={styles.restAvatar} />
                        <View style={styles.cardHeaderInfo}>
                          <Text style={styles.restName} numberOfLines={1}>{restName}</Text>
                          <Text style={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(status) }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                            {STATUS_LABEL[status] || status}
                          </Text>
                        </View>
                      </View>

                      {/* Items List – clickable */}
                      <View style={styles.cardBody}>
                        <View style={styles.itemsCountRow}>
                          <Ionicons name="receipt-outline" size={13} color="#6B7280" />
                          <Text style={styles.itemsCountText}>{totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}</Text>
                        </View>
                        {order.items?.map((it, i) => {
                          const itemImage = (it as any).menuItem?.images?.[0] || null;
                          return (
                            <TouchableOpacity
                              key={i}
                              style={styles.itemRow}
                              onPress={(e) => { e.stopPropagation(); setSelectedItem(it); }}
                              activeOpacity={0.7}
                            >
                              {itemImage && <Image source={{ uri: itemImage }} style={styles.itemThumb} />}
                              <View style={{ flex: 1 }}>
                                <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                                <Text style={styles.itemQtyPrice}>Qty {it.quantity}  ·  {formatPaise(it.totalItemPrice || it.price * it.quantity)}</Text>
                              </View>
                              <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Footer: Total + Actions */}
                      <View style={styles.cardFooter}>
                        <View>
                          <Text style={styles.totalPrice}>{formatPaise(total)}</Text>
                        </View>
                        <View style={styles.actionRow}>
                          {isDelivered && (
                            ratings[order._id] ? (
                              // Show read-only stars after rating
                              <View style={styles.ratedRow}>
                                {[1,2,3,4,5].map(s => (
                                  <Ionicons
                                    key={s}
                                    name={s <= ratings[order._id] ? 'star' : 'star-outline'}
                                    size={16}
                                    color={s <= ratings[order._id] ? '#FBBF24' : '#D1D5DB'}
                                  />
                                ))}
                                <Text style={styles.ratedText}>Rated</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.rateBtn}
                                onPress={(e) => { e.stopPropagation(); setRatingOrder(order); setRatingValue(0); }}
                              >
                                <Ionicons name="star" size={13} color="#FFFFFF" />
                                <Text style={styles.rateBtnText}>Rate</Text>
                              </TouchableOpacity>
                            )
                          )}
                          <TouchableOpacity
                            style={styles.reorderBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (restaurant?._id) router.push(`/restaurant/${restaurant._id}`);
                            }}
                          >
                            <Ionicons name="repeat-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.reorderText}>Reorder</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── RATING MODAL ── */}
      <Modal visible={!!ratingOrder} transparent animationType="slide" onRequestClose={() => setRatingOrder(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRatingOrder(null)}>
          <TouchableOpacity style={styles.ratingSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.ratingTitle}>Rate Your Order</Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)} style={styles.starBtn}>
                  <Ionicons
                    name={star <= ratingValue ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= ratingValue ? '#FBBF24' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingHint}>
              {ratingValue === 0 ? 'Tap a star to rate' :
               ratingValue === 1 ? '😞 Terrible' :
               ratingValue === 2 ? '😕 Bad' :
               ratingValue === 3 ? '😐 Okay' :
               ratingValue === 4 ? '😊 Good' : '🤩 Excellent!'}
            </Text>

            <TouchableOpacity
              style={[styles.submitRatingBtn, ratingValue === 0 && { opacity: 0.5 }]}
              onPress={handleSubmitRating}
              disabled={ratingSubmitting}
            >
              {ratingSubmitting
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.submitRatingText}>Submit Rating</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setRatingOrder(null)} style={{ marginTop: 12 }}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── ITEM DETAIL MODAL ── */}
      <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
          <TouchableOpacity style={styles.itemDetailSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {selectedItem && (
              <>
                {(selectedItem as any).menuItem?.images?.[0] && (
                  <Image source={{ uri: (selectedItem as any).menuItem.images[0] }} style={styles.itemDetailImage} />
                )}
                <View style={styles.itemDetailBody}>
                  <Text style={styles.itemDetailName}>{selectedItem.name}</Text>
                  {(selectedItem as any).menuItem?.description && (
                    <Text style={styles.itemDetailDesc}>{(selectedItem as any).menuItem.description}</Text>
                  )}
                  <View style={styles.itemDetailRow}>
                    <View style={styles.itemDetailChip}>
                      <Ionicons name="cube-outline" size={13} color={Colors.primary} />
                      <Text style={styles.itemDetailChipText}>Qty: {selectedItem.quantity}</Text>
                    </View>
                    <View style={styles.itemDetailChip}>
                      <Ionicons name="pricetag-outline" size={13} color={Colors.primary} />
                      <Text style={styles.itemDetailChipText}>{formatPaise(selectedItem.price)} / unit</Text>
                    </View>
                  </View>
                  <View style={styles.itemDetailTotalRow}>
                    <Text style={styles.itemDetailTotalLabel}>Item Total</Text>
                    <Text style={styles.itemDetailTotalPrice}>
                      {formatPaise(selectedItem.totalItemPrice || selectedItem.price * selectedItem.quantity)}
                    </Text>
                  </View>
                  {selectedItem.selectedModifiers && selectedItem.selectedModifiers.length > 0 && (
                    <View style={styles.modifierBox}>
                      <Text style={styles.modifierLabel}>Add-ons</Text>
                      {selectedItem.selectedModifiers.map((m, i) => (
                        <Text key={i} style={styles.modifierItem}>+ {m.name}  {m.price > 0 ? `(${formatPaise(m.price)})` : ''}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { ...Typography.heading, fontSize: 24, color: Colors.text },
  refreshButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  
  searchFilterContainer: { marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 8, ...Typography.body, fontSize: 14, color: Colors.text, paddingVertical: 0 },
  filterScroll: { paddingRight: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterChipText: { ...Typography.button, fontSize: 12, color: '#64748B' },
  filterChipTextActive: { color: Colors.primary },

  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 130 },

  sectionHeading: { ...Typography.label, letterSpacing: 0.8, color: '#94A3B8', marginBottom: 12, marginLeft: 2 },

  // Active order
  activeSection: { marginBottom: 24 },
  activeCard: { borderRadius: 20, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  activeGradient: { padding: 20 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeStatusText: { ...Typography.title, color: '#FFFFFF', fontSize: 18, marginBottom: 4 },
  activeOrderNo: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 6 },
  liveText: { ...Typography.button, color: '#FFFFFF', fontSize: 10, letterSpacing: 0.5 },
  activeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  activeItems: { ...Typography.body, color: '#FFFFFF', fontSize: 14 },

  // Past orders
  pastSection: {},
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  restAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#F3F4F6', marginRight: 12 },
  cardHeaderInfo: { flex: 1, marginRight: 8 },
  restName: { ...Typography.title, fontSize: 16, color: Colors.text, marginBottom: 2 },
  orderDate: { ...Typography.caption, color: '#94A3B8', fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { ...Typography.button, fontSize: 10, letterSpacing: 0.4 },

  cardBody: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  itemsCountRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  itemsCountText: { ...Typography.subtitle, fontSize: 12, color: '#6B7280' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemThumb: { width: 36, height: 36, borderRadius: 8, marginRight: 10, backgroundColor: '#E5E7EB' },
  itemName: { ...Typography.subtitle, fontSize: 13, color: Colors.text },
  itemQtyPrice: { ...Typography.caption, color: '#6B7280', fontSize: 11, marginTop: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14, marginTop: 2 },
  totalPrice: { ...Typography.heading, fontSize: 17, color: Colors.text },
  orderNumberLabel: { ...Typography.caption, color: '#94A3B8', fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  rateBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 12 },
  ratedRow: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' },
  ratedText: { ...Typography.button, color: '#D97706', fontSize: 11, marginLeft: 4 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  reorderText: { ...Typography.button, color: '#FFFFFF', fontSize: 12 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },

  // Rating sheet
  ratingSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 20 },
  ratingTitle: { ...Typography.heading, fontSize: 20, color: Colors.text, marginBottom: 4 },
  ratingSubtitle: { ...Typography.caption, color: '#94A3B8', fontSize: 13, marginBottom: 24 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 4 },
  ratingHint: { ...Typography.body, color: Colors.textSecondary, fontSize: 15, marginBottom: 28 },
  submitRatingBtn: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center' },
  submitRatingText: { ...Typography.button, color: '#FFFFFF', fontSize: 15 },
  skipText: { ...Typography.caption, color: '#94A3B8', fontSize: 13 },

  // Item detail sheet
  itemDetailSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  itemDetailImage: { width: '100%', height: 200, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  itemDetailBody: { padding: 20 },
  itemDetailName: { ...Typography.heading, fontSize: 20, color: Colors.text, marginBottom: 6 },
  itemDetailDesc: { ...Typography.body, color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  itemDetailRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  itemDetailChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  itemDetailChipText: { ...Typography.subtitle, fontSize: 13, color: Colors.primary },
  itemDetailTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, marginBottom: 12 },
  itemDetailTotalLabel: { ...Typography.subtitle, fontSize: 14, color: Colors.textSecondary },
  itemDetailTotalPrice: { ...Typography.heading, fontSize: 18, color: Colors.text },
  modifierBox: { backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 12 },
  modifierLabel: { ...Typography.label, fontSize: 11, color: Colors.primary, marginBottom: 6 },
  modifierItem: { ...Typography.body, fontSize: 13, color: Colors.text, marginBottom: 4 },
});
