import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOwnerStore } from '../../store/owner.store';
import { formatPaise } from '../../utils/formatters';

export default function OwnerDashboardScreen() {
  const { restaurant, orders, isLoading, isOpen, fetchOwnerData, toggleStoreStatus } =
    useOwnerStore();

  useEffect(() => {
    fetchOwnerData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6000" />
        <Text style={styles.loadingText}>Loading owner dashboard...</Text>
      </SafeAreaView>
    );
  }

  // Calculate Metrics
  const activeOrdersCount = orders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)
  ).length;

  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
  const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);
  const pendingAcceptance = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalBadge}>RESTAURANT PARTNER PORTAL</Text>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {restaurant?.name || "Rajesh's Kitchen"}
          </Text>
        </View>

        {/* Switch Back to Customer Mode */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.switchModeButton}
        >
          <Ionicons name="swap-horizontal" size={16} color="#4B5563" style={{ marginRight: 4 }} />
          <Text style={styles.switchModeText}>User View</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Online / Offline Card */}
        <View style={[styles.storeStatusCard, isOpen ? styles.storeOpenBg : styles.storeClosedBg]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={styles.statusDotRow}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusTitle, { color: isOpen ? '#065F46' : '#991B1B' }]}>
                {isOpen ? 'STORE IS OPEN & ACCEPTING ORDERS' : 'STORE IS CURRENTLY OFFLINE'}
              </Text>
            </View>
            <Text style={styles.statusSubtitle}>
              {isOpen
                ? 'Customers nearby can view your menu and place food orders.'
                : 'Turn ON to start receiving live food orders from customers.'}
            </Text>
          </View>

          <Switch
            value={isOpen}
            onValueChange={toggleStoreStatus}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={isOpen ? '#16A34A' : '#9CA3AF'}
          />
        </View>

        {/* Pending Alerts Banner */}
        {pendingAcceptance > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(owner)/orders')}
            style={styles.alertBanner}
          >
            <View style={styles.alertLeft}>
              <View style={styles.alertPulseCircle}>
                <Ionicons name="notifications" size={18} color="#FFF" />
              </View>
              <View>
                <Text style={styles.alertHeading}>
                  {pendingAcceptance} New {pendingAcceptance === 1 ? 'Order' : 'Orders'} Waiting!
                </Text>
                <Text style={styles.alertSub}>Tap to review and accept in kitchen</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#B45309" />
          </TouchableOpacity>
        )}

        {/* 4 Core KPI Metrics */}
        <Text style={styles.sectionTitle}>TODAY'S OVERVIEW</Text>
        <View style={styles.metricsGrid}>
          {/* Revenue */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="wallet-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>{formatPaise(todayRevenue)}</Text>
            <Text style={styles.metricLabel}>Today's Sales</Text>
          </View>

          {/* Active Orders */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="flame-outline" size={20} color="#EA580C" />
            </View>
            <Text style={[styles.metricValue, { color: '#EA580C' }]}>{activeOrdersCount}</Text>
            <Text style={styles.metricLabel}>In Kitchen / Active</Text>
          </View>

          {/* Completed */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-done-outline" size={20} color="#16A34A" />
            </View>
            <Text style={styles.metricValue}>{completedOrders.length}</Text>
            <Text style={styles.metricLabel}>Completed Orders</Text>
          </View>

          {/* Rating */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="star-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.metricValue}>
              {restaurant?.rating?.average ? restaurant.rating.average.toFixed(1) : '4.8'} ⭐
            </Text>
            <Text style={styles.metricLabel}>Store Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>QUICK MANAGEMENT</Text>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/orders')}
          style={styles.actionCard}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="restaurant" size={22} color="#FF6000" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>Kitchen Display System (KDS)</Text>
            <Text style={styles.actionSubtitle}>Accept orders, track prep status & rider pickups</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/menu')}
          style={styles.actionCard}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="fast-food" size={22} color="#2563EB" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>Menu & Stock Management</Text>
            <Text style={styles.actionSubtitle}>Toggle items in-stock / out-of-stock, add dishes</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Store Timings & Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardHeader}>STORE INFORMATION</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Cuisines</Text>
            <Text style={styles.settingValue}>
              {restaurant?.cuisines?.join(', ') || 'Multi-Cuisine'}
            </Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Delivery Charge</Text>
            <Text style={styles.settingValue}>
              {formatPaise(restaurant?.pricing?.deliveryCharge || 3000)}
            </Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Avg Prep Time</Text>
            <Text style={styles.settingValue}>
              {restaurant?.estimatedDeliveryTime || 25} mins
            </Text>
          </View>
        </View>
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
  portalBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginTop: 1,
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  storeStatusCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  storeOpenBg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  storeClosedBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  alertBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertPulseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400E',
  },
  alertSub: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextBox: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4B5563',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  settingLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
});
