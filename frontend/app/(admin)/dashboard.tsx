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
          <TouchableOpacity onPress={() => router.push('/(admin)/orders')} style={styles.kpiCard} activeOpacity={0.8}>
            <View style={[styles.kpiIcon, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="flame" size={24} color="#EA580C" />
            </View>
            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{activeOrders}</Text>
            <Text style={styles.kpiLabel}>Live Active Orders</Text>
          </TouchableOpacity>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="bicycle" size={24} color="#2563EB" />
            </View>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{onlineRiders}</Text>
            <Text style={styles.kpiLabel}>Riders Online</Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(admin)/users')} style={styles.kpiCard} activeOpacity={0.8}>
            <View style={[styles.kpiIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.kpiValue}>{totalUsers}</Text>
            <Text style={styles.kpiLabel}>Registered Users</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(admin)/restaurants')} style={styles.kpiCard} activeOpacity={0.8}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="storefront" size={24} color="#16A34A" />
            </View>
            <Text style={styles.kpiValue}>{totalRestaurants}</Text>
            <Text style={styles.kpiLabel}>Partner Stores</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Launchpad */}
        <Text style={[styles.sectionHeading, { marginTop: 12 }]}>ADMIN COMMAND MODULES</Text>

        <TouchableOpacity onPress={() => router.push('/(admin)/orders')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="receipt" size={24} color="#4F46E5" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Live Orders & Ops Monitor</Text>
            <Text style={styles.actionSubtitle}>Track Food & Grocery orders, update statuses & SLA</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#4F46E5" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/flags')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="options" size={24} color="#D97706" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Vertical Flags & Kill Switches</Text>
            <Text style={styles.actionSubtitle}>Control Food / Grocery modes (ON, DRAIN, OFF)</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#D97706" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/restaurants')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="storefront" size={24} color="#16A34A" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Stores & Vendors Control</Text>
            <Text style={styles.actionSubtitle}>Onboard restaurants & grocery marts, manage dishes & menus</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#16A34A" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/grocery-products' as any)} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="basket" size={24} color="#16A34A" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Grocery Product Catalog</Text>
            <Text style={styles.actionSubtitle}>Add, edit, restock, toggle availability & delete grocery items</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#16A34A" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/categories')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#FDF2F8' }]}>
            <Ionicons name="fast-food" size={24} color="#DB2777" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Categories Taxonomy</Text>
            <Text style={styles.actionSubtitle}>Add, edit, remove & reorder food & grocery categories</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#DB2777" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/fees')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#ECFEFF' }]}>
            <Ionicons name="wallet" size={24} color="#0891B2" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Pricing Engine, Fees & Taxes</Text>
            <Text style={styles.actionSubtitle}>Configure GST, platform fees, delivery & surge charges</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#0891B2" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/users')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="people-circle" size={26} color="#9333EA" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>User Roles & Permissions</Text>
            <Text style={styles.actionSubtitle}>Assign Super Admin, Ops, Merchants & Rider partners</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#9333EA" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/notifications')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="paper-plane" size={24} color="#2563EB" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Push Broadcast & Campaigns</Text>
            <Text style={styles.actionSubtitle}>Send instant alerts & promo offers to customers/riders</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#2563EB" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/coupons' as any)} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="pricetag" size={24} color="#D97706" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Coupons & Promo Codes</Text>
            <Text style={styles.actionSubtitle}>Create percentage & flat discount codes, limits & conditions</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#D97706" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(admin)/audit')} style={styles.actionRowCard} activeOpacity={0.7}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#334155" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Security Audit & Outbox Logs</Text>
            <Text style={styles.actionSubtitle}>View administrative logs, IP addresses & transactional events</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={18} color="#334155" />
          </View>
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
  heroCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  heroSub: { ...Typography.label, fontSize: 11, color: '#94A3B8', letterSpacing: 0.8 },
  heroRevenue: { ...Typography.heading, fontSize: 36, color: Colors.white, marginTop: 6, marginBottom: 16 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  heroFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroFooterLabel: { ...Typography.button, fontSize: 11, color: '#94A3B8' },
  heroFooterValue: { ...Typography.heading, fontSize: 16, color: '#F1F5F9', marginTop: 4 },
  sectionHeading: { ...Typography.label, fontSize: 12, letterSpacing: 0.8, marginBottom: 12, color: Colors.textSecondary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  kpiCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  kpiIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  kpiValue: { ...Typography.heading, fontSize: 22 },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  actionRowCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  actionIconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionTextContainer: { flex: 1, marginRight: 12 },
  actionTitle: { ...Typography.title, fontSize: 15, marginBottom: 2 },
  actionSubtitle: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  actionArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
});
