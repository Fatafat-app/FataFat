import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StyleProp,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Base Skeleton Item ───────────────────────────────────────────────
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  variant?: 'rect' | 'circle' | 'text' | 'card';
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
  variant = 'rect',
}: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.45)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle opacity pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Sliding gradient shimmer
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    shimmer.start();

    return () => {
      pulse.stop();
      shimmer.stop();
    };
  }, [pulseAnim, shimmerAnim]);

  let computedBorderRadius = borderRadius;
  if (computedBorderRadius === undefined) {
    if (variant === 'circle') computedBorderRadius = 9999;
    else if (variant === 'text') computedBorderRadius = 6;
    else if (variant === 'card') computedBorderRadius = 16;
    else computedBorderRadius = 8;
  }

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width as any,
          height: height as any,
          borderRadius: computedBorderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(240, 243, 246, 0)',
            'rgba(255, 255, 255, 0.65)',
            'rgba(240, 243, 246, 0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ── Restaurant Card Skeleton ─────────────────────────────────────────
export function RestaurantCardSkeleton() {
  return (
    <View style={styles.restaurantCardContainer}>
      {/* Hero Image Box */}
      <View style={styles.restaurantCardImageWrap}>
        <Skeleton width="100%" height={190} borderRadius={20} />
        {/* Discount Badge Skeleton */}
        <View style={styles.restaurantCardBadge}>
          <Skeleton width={110} height={24} borderRadius={8} />
        </View>
        {/* Favorite Icon Skeleton */}
        <View style={styles.restaurantCardFav}>
          <Skeleton width={32} height={32} variant="circle" />
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.restaurantCardContent}>
        <View style={styles.rowBetween}>
          <Skeleton width="65%" height={20} variant="text" />
          <Skeleton width={48} height={22} borderRadius={8} />
        </View>

        <Skeleton width="45%" height={14} variant="text" style={{ marginTop: 8 }} />

        {/* Tags Row */}
        <View style={[styles.row, { marginTop: 12, gap: 8 }]}>
          <Skeleton width={80} height={22} borderRadius={6} />
          <Skeleton width={70} height={22} borderRadius={6} />
          <Skeleton width={90} height={22} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

// ── Food Item Card Skeleton ──────────────────────────────────────────
export function FoodCardSkeleton() {
  return (
    <View style={styles.foodCardContainer}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        {/* Veg/Non-Veg icon */}
        <Skeleton width={16} height={16} borderRadius={4} />
        {/* Item Title */}
        <Skeleton width="80%" height={16} variant="text" style={{ marginTop: 8 }} />
        {/* Price */}
        <Skeleton width="35%" height={18} variant="text" style={{ marginTop: 6 }} />
        {/* Description lines */}
        <Skeleton width="95%" height={12} variant="text" style={{ marginTop: 8 }} />
        <Skeleton width="65%" height={12} variant="text" style={{ marginTop: 4 }} />
      </View>

      {/* Item Image & ADD button */}
      <View style={styles.foodCardImageWrap}>
        <Skeleton width={105} height={105} borderRadius={16} />
        <View style={styles.foodCardAddButton}>
          <Skeleton width={76} height={30} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

// ── Grocery Product Card Skeleton ────────────────────────────────────
export function GroceryProductCardSkeleton() {
  return (
    <View style={styles.groceryProductCard}>
      {/* Image container */}
      <View style={styles.groceryImageWrap}>
        <Skeleton width="100%" height={115} borderRadius={14} />
        {/* Discount / ETA badge */}
        <View style={styles.groceryTag}>
          <Skeleton width={50} height={16} borderRadius={4} />
        </View>
      </View>

      {/* Product Details */}
      <View style={{ marginTop: 10 }}>
        <Skeleton width="90%" height={14} variant="text" />
        <Skeleton width="60%" height={14} variant="text" style={{ marginTop: 4 }} />
        <Skeleton width={55} height={12} variant="text" style={{ marginTop: 6 }} />

        {/* Price + ADD */}
        <View style={[styles.rowBetween, { marginTop: 10 }]}>
          <View>
            <Skeleton width={50} height={18} variant="text" />
            <Skeleton width={35} height={12} variant="text" style={{ marginTop: 3 }} />
          </View>
          <Skeleton width={58} height={28} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

// ── Category Item Skeleton ───────────────────────────────────────────
export function CategoryItemSkeleton() {
  return (
    <View style={styles.categoryItem}>
      <Skeleton width={72} height={72} variant="circle" />
      <Skeleton width={52} height={12} variant="text" style={{ marginTop: 8 }} />
    </View>
  );
}

// ── Categories Row Skeleton ──────────────────────────────────────────
export function CategoriesRowSkeleton() {
  return (
    <View style={styles.categoryRow}>
      {[1, 2, 3, 4, 5].map((key) => (
        <CategoryItemSkeleton key={key} />
      ))}
    </View>
  );
}

// ── Order Card Skeleton ──────────────────────────────────────────────
export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      {/* Header */}
      <View style={styles.rowBetween}>
        <View style={[styles.row, { gap: 10 }]}>
          <Skeleton width={44} height={44} borderRadius={12} />
          <View>
            <Skeleton width={130} height={16} variant="text" />
            <Skeleton width={80} height={12} variant="text" style={{ marginTop: 4 }} />
          </View>
        </View>
        <Skeleton width={78} height={24} borderRadius={12} />
      </View>

      {/* Items list summary */}
      <View style={styles.orderCardDivider} />
      <Skeleton width="85%" height={12} variant="text" />
      <Skeleton width="60%" height={12} variant="text" style={{ marginTop: 4 }} />

      {/* Footer */}
      <View style={styles.orderCardDivider} />
      <View style={styles.rowBetween}>
        <View>
          <Skeleton width={60} height={12} variant="text" />
          <Skeleton width={75} height={18} variant="text" style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={96} height={34} borderRadius={10} />
      </View>
    </View>
  );
}

// ── Order Details Screen Skeleton ────────────────────────────────────
export function OrderDetailSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Hero Card */}
      <View style={styles.card}>
        <View style={[styles.row, { gap: 12 }]}>
          <Skeleton width={48} height={48} variant="circle" />
          <View style={{ flex: 1 }}>
            <Skeleton width="60%" height={18} variant="text" />
            <Skeleton width="40%" height={14} variant="text" style={{ marginTop: 6 }} />
          </View>
        </View>
        {/* Progress Bar Skeleton */}
        <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 16 }} />
      </View>

      {/* Restaurant Info Card */}
      <View style={styles.card}>
        <Skeleton width={140} height={16} variant="text" />
        <Skeleton width="90%" height={12} variant="text" style={{ marginTop: 6 }} />
      </View>

      {/* Order Items Card */}
      <View style={styles.card}>
        <Skeleton width={100} height={16} variant="text" style={{ marginBottom: 12 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.rowBetween, { paddingVertical: 8 }]}>
            <Skeleton width="55%" height={14} variant="text" />
            <Skeleton width={50} height={14} variant="text" />
          </View>
        ))}
      </View>

      {/* Bill Breakdown Card */}
      <View style={styles.card}>
        <Skeleton width={90} height={16} variant="text" style={{ marginBottom: 12 }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.rowBetween, { paddingVertical: 6 }]}>
            <Skeleton width="40%" height={12} variant="text" />
            <Skeleton width={45} height={12} variant="text" />
          </View>
        ))}
        <View style={styles.orderCardDivider} />
        <View style={styles.rowBetween}>
          <Skeleton width="30%" height={16} variant="text" />
          <Skeleton width={70} height={18} variant="text" />
        </View>
      </View>
    </ScrollView>
  );
}

// ── Restaurant Menu Detail Screen Skeleton ───────────────────────────
export function RestaurantDetailSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <Skeleton width="100%" height={220} borderRadius={0} />

      {/* Info Card Overlay */}
      <View style={styles.restaurantDetailInfoCard}>
        <View style={styles.rowBetween}>
          <Skeleton width="70%" height={24} variant="text" />
          <Skeleton width={50} height={26} borderRadius={8} />
        </View>
        <Skeleton width="50%" height={14} variant="text" style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={12} variant="text" style={{ marginTop: 6 }} />

        {/* Pills row */}
        <View style={[styles.row, { marginTop: 14, gap: 8 }]}>
          <Skeleton width={80} height={26} borderRadius={13} />
          <Skeleton width={95} height={26} borderRadius={13} />
          <Skeleton width={85} height={26} borderRadius={13} />
        </View>
      </View>

      {/* Category Pills horizontal row */}
      <View style={[styles.row, { paddingHorizontal: 16, marginVertical: 16, gap: 8 }]}>
        <Skeleton width={70} height={32} borderRadius={16} />
        <Skeleton width={90} height={32} borderRadius={16} />
        <Skeleton width={80} height={32} borderRadius={16} />
        <Skeleton width={85} height={32} borderRadius={16} />
      </View>

      {/* Food Items List */}
      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        <FoodCardSkeleton />
        <FoodCardSkeleton />
        <FoodCardSkeleton />
        <FoodCardSkeleton />
      </View>
    </ScrollView>
  );
}

// ── Grocery Home Screen Skeleton ─────────────────────────────────────
export function GroceryHomeSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar Skeleton */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Skeleton width="100%" height={48} borderRadius={14} />
      </View>

      {/* Promo Hero Banner */}
      <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
        <Skeleton width="100%" height={150} borderRadius={18} />
      </View>

      {/* Categories Grid (2 rows of 4) */}
      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        <Skeleton width={120} height={18} variant="text" style={{ marginBottom: 12 }} />
        <View style={styles.groceryCategoryGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={i} style={{ alignItems: 'center', width: '23%', marginBottom: 12 }}>
              <Skeleton width={56} height={56} variant="circle" />
              <Skeleton width={44} height={10} variant="text" style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Trending / Deals Header */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <View style={styles.rowBetween}>
          <Skeleton width={140} height={20} variant="text" />
          <Skeleton width={60} height={14} variant="text" />
        </View>

        {/* 2-column Products Grid */}
        <View style={styles.twoColumnGrid}>
          <GroceryProductCardSkeleton />
          <GroceryProductCardSkeleton />
          <GroceryProductCardSkeleton />
          <GroceryProductCardSkeleton />
        </View>
      </View>
    </ScrollView>
  );
}

// ── Grocery Category Products Grid Skeleton ──────────────────────────
export function GroceryCategoryProductsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Filter Row */}
      <View style={[styles.row, { paddingHorizontal: 16, paddingVertical: 12, gap: 8 }]}>
        <Skeleton width={70} height={32} borderRadius={16} />
        <Skeleton width={80} height={32} borderRadius={16} />
        <Skeleton width={75} height={32} borderRadius={16} />
        <Skeleton width={40} height={32} borderRadius={16} />
      </View>

      {/* 2-column grid */}
      <View style={styles.twoColumnGrid}>
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
      </View>
    </View>
  );
}

// ── Grocery Product Detail Skeleton ──────────────────────────────────
export function GroceryProductDetailSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Product Hero Image */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Skeleton width="100%" height={260} borderRadius={20} />
      </View>

      {/* Info Box */}
      <View style={{ padding: 16 }}>
        <Skeleton width="75%" height={22} variant="text" />
        <Skeleton width={100} height={14} variant="text" style={{ marginTop: 8 }} />

        {/* Delivery pill */}
        <View style={{ marginTop: 12 }}>
          <Skeleton width={130} height={24} borderRadius={6} />
        </View>

        {/* Price Row */}
        <View style={[styles.rowBetween, { marginTop: 18 }]}>
          <View>
            <Skeleton width={80} height={26} variant="text" />
            <Skeleton width={50} height={14} variant="text" style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={120} height={40} borderRadius={12} />
        </View>

        {/* Description sections */}
        <View style={{ marginTop: 24 }}>
          <Skeleton width={100} height={16} variant="text" style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={12} variant="text" />
          <Skeleton width="90%" height={12} variant="text" style={{ marginTop: 6 }} />
          <Skeleton width="70%" height={12} variant="text" style={{ marginTop: 6 }} />
        </View>
      </View>
    </ScrollView>
  );
}

// ── Notification Item Skeleton ───────────────────────────────────────
export function NotificationSkeleton() {
  return (
    <View style={styles.notificationItem}>
      <Skeleton width={44} height={44} variant="circle" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.rowBetween}>
          <Skeleton width="60%" height={14} variant="text" />
          <Skeleton width={45} height={10} variant="text" />
        </View>
        <Skeleton width="90%" height={12} variant="text" style={{ marginTop: 6 }} />
        <Skeleton width="50%" height={12} variant="text" style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ── Notifications List Skeleton ──────────────────────────────────────
export function NotificationsListSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <NotificationSkeleton key={i} />
      ))}
    </View>
  );
}

// ── Address Card Skeleton ────────────────────────────────────────────
export function AddressCardSkeleton() {
  return (
    <View style={styles.addressCard}>
      <View style={[styles.row, { gap: 12 }]}>
        <Skeleton width={38} height={38} borderRadius={10} />
        <View style={{ flex: 1 }}>
          <Skeleton width={70} height={16} variant="text" />
          <Skeleton width="90%" height={12} variant="text" style={{ marginTop: 6 }} />
          <Skeleton width="65%" height={12} variant="text" style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

// ── Dashboard Metrics Skeleton (Admin / Owner / Rider) ───────────────
export function DashboardSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Profile Box */}
      <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Skeleton width={52} height={52} variant="circle" />
        <View style={{ flex: 1 }}>
          <Skeleton width={140} height={18} variant="text" />
          <Skeleton width={80} height={12} variant="text" style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* 4 Metric Stats Cards (2x2) */}
      <View style={styles.metricsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.metricCard}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={65} height={20} variant="text" style={{ marginTop: 10 }} />
            <Skeleton width={80} height={12} variant="text" style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Recent Activity List */}
      <View style={styles.card}>
        <Skeleton width={120} height={16} variant="text" style={{ marginBottom: 14 }} />
        <Skeleton width="100%" height={45} borderRadius={10} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={45} borderRadius={10} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={45} borderRadius={10} />
      </View>
    </ScrollView>
  );
}

// ── Search Results Skeleton ──────────────────────────────────────────
export function SearchResultsSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <Skeleton width={120} height={16} variant="text" style={{ marginBottom: 14 }} />
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />

        <Skeleton width={100} height={16} variant="text" style={{ marginVertical: 14 }} />
        <FoodCardSkeleton />
        <FoodCardSkeleton />
      </View>
    </ScrollView>
  );
}

// ── Shared Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  skeletonBase: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Restaurant Card
  restaurantCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  restaurantCardImageWrap: {
    width: '100%',
    height: 190,
    position: 'relative',
  },
  restaurantCardBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  restaurantCardFav: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  restaurantCardContent: {
    padding: 14,
  },
  // Food Card
  foodCardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  foodCardImageWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  foodCardAddButton: {
    position: 'absolute',
    bottom: -8,
  },
  // Grocery Card
  groceryProductCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  groceryImageWrap: {
    position: 'relative',
  },
  groceryTag: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  // Category Row
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: 75,
  },
  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  // Restaurant Detail
  restaurantDetailInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -28,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  // Grocery Grids
  groceryCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  // Notification
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Address
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
});
