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
import { router } from 'expo-router';
import { reviewService } from '../../services/review.service';
import { useAuthStore } from '../../store/auth.store';
import { Order, OrderItem, Restaurant } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrderCardSkeleton } from '../../components/ui/Skeleton';
import { useOrdersQuery } from '../../hooks';

// Human readable status labels
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Order Placed',
  PLACED: 'Order Placed',
  PAYMENT_PENDING: 'Payment Pending',
  CONFIRMED: 'Order Confirmed',
  ACCEPTED: 'Order Accepted',
  PREPARING: 'Preparing Food',
  READY: 'Food is Ready',
  READY_FOR_PICKUP: 'Ready for Pickup',
  PICKED_UP: 'Out for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

// Check if status is active/ongoing
const isActiveStatus = (status?: string): boolean => {
  const s = (status || '').toUpperCase();
  return [
    'PENDING',
    'PLACED',
    'PAYMENT_PENDING',
    'CONFIRMED',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'READY_FOR_PICKUP',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
  ].includes(s);
};

// Calculate active milestone step (1-4)
const getActiveMilestone = (status?: string): number => {
  const s = (status || '').toUpperCase();
  if (['PENDING', 'PLACED', 'PAYMENT_PENDING'].includes(s)) return 1;
  if (['CONFIRMED', 'ACCEPTED'].includes(s)) return 2;
  if (['PREPARING', 'READY', 'READY_FOR_PICKUP'].includes(s)) return 3;
  if (['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s)) return 4;
  return 1;
};

const formatOrderNumber = (num?: string, id?: string) => {
  const target = num || id || '';
  if (/^[a-f\d]{24}$/i.test(target)) {
    return target.slice(-6).toUpperCase();
  }
  return target;
};

export default function OrdersScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // TanStack Query: Cached & Deduped Orders
  const { data: orders = [], isLoading, refetch } = useOrdersQuery();
  const loading = isLoading && orders.length === 0;

  // orderId -> star rating (1-5) once submitted
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Rating modal state
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Item detail modal state
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  // Section & Search Tabs: 'ALL' | 'ACTIVE' | 'PAST'
  const [activeSectionTab, setActiveSectionTab] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  const loadUserReviews = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const userReviews = await reviewService.getMyReviews();
      const map: Record<string, number> = {};
      userReviews.forEach((rev) => {
        const orderId = typeof rev.order === 'object' ? rev.order?._id || rev.order?.id : rev.order;
        if (orderId) {
          map[orderId] = rev.rating;
        }
      });
      setRatings((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserReviews();
  }, [loadUserReviews, orders]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadUserReviews()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return '#059669';
    if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return '#DC2626';
    if (['PREPARING', 'CONFIRMED', 'ACCEPTED'].includes(s)) return '#D97706';
    if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s)) return '#2563EB';
    return Colors.primary;
  };

  const getStatusBgColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return '#ECFDF5';
    if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return '#FEF2F2';
    if (['PREPARING', 'CONFIRMED', 'ACCEPTED'].includes(s)) return '#FFFBEB';
    if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s)) return '#EFF6FF';
    return '#F0FDFA';
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0) {
      Alert.alert('Select Rating', 'Please tap on the stars to rate your order.');
      return;
    }
    if (!ratingOrder) return;

    setRatingSubmitting(true);
    try {
      await reviewService.submitReview({
        orderId: ratingOrder._id,
        rating: ratingValue,
        text: reviewText.trim() || undefined,
      });

      setRatings((prev) => ({ ...prev, [ratingOrder._id]: ratingValue }));
      setRatingSubmitting(false);
      setRatingOrder(null);
      setRatingValue(0);
      setReviewText('');
      Alert.alert('Thank You! ⭐', 'Your review has been submitted and restaurant rating updated!');
    } catch (err: any) {
      setRatingSubmitting(false);
      const msg = err.response?.data?.message || err.message || 'Failed to submit review';
      Alert.alert('Review Error', msg);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 12 }}>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Filter orders by search query
  let filteredOrders = orders;
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter((o) => {
      const r = o.restaurantId as unknown as Restaurant;
      const restName = (r?.name || 'Partner Restaurant').toLowerCase();
      const itemsMatch = o.items?.some((i) => (i.name || '').toLowerCase().includes(q));
      const orderNo = formatOrderNumber(o.orderNumber, o._id).toLowerCase();
      return restName.includes(q) || itemsMatch || orderNo.includes(q);
    });
  }

  // Partition into Active and Past orders
  const activeOrders = filteredOrders.filter((o) => isActiveStatus(o.status));
  const pastOrders = filteredOrders.filter((o) => !isActiveStatus(o.status));

  const showActiveSection = (activeSectionTab === 'ALL' || activeSectionTab === 'ACTIVE') && activeOrders.length > 0;
  const showPastSection = (activeSectionTab === 'ALL' || activeSectionTab === 'PAST') && pastOrders.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} {orders.length === 1 ? 'total order' : 'total orders'}
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── SEARCH & SECTION TABS ── */}
      <View style={styles.controlsContainer}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, restaurants, items..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 2 Main Sections Segmented Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeSectionTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => setActiveSectionTab('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeSectionTab === 'ALL' && styles.tabTextActive]}>
              All ({filteredOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeSectionTab === 'ACTIVE' && styles.tabButtonActive]}
            onPress={() => setActiveSectionTab('ACTIVE')}
            activeOpacity={0.7}
          >
            <View style={styles.tabBadgeRow}>
              {activeOrders.length > 0 && (
                <Animated.View style={[styles.tabPulseDot, { opacity: pulseAnim }]} />
              )}
              <Text style={[styles.tabText, activeSectionTab === 'ACTIVE' && styles.tabTextActive]}>
                Active ({activeOrders.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeSectionTab === 'PAST' && styles.tabButtonActive]}
            onPress={() => setActiveSectionTab('PAST')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeSectionTab === 'PAST' && styles.tabTextActive]}>
              Past Orders ({pastOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {!isAuthenticated ? (
          <EmptyState
            icon="log-in-outline"
            title="Login Required"
            message="Please login to view your orders and track live deliveries."
            actionText="Login Now"
            onAction={() => router.push('/(auth)/login')}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Orders Placed Yet"
            message="Looks like you haven't ordered any delicious food yet."
            actionText="Explore Restaurants"
            onAction={() => router.replace('/(tabs)')}
          />
        ) : (
          <View>
            {/* ══════════════════════════════════════════════
                SECTION 1: ONGOING / ACTIVE ORDERS
               ══════════════════════════════════════════════ */}
            {(activeSectionTab === 'ACTIVE' && activeOrders.length === 0) ? (
              <View style={styles.emptyTabCard}>
                <Ionicons name="bicycle-outline" size={44} color="#CBD5E1" />
                <Text style={styles.emptyTabTitle}>No Active Orders</Text>
                <Text style={styles.emptyTabDesc}>You don't have any orders currently being prepared or delivered.</Text>
                <TouchableOpacity style={styles.emptyTabBtn} onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.emptyTabBtnText}>Order Food Now</Text>
                </TouchableOpacity>
              </View>
            ) : showActiveSection && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <Animated.View style={[styles.liveIndicatorDot, { opacity: pulseAnim }]} />
                    <Text style={styles.sectionHeaderTitle}>ONGOING ORDERS</Text>
                  </View>
                  <View style={styles.countBadgeActive}>
                    <Text style={styles.countBadgeActiveText}>{activeOrders.length} live</Text>
                  </View>
                </View>

                {activeOrders.map((order) => {
                  const restaurant = order.restaurantId as unknown as Restaurant;
                  const restName = restaurant?.name || 'Partner Restaurant';
                  const restImage =
                    restaurant?.images?.[0] ||
                    (restaurant as any)?.coverImage ||
                    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg';
                  const status = (order.status || 'PENDING').toUpperCase();
                  const total = order.pricing?.totalAmount || 0;
                  const milestone = getActiveMilestone(status);
                  const orderNumText = formatOrderNumber(order.orderNumber, order._id);
                  const totalItemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                  return (
                    <TouchableOpacity
                      key={order._id}
                      style={styles.activeCard}
                      activeOpacity={0.92}
                      onPress={() => router.push(`/order/${order._id}`)}
                    >
                      {/* Top Header of Active Card */}
                      <View style={styles.activeCardTop}>
                        <Image source={{ uri: restImage }} style={styles.activeRestAvatar} />
                        <View style={styles.activeRestInfo}>
                          <Text style={styles.activeRestName} numberOfLines={1}>{restName}</Text>
                          <Text style={styles.activeOrderNo}>Order #{orderNumText}</Text>
                        </View>
                        <View style={styles.activeLivePill}>
                          <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                          <Text style={styles.activeLivePillText}>LIVE</Text>
                        </View>
                      </View>

                      {/* Current Status Banner */}
                      <View style={styles.activeStatusBanner}>
                        <View style={styles.activeStatusIconWrap}>
                          <Ionicons
                            name={
                              milestone === 4
                                ? 'bicycle'
                                : milestone === 3
                                ? 'restaurant'
                                : milestone === 2
                                ? 'checkmark-circle'
                                : 'time'
                            }
                            size={18}
                            color={Colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activeStatusLabel}>
                            {STATUS_LABEL[status] || status.replace(/_/g, ' ')}
                          </Text>
                          <Text style={styles.activeStatusSub}>
                            {milestone === 4
                              ? 'Your delivery partner is on the way!'
                              : milestone === 3
                              ? 'Kitchen is preparing your fresh meal'
                              : milestone === 2
                              ? 'Restaurant confirmed your order'
                              : 'Waiting for restaurant confirmation'}
                          </Text>
                        </View>
                      </View>

                      {/* 4-Step Mini Progress Indicator */}
                      <View style={styles.stepperContainer}>
                        {['Placed', 'Confirmed', 'Preparing', 'On the Way'].map((stepTitle, idx) => {
                          const stepNum = idx + 1;
                          const isDone = milestone >= stepNum;
                          const isCurrent = milestone === stepNum;
                          return (
                            <View key={stepTitle} style={styles.stepColumn}>
                              <View style={styles.stepTrackRow}>
                                <View
                                  style={[
                                    styles.stepBar,
                                    idx === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
                                    idx === 3 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
                                    isDone ? styles.stepBarActive : styles.stepBarInactive,
                                    isCurrent && styles.stepBarCurrent,
                                  ]}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.stepText,
                                  isDone && styles.stepTextActive,
                                  isCurrent && styles.stepTextCurrent,
                                ]}
                                numberOfLines={1}
                              >
                                {stepTitle}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* Items Summary Preview */}
                      <View style={styles.activeItemsPreview}>
                        <Ionicons name="fast-food-outline" size={14} color="#64748B" />
                        <Text style={styles.activeItemsText} numberOfLines={1}>
                          {order.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </Text>
                      </View>

                      {/* Card Bottom: Total + Direct Track CTA */}
                      <View style={styles.activeCardBottom}>
                        <View>
                          <Text style={styles.activeTotalLabel}>Total Amount</Text>
                          <Text style={styles.activeTotalVal}>{formatPaise(total)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.trackLiveBtn}
                          onPress={() => router.push(`/order/${order._id}`)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.trackLiveBtnText}>Track Order</Text>
                          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ══════════════════════════════════════════════
                SECTION 2: PAST ORDERS
               ══════════════════════════════════════════════ */}
            {(activeSectionTab === 'PAST' && pastOrders.length === 0) ? (
              <View style={styles.emptyTabCard}>
                <Ionicons name="archive-outline" size={44} color="#CBD5E1" />
                <Text style={styles.emptyTabTitle}>No Past Orders</Text>
                <Text style={styles.emptyTabDesc}>Completed and delivered orders will be neatly listed here.</Text>
                <TouchableOpacity style={styles.emptyTabBtn} onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.emptyTabBtnText}>Start Ordering</Text>
                </TouchableOpacity>
              </View>
            ) : showPastSection && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.sectionHeaderTitle}>PAST ORDERS</Text>
                  </View>
                  <View style={styles.countBadgePast}>
                    <Text style={styles.countBadgePastText}>{pastOrders.length} orders</Text>
                  </View>
                </View>

                {pastOrders.map((order) => {
                  const restaurant = order.restaurantId as unknown as Restaurant;
                  const restName = restaurant?.name || 'Partner Restaurant';
                  const restImage =
                    restaurant?.images?.[0] ||
                    (restaurant as any)?.coverImage ||
                    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg';
                  const status = (order.status || 'UNKNOWN').toUpperCase();
                  const isDelivered = status === 'DELIVERED';
                  const isCancelled = ['CANCELLED', 'REJECTED', 'FAILED'].includes(status);
                  const total = order.pricing?.totalAmount || 0;
                  const totalItemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  const orderNumText = formatOrderNumber(order.orderNumber, order._id);

                  return (
                    <TouchableOpacity
                      key={order._id}
                      style={styles.pastCard}
                      onPress={() => router.push(`/order/${order._id}`)}
                      activeOpacity={0.85}
                    >
                      {/* Header: Restaurant + Status Badge */}
                      <View style={styles.pastCardHeader}>
                        <Image source={{ uri: restImage }} style={styles.pastRestAvatar} />
                        <View style={styles.pastHeaderInfo}>
                          <Text style={styles.pastRestName} numberOfLines={1}>{restName}</Text>
                          <Text style={styles.pastDateText}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {' · '}
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                          <Text style={styles.pastOrderNo}>Order #{orderNumText}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(status) }]}>
                          <Ionicons
                            name={isDelivered ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'time'}
                            size={12}
                            color={getStatusColor(status)}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                            {STATUS_LABEL[status] || status}
                          </Text>
                        </View>
                      </View>

                      {/* Items List (Clickable item details) */}
                      <View style={styles.pastCardBody}>
                        <View style={styles.itemsSummaryRow}>
                          <Ionicons name="receipt-outline" size={13} color="#64748B" />
                          <Text style={styles.itemsSummaryText}>
                            {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} ordered
                          </Text>
                        </View>

                        {order.items?.map((it, i) => {
                          const itemImage = (it as any).menuItem?.images?.[0] || null;
                          return (
                            <TouchableOpacity
                              key={i}
                              style={styles.pastItemRow}
                              onPress={(e) => {
                                e.stopPropagation();
                                setSelectedItem(it);
                              }}
                              activeOpacity={0.7}
                            >
                              {itemImage && <Image source={{ uri: itemImage }} style={styles.pastItemThumb} />}
                              <View style={{ flex: 1 }}>
                                <Text style={styles.pastItemName} numberOfLines={1}>{it.name}</Text>
                                <Text style={styles.pastItemMeta}>
                                  Qty: {it.quantity} · {formatPaise(it.totalItemPrice || it.price * it.quantity)}
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Footer: Price + Actions */}
                      <View style={styles.pastCardFooter}>
                        <View>
                          <Text style={styles.pastTotalLabel}>Total Paid</Text>
                          <Text style={styles.pastTotalPrice}>{formatPaise(total)}</Text>
                        </View>

                        <View style={styles.pastActionRow}>
                          {isDelivered && (
                            ratings[order._id] ? (
                              <View style={styles.ratedBadge}>
                                <Ionicons name="star" size={13} color="#D97706" />
                                <Text style={styles.ratedBadgeText}>{ratings[order._id]}.0 Rated</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.rateOrderBtn}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setRatingOrder(order);
                                  setRatingValue(0);
                                  setReviewText('');
                                }}
                                activeOpacity={0.75}
                              >
                                <Ionicons name="star-outline" size={13} color="#D97706" />
                                <Text style={styles.rateOrderBtnText}>Rate</Text>
                              </TouchableOpacity>
                            )
                          )}

                          <TouchableOpacity
                            style={styles.reorderBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (restaurant?._id) router.push(`/restaurant/${restaurant._id}`);
                            }}
                            activeOpacity={0.75}
                          >
                            <Ionicons name="repeat-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.reorderBtnText}>Reorder</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* When search yields 0 results across both */}
            {filteredOrders.length === 0 && searchQuery.trim() !== '' && (
              <View style={styles.emptyTabCard}>
                <Ionicons name="search-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyTabTitle}>No orders found</Text>
                <Text style={styles.emptyTabDesc}>No results matched "{searchQuery}". Try a different keyword.</Text>
                <TouchableOpacity style={styles.emptyTabBtn} onPress={() => setSearchQuery('')}>
                  <Text style={styles.emptyTabBtnText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════
          RATING SHEET MODAL
         ══════════════════════════════════════════════ */}
      <Modal
        visible={!!ratingOrder}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRatingOrder(null);
          setReviewText('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setRatingOrder(null);
            setReviewText('');
          }}
        >
          <TouchableOpacity style={styles.ratingSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.ratingTitle}>Rate Your Food Experience</Text>
            <Text style={styles.ratingSubtitle}>
              {(ratingOrder?.restaurantId as any)?.name || 'Partner Restaurant'}
            </Text>

            {/* Star selector */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)} style={styles.starBtn}>
                  <Ionicons
                    name={star <= ratingValue ? 'star' : 'star-outline'}
                    size={38}
                    color={star <= ratingValue ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingHint}>
              {ratingValue === 0
                ? 'Tap a star to rate'
                : ratingValue === 1
                ? '😞 Terrible'
                : ratingValue === 2
                ? '😕 Bad'
                : ratingValue === 3
                ? '😐 Okay'
                : ratingValue === 4
                ? '😊 Good'
                : '🤩 Excellent!'}
            </Text>

            <TextInput
              style={styles.reviewInput}
              placeholder="Tell others what you loved or how to improve (optional)..."
              placeholderTextColor="#94A3B8"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.submitRatingBtn, ratingValue === 0 && { opacity: 0.5 }]}
              onPress={handleSubmitRating}
              disabled={ratingSubmitting}
            >
              {ratingSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitRatingText}>Submit Review ⭐</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRatingOrder(null);
                setReviewText('');
              }}
              style={{ marginTop: 14 }}
            >
              <Text style={styles.skipText}>Not now, skip</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ══════════════════════════════════════════════
          ITEM DETAIL SHEET MODAL
         ══════════════════════════════════════════════ */}
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
                      <Text style={styles.itemDetailChipText}>Quantity: {selectedItem.quantity}</Text>
                    </View>
                    <View style={styles.itemDetailChip}>
                      <Ionicons name="pricetag-outline" size={13} color={Colors.primary} />
                      <Text style={styles.itemDetailChipText}>{formatPaise(selectedItem.price)} each</Text>
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
                      <Text style={styles.modifierLabel}>Add-ons & Customizations</Text>
                      {selectedItem.selectedModifiers.map((m, i) => (
                        <Text key={i} style={styles.modifierItem}>
                          + {m.name} {m.price > 0 ? `(${formatPaise(m.price)})` : ''}
                        </Text>
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

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { ...Typography.heading, fontSize: 22, color: Colors.text },
  headerSubtitle: { ...Typography.caption, color: '#94A3B8', fontSize: 12, marginTop: 1 },
  refreshButton: {
    padding: 8,
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },

  // Controls (Search & Segmented Tabs)
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.subtitle,
    fontSize: 12,
    color: '#64748B',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  // Scroll Container
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },

  // Section Headers
  sectionContainer: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  sectionHeaderTitle: {
    ...Typography.label,
    fontSize: 12,
    letterSpacing: 0.8,
    color: '#64748B',
  },
  countBadgeActive: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  countBadgeActiveText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  countBadgePast: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgePastText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  // ═══════════════════════════════════════
  // ACTIVE ORDER CARD STYLES
  // ═══════════════════════════════════════
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  activeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeRestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  activeRestInfo: { flex: 1 },
  activeRestName: { ...Typography.title, fontSize: 16, color: Colors.text },
  activeOrderNo: { ...Typography.caption, color: '#94A3B8', fontSize: 11, marginTop: 2 },
  activeLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activeLivePillText: {
    ...Typography.button,
    fontSize: 10,
    color: '#059669',
    letterSpacing: 0.5,
  },
  activeStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
  },
  activeStatusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activeStatusLabel: { ...Typography.subtitle, fontSize: 14, color: Colors.primaryDark },
  activeStatusSub: { ...Typography.caption, fontSize: 11, color: '#0F766E', marginTop: 1 },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  stepColumn: { flex: 1, marginHorizontal: 2 },
  stepTrackRow: { marginBottom: 4 },
  stepBar: { height: 4, borderRadius: 2 },
  stepBarInactive: { backgroundColor: '#E2E8F0' },
  stepBarActive: { backgroundColor: Colors.primary },
  stepBarCurrent: { backgroundColor: '#059669' },
  stepText: { ...Typography.caption, fontSize: 9, color: '#94A3B8', textAlign: 'center' },
  stepTextActive: { color: Colors.primary, fontWeight: '700' },
  stepTextCurrent: { color: '#059669', fontWeight: '800' },

  activeItemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  activeItemsText: { ...Typography.bodySmall, fontSize: 12, color: '#475569', flex: 1 },

  activeCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  activeTotalLabel: { ...Typography.caption, color: '#94A3B8', fontSize: 10 },
  activeTotalVal: { ...Typography.heading, fontSize: 16, color: Colors.text, marginTop: 1 },
  trackLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  trackLiveBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 12 },

  // ═══════════════════════════════════════
  // PAST ORDER CARD STYLES
  // ═══════════════════════════════════════
  pastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pastCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pastRestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  pastHeaderInfo: { flex: 1, marginRight: 8 },
  pastRestName: { ...Typography.title, fontSize: 15, color: Colors.text, marginBottom: 2 },
  pastDateText: { ...Typography.caption, color: '#94A3B8', fontSize: 11 },
  pastOrderNo: { ...Typography.caption, color: '#CBD5E1', fontSize: 10, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { ...Typography.button, fontSize: 10, letterSpacing: 0.3 },

  pastCardBody: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  itemsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  itemsSummaryText: { ...Typography.caption, fontSize: 11, color: '#64748B', fontWeight: '600' },
  pastItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pastItemThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  pastItemName: { ...Typography.subtitle, fontSize: 12, color: Colors.text },
  pastItemMeta: { ...Typography.caption, color: '#64748B', fontSize: 11, marginTop: 1 },

  pastCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  pastTotalLabel: { ...Typography.caption, color: '#94A3B8', fontSize: 10 },
  pastTotalPrice: { ...Typography.heading, fontSize: 16, color: Colors.text, marginTop: 1 },
  pastActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratedBadgeText: { ...Typography.caption, color: '#D97706', fontSize: 11, fontWeight: '700' },
  rateOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rateOrderBtnText: { ...Typography.button, color: '#D97706', fontSize: 11 },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
  },
  reorderBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 11 },

  // Empty state inside tab
  emptyTabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginVertical: 10,
  },
  emptyTabTitle: { ...Typography.heading, fontSize: 17, color: Colors.text, marginTop: 12, marginBottom: 4 },
  emptyTabDesc: { ...Typography.bodySmall, color: '#94A3B8', textAlign: 'center', marginBottom: 16 },
  emptyTabBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyTabBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 12 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },

  // Rating sheet
  ratingSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 18 },
  ratingTitle: { ...Typography.heading, fontSize: 19, color: Colors.text, marginBottom: 4 },
  ratingSubtitle: { ...Typography.caption, color: '#94A3B8', fontSize: 13, marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  starBtn: { padding: 4 },
  ratingHint: { ...Typography.body, color: Colors.textSecondary, fontSize: 14, marginBottom: 16 },
  reviewInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  submitRatingBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  submitRatingText: { ...Typography.button, color: '#FFFFFF', fontSize: 14 },
  skipText: { ...Typography.caption, color: '#94A3B8', fontSize: 13 },

  // Item detail sheet
  itemDetailSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  itemDetailImage: { width: '100%', height: 200, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  itemDetailBody: { padding: 20 },
  itemDetailName: { ...Typography.heading, fontSize: 19, color: Colors.text, marginBottom: 6 },
  itemDetailDesc: { ...Typography.body, color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  itemDetailRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  itemDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  itemDetailChipText: { ...Typography.subtitle, fontSize: 12, color: Colors.primary },
  itemDetailTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemDetailTotalLabel: { ...Typography.subtitle, fontSize: 13, color: Colors.textSecondary },
  itemDetailTotalPrice: { ...Typography.heading, fontSize: 17, color: Colors.text },
  modifierBox: { backgroundColor: '#F0FDFA', padding: 12, borderRadius: 12 },
  modifierLabel: { ...Typography.label, fontSize: 11, color: Colors.primary, marginBottom: 6 },
  modifierItem: { ...Typography.body, fontSize: 12, color: Colors.text, marginBottom: 4 },
});

