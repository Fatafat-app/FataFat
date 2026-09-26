import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const clearCart = useCartStore((state) => state.clearCart);

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of Ftafat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          clearCart();
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color="#854D0E" />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Ftafat User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+91 98222 33344'}</Text>
            {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'Customer'}</Text>
            </View>
          </View>
        </View>

        {/* Super Admin Dashboard Shortcut Banner */}
        <TouchableOpacity
          onPress={() => router.push('/(admin)/dashboard')}
          style={[styles.ownerBanner, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
        >
          <View style={styles.ownerBannerLeft}>
            <View style={[styles.ownerIconCircle, { backgroundColor: '#4F46E5' }]}>
              <Ionicons name="shield-checkmark" size={22} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.ownerBannerTitle, { color: '#3730A3' }]}>Super Admin Portal</Text>
              <Text style={[styles.ownerBannerSub, { color: '#4F46E5' }]}>
                Platform KPIs, User Moderation & Audit Logs
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#4F46E5" />
        </TouchableOpacity>

        {/* Owner Dashboard Shortcut Banner */}
        <TouchableOpacity
          onPress={() => router.push('/(owner)/dashboard')}
          style={styles.ownerBanner}
        >
          <View style={styles.ownerBannerLeft}>
            <View style={styles.ownerIconCircle}>
              <Ionicons name="storefront" size={22} color="#FFF" />
            </View>
            <View>
              <Text style={styles.ownerBannerTitle}>Restaurant Partner Portal</Text>
              <Text style={styles.ownerBannerSub}>
                Manage Kitchen Orders, Menu & Store Status
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#EA580C" />
        </TouchableOpacity>

        {/* Quick Settings Section */}
        <View style={styles.sectionCard}>
          <ProfileRow
            icon="location-outline"
            title="Saved Addresses"
            subtitle="Manage home, work, and other delivery points"
            onPress={() => Alert.alert('Addresses', 'Saved delivery addresses configured in profile')}
          />
          <ProfileRow
            icon="wallet-outline"
            title="Ftafat Wallet"
            subtitle="₹0.00 • Instant refunds & cashback"
            onPress={() => {}}
          />
          <ProfileRow
            icon="pricetag-outline"
            title="Offers & Discounts"
            subtitle="View eligible coupons & food promo codes"
            onPress={() => {}}
          />
          <ProfileRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Order tracking SMS and WhatsApp alerts"
            onPress={() => {}}
          />
        </View>

        {/* Support & Legal */}
        <View style={styles.sectionCard}>
          <ProfileRow
            icon="help-circle-outline"
            title="Help & Customer Support"
            subtitle="24/7 Live chat & order assistance"
            onPress={() => {}}
          />
          <ProfileRow
            icon="document-text-outline"
            title="Terms & Privacy Policy"
            subtitle="Legal details and conditions"
            onPress={() => {}}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.rowContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={20} color="#4B5563" />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FACC15',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  userPhone: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    textTransform: 'uppercase',
  },
  ownerBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  ownerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  ownerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF6000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#9A3412',
  },
  ownerBannerSub: {
    fontSize: 11,
    color: '#C2410C',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '900',
    fontSize: 15,
  },
});
