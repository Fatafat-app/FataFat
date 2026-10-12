import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { reviewService } from '../../services/review.service';
import { Review } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

export default function MyReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await reviewService.getMyReviews();
      setReviews(data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={18}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Very Good';
    if (rating === 3) return 'Average';
    if (rating === 2) return 'Poor';
    return 'Terrible';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <Text style={styles.headerSubtitle}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} given
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your reviews...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="star-outline" size={48} color="#F59E0B" />
              </View>
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptySubtitle}>
                You haven't shared your experience on any delivered orders yet. Rate your meals to help the community!
              </Text>
              <TouchableOpacity
                style={styles.ordersBtn}
                onPress={() => router.push('/(tabs)/orders' as any)}
              >
                <Ionicons name="receipt-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.ordersBtnText}>View Delivered Orders</Text>
              </TouchableOpacity>
            </View>
          ) : (
            reviews.map((rev) => {
              const restaurant = typeof rev.restaurant === 'object' ? rev.restaurant : null;
              const order = typeof rev.order === 'object' ? rev.order : null;
              const restName = restaurant?.name || 'Restaurant';
              const restImage =
                restaurant?.images?.[0] ||
                restaurant?.image ||
                restaurant?.coverImage ||
                'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg';
              const rawOrderId = typeof rev.order === 'string' ? String(rev.order) : '';
              const orderNumber = order?.orderNumber || (rawOrderId ? rawOrderId.slice(-6).toUpperCase() : '');
              const itemsList = order?.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ');
              const totalPaise = order?.pricing?.totalPaise || (order?.totalAmount ? order.totalAmount * 100 : 0);

              return (
                <View key={rev._id} style={styles.reviewCard}>
                  {/* Restaurant Header */}
                  <View style={styles.restaurantRow}>
                    <Image source={{ uri: restImage }} style={styles.restaurantImg} />
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantName} numberOfLines={1}>
                        {restName}
                      </Text>
                      {restaurant?.address?.city ? (
                        <Text style={styles.restaurantCity}>
                          {restaurant.address.city}
                        </Text>
                      ) : null}
                      <Text style={styles.reviewDate}>
                        Reviewed on {formatDate(rev.createdAt)}
                      </Text>
                    </View>

                    {restaurant?._id && (
                      <TouchableOpacity
                        style={styles.visitRestBtn}
                        onPress={() => router.push(`/restaurant/${restaurant._id}` as any)}
                      >
                        <Text style={styles.visitRestText}>Visit</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.divider} />

                  {/* Rating & Badge */}
                  <View style={styles.ratingBadgeRow}>
                    <View style={styles.scorePill}>
                      <Text style={styles.scoreText}>{rev.rating}.0</Text>
                      <Ionicons name="star" size={12} color="#FFF" style={{ marginLeft: 2 }} />
                    </View>
                    <Text style={styles.scoreLabel}>{getRatingLabel(rev.rating)}</Text>
                    <View style={{ flex: 1 }} />
                    {renderStars(rev.rating)}
                  </View>

                  {/* Review Text */}
                  {rev.text ? (
                    <View style={styles.commentBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6B7280" style={{ marginTop: 2, marginRight: 8 }} />
                      <Text style={styles.commentText}>"{rev.text}"</Text>
                    </View>
                  ) : null}

                  {/* Associated Order Details */}
                  {order ? (
                    <View style={styles.orderSummaryBox}>
                      <View style={styles.orderHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="receipt-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                          <Text style={styles.orderNumberText}>Order #{orderNumber}</Text>
                        </View>
                        {totalPaise > 0 ? (
                          <Text style={styles.orderTotalText}>{formatPaise(totalPaise)}</Text>
                        ) : null}
                      </View>
                      {itemsList ? (
                        <Text style={styles.orderItemsText} numberOfLines={2}>
                          {itemsList}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
    color: '#111827',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    ...Typography.body,
    color: '#6B7280',
    marginTop: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...Typography.heading,
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  ordersBtnText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 15,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    ...Typography.title,
    fontSize: 16,
    color: '#111827',
  },
  restaurantCity: {
    ...Typography.bodySmall,
    color: '#6B7280',
    fontSize: 12,
    marginTop: 1,
  },
  reviewDate: {
    ...Typography.bodySmall,
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  visitRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  visitRestText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 12,
    marginRight: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  scoreText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 12,
  },
  scoreLabel: {
    ...Typography.button,
    color: '#374151',
    fontSize: 13,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  commentText: {
    ...Typography.body,
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  orderSummaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumberText: {
    ...Typography.button,
    fontSize: 12,
    color: '#4B5563',
  },
  orderTotalText: {
    ...Typography.button,
    fontSize: 13,
    color: '#111827',
  },
  orderItemsText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});
