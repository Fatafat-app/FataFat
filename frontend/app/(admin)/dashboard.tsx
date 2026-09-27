import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAdminStore } from '../../store/admin.store';
import { useAuthStore } from '../../store/auth.store';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

export default function AdminDashboardScreen() {
  const { overview, isLoading, fetchAdminOverview } = useAdminStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const onRefresh = async () => {
    await fetchAdminOverview();
  };

  if (isLoading && !overview) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading super admin control panel...</Text>
      </SafeAreaView>
    );
  }

  const revenue =
    overview?.finance?.totalRevenue ??
    (overview as any)?.financials?.grossMerchandiseValue ??
    0;
  const deliveryFees =
    overview?.finance?.totalDeliveryFees ??
    (overview as any)?.financials?.totalDeliveryFees ??
    0;
  const totalUsers = overview?.users?.total || 0;
  const totalRestaurants = overview?.restaurants?.total || 0;
  const activeOrders = overview?.orders?.active || 0;
  const totalOrders = overview?.orders?.total || 0;
  const onlineRiders =
    overview?.logistics?.onlineRiders ??
    (overview as any)?.riders?.online ??
    0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.crownCircle}>
              <Ionicons name="shield" size={12} color={Colors.white} />
            </View>
            <Text style={styles.superAdminBadge}>SUPER ADMIN CONTROL</Text>
          </View>
          <Text style={styles.adminTitle}>{user?.name || 'Super Administrator'}</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.switchModeButton}
        >
          <Ionicons name="swap-horizontal" size={16} color="#4F46E5" style={{ marginRight: 4 }} />
          <Text style={styles.switchModeText}>User App</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroSub}>PLATFORM GROSS REVENUE (GMV)</Text>
          <Text style={styles.heroRevenue}>{formatPaise(revenue)}</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroFooterRow}>
            <View>
              <Text style={styles.heroFooterLabel}>Delivery Fees Collected</Text>
              <Text style={styles.heroFooterValue}>{formatPaise(deliveryFees)}</Text>
            </View>
            <View>
              <Text style={styles.heroFooterLabel}>Total Orders Processed</Text>
              <Text style={styles.heroFooterValue}>{totalOrders}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>LIVE PLATFORM ECOSYSTEM</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="flame" size={20} color="#EA580C" />
            </View>
            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{activeOrders}</Text>
            <Text style={styles.kpiLabel}>Live Active Orders</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="bicycle" size={20} color="#2563EB" />
            </View>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{onlineRiders}</Text>
            <Text style={styles.kpiLabel}>Riders Online</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.kpiValue}>{totalUsers}</Text>
            <Text style={styles.kpiLabel}>Registered Users</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="storefront" size={20} color="#16A34A" />
            </View>
            <Text style={styles.kpiValue}>{totalRestaurants}</Text>
            <Text style={styles.kpiLabel}>Partner Restaurants</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { marginTop: 12 }]}>SUPER ADMIN MODULES</Text>

        <TouchableOpacity onPress={() => router.push('/(admin)/categories')} style={styles.actionRowCard}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#FDF2F8' }]}>
            <Ionicons name="fast-food" size={22} color="#DB2777" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>"What's on your mind?" Categories</Text>
            <Text style={styles.actionSubtitle}>Add, edit, remove & arrange (1, 2, 3...) home food categories</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/notifications')} style={styles.actionRowCard}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="paper-plane" size={22} color="#4F46E5" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Push & In-App Notification Broadcast</Text>
            <Text style={styles.actionSubtitle}>Send instant alerts, offers & announcements to customers, riders or owners</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/fees')} style={styles.actionRowCard}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="card" size={22} color="#4F46E5" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Platform Fees & Tax Settings</Text>
            <Text style={styles.actionSubtitle}>Configure GST rate, platform fee, delivery, packaging & custom charges</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Coupons module is under construction.')} style={styles.actionRowCard}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="pricetag" size={22} color="#D97706" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Coupon Codes & Discounts</Text>
            <Text style={styles.actionSubtitle}>Create promo codes, set % discounts and min order</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/restaurants')} style={styles.actionRowCard}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="storefront" size={22} color="#16A34A" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Restaurant Onboarding & Control</Text>
            <Text style={styles.actionSubtitle}>Add new restaurants, toggle store active/suspended</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/users')} style={styles.actionRowCard}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="people-circle" size={24} color="#4F46E5" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>User Control & Role Upgrades</Text>
            <Text style={styles.actionSubtitle}>Make users Restaurant Owners, Riders or block accounts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  crownCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  superAdminBadge: { ...Typography.label, fontSize: 9, color: '#4F46E5', letterSpacing: 0.5 },
  adminTitle: { ...Typography.heading, fontSize: 18, marginTop: 2 },
  switchModeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE' },
  switchModeText: { ...Typography.button, fontSize: 11, color: '#4F46E5' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },
  heroCard: { backgroundColor: '#1E1B4B', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  heroSub: { ...Typography.label, fontSize: 10, color: '#A5B4FC', letterSpacing: 0.5 },
  heroRevenue: { ...Typography.heading, fontSize: 32, color: Colors.white, marginTop: 4, marginBottom: 12 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 12 },
  heroFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroFooterLabel: { ...Typography.button, fontSize: 10, color: Colors.textSecondary },
  heroFooterValue: { ...Typography.heading, fontSize: 14, color: '#E0E7FF', marginTop: 2 },
  sectionHeading: { ...Typography.label, fontSize: 11, letterSpacing: 0.5, marginBottom: 10 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  kpiCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  kpiIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValue: { ...Typography.heading, fontSize: 20 },
  kpiLabel: { ...Typography.button, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actionRowCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  actionIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionTextContainer: { flex: 1, marginRight: 8 },
  actionTitle: { ...Typography.title, fontSize: 14 },
  actionSubtitle: { ...Typography.caption, fontSize: 11, marginTop: 2 },
});
