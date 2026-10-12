import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/Theme';
import {
  RestaurantCardSkeleton,
  FoodCardSkeleton,
  GroceryProductCardSkeleton,
  OrderCardSkeleton,
  OrderDetailSkeleton,
  RestaurantDetailSkeleton,
  GroceryHomeSkeleton,
  NotificationsListSkeleton,
  AddressCardSkeleton,
  DashboardSkeleton,
  SearchResultsSkeleton,
} from './Skeleton';

export interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  type?:
    | 'spinner'
    | 'restaurant'
    | 'food'
    | 'grocery'
    | 'orders'
    | 'order-detail'
    | 'restaurant-detail'
    | 'grocery-home'
    | 'notifications'
    | 'address'
    | 'dashboard'
    | 'search';
}

export function Loading({
  message,
  fullScreen = false,
  type = 'spinner',
}: LoadingProps) {
  if (type === 'restaurant') {
    return (
      <View style={styles.skeletonList}>
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
      </View>
    );
  }

  if (type === 'food') {
    return (
      <View style={styles.skeletonList}>
        <FoodCardSkeleton />
        <FoodCardSkeleton />
        <FoodCardSkeleton />
      </View>
    );
  }

  if (type === 'grocery') {
    return (
      <View style={styles.groceryGrid}>
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
        <GroceryProductCardSkeleton />
      </View>
    );
  }

  if (type === 'orders') {
    return (
      <View style={styles.skeletonList}>
        <OrderCardSkeleton />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </View>
    );
  }

  if (type === 'order-detail') {
    return <OrderDetailSkeleton />;
  }

  if (type === 'restaurant-detail') {
    return <RestaurantDetailSkeleton />;
  }

  if (type === 'grocery-home') {
    return <GroceryHomeSkeleton />;
  }

  if (type === 'notifications') {
    return <NotificationsListSkeleton />;
  }

  if (type === 'address') {
    return (
      <View style={styles.skeletonList}>
        <AddressCardSkeleton />
        <AddressCardSkeleton />
        <AddressCardSkeleton />
      </View>
    );
  }

  if (type === 'dashboard') {
    return <DashboardSkeleton />;
  }

  if (type === 'search') {
    return <SearchResultsSkeleton />;
  }

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  text: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  skeletonList: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  groceryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
