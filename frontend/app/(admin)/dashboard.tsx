import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAdminStore } from '../../store/admin.store';
import { useFlashDealStore } from '../../store/flashDeal.store';
import { useAuthStore } from '../../store/auth.store';
import { formatPaise } from '../../utils/formatters';

export default function AdminDashboardScreen() {
  const { overview, isLoading, fetchAdminOverview } = useAdminStore();
  const user = useAuthStore((state) => state.user);
  const { config: flashConfig, updateConfig, toggleFlashDeal } = useFlashDealStore();

  // Flash Deal Edit State
  const [dealTitle, setDealTitle] = useState(flashConfig.title);
  const [dealDiscount, setDealDiscount] = useState(flashConfig.discountText);
  const [dealDurationHours, setDealDurationHours] = useState(
    Math.round(flashConfig.durationSeconds / 3600).toString()
  );
  const [dealCategory, setDealCategory] = useState(flashConfig.targetCategory || 'Pizza');

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const onRefresh = async () => {
    await fetchAdminOverview();
  };

  const handleSaveFlashDeal = () => {
    const hours = parseFloat(dealDurationHours) || 2;
    updateConfig({
      title: dealTitle.trim() || 'Midnight Hunger?',
      discountText: dealDiscount.trim() || 'Flat 50% Off',
      durationSeconds: Math.round(hours * 3600),
      targetCategory: dealCategory.trim() || 'Pizza',
    });
    Alert.alert('Flash Deal Updated! ⚡', 'Live Flash Deal configuration updated successfully across the app.');
  };

  if (isLoading && !overview) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading super admin control panel...</Text>
      </SafeAreaView>
    );
  }

  const revenue = overview?.finance?.totalRevenue || 0;
  const deliveryFees = overview?.finance?.totalDeliveryFees || 0;
  const totalUsers = overview?.users?.total || 0;
  const totalRestaurants = overview?.restaurants?.total || 0;
  const activeOrders = overview?.orders?.active || 0;
  const totalOrders = overview?.orders?.total || 0;
  const onlineRiders = overview?.logistics?.onlineRiders || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Super Admin Top Navbar */}
      <View style={styles.navbar}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.crownCircle}>
              <Ionicons name="shield" size={12} color="#FFF" />
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
        {/* Flash Deals Control Center Card */}
        <View style={styles.flashDealCard}>
          <View style={styles.flashHeaderRow}>
            <View style={styles.flashTitleLeft}>
              <View style={styles.flashIconCircle}>
                <Ionicons name="flash" size={18} color="#FFF" />
              </View>
              <View>
                <Text style={styles.flashCardTitle}>LIVE FLASH DEAL CONTROLLER</Text>
                <Text style={styles.flashCardSubtitle}>
                  {flashConfig.isEnabled ? '🟢 Currently Active on Home Screen' : '🔴 Flash Deal is Paused / Off'}
                </Text>
              </View>
            </View>

            <Switch
              value={flashConfig.isEnabled}
              onValueChange={toggleFlashDeal}
              trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
              thumbColor={flashConfig.isEnabled ? '#16A34A' : '#EF4444'}
            />
          </View>

          {/* Flash Deal Config Form */}
          <View style={styles.flashForm}>
            <Text style={styles.inputLabel}>Deal Title</Text>
            <TextInput
              value={dealTitle}
              onChangeText={setDealTitle}
              placeholder="e.g. Midnight Hunger? / Sunday Feast"
              style={styles.inputField}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Discount Text</Text>
                <TextInput
                  value={dealDiscount}
                  onChangeText={setDealDiscount}
                  placeholder="e.g. Flat 50% Off"
                  style={styles.inputField}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Timer (Hours)</Text>
                <TextInput
                  value={dealDurationHours}
                  onChangeText={setDealDurationHours}
                  placeholder="2.5"
                  keyboardType="numeric"
                  style={styles.inputField}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveFlashDeal}
              style={styles.saveFlashBtn}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveFlashText}>Apply Flash Deal Live</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gross Revenue Hero Card */}
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

        {/* Live Ecosystem Counters */}
        <Text style={styles.sectionHeading}>LIVE PLATFORM ECOSYSTEM</Text>
        <View style={styles.kpiGrid}>
          {/* Active Orders */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="flame" size={20} color="#EA580C" />
            </View>
            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{activeOrders}</Text>
            <Text style={styles.kpiLabel}>Live Active Orders</Text>
          </View>

          {/* Online Riders */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="bicycle" size={20} color="#2563EB" />
            </View>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{onlineRiders}</Text>
            <Text style={styles.kpiLabel}>Riders Online</Text>
          </View>

          {/* Registered Users */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.kpiValue}>{totalUsers}</Text>
            <Text style={styles.kpiLabel}>Registered Users</Text>
          </View>

          {/* Onboarded Restaurants */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="storefront" size={20} color="#16A34A" />
            </View>
            <Text style={styles.kpiValue}>{totalRestaurants}</Text>
            <Text style={styles.kpiLabel}>Partner Restaurants</Text>
          </View>
        </View>

        {/* Quick Management Shortcuts */}
        <Text style={[styles.sectionHeading, { marginTop: 12 }]}>SUPER ADMIN MODULES</Text>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/coupons')}
          style={styles.actionRowCard}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="pricetag" size={22} color="#D97706" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Coupon Codes & Discounts</Text>
            <Text style={styles.actionSubtitle}>Create promo codes, set % discounts and min order</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/restaurants')}
          style={styles.actionRowCard}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="storefront" size={22} color="#16A34A" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Restaurant Onboarding & Control</Text>
            <Text style={styles.actionSubtitle}>Add new restaurants, toggle store active/suspended</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/users')}
          style={styles.actionRowCard}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="people-circle" size={24} color="#4F46E5" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>User Control & Role Upgrades</Text>
            <Text style={styles.actionSubtitle}>Make users Restaurant Owners, Riders or block accounts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  superAdminBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  switchModeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  flashDealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  flashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  flashTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  flashIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  flashCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  flashCardSubtitle: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 1,
  },
  flashForm: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 6,
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  inputRow: {
    flexDirection: 'row',
  },
  saveFlashBtn: {
    backgroundColor: '#D97706',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveFlashText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroSub: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },
  heroRevenue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 12,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroFooterLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  heroFooterValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E0E7FF',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
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
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  actionRowCard: {
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
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
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
});
