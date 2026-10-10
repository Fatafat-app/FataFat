import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { userService } from '../../services/user.service';
import { Typography, Colors } from '../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const clearCart = useCartStore((state) => state.clearCart);
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Ftafat?', [
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your Ftafat account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAccount();
              clearCart();
              await logout();
              router.replace('/(auth)/login');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const isRider = user?.role === 'delivery_partner';
  const isOwner = user?.role === 'restaurant_owner';
  const isAdmin = user?.role === 'admin';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Premium Deep Teal Header with Abstract Design */}
        <LinearGradient
          colors={['#064E3B', Colors.primary]}
          style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative Shapes */}
          <View style={styles.headerShape1} />
          <View style={styles.headerShape2} />
          <View style={styles.headerShape3} />

          <View style={styles.headerNav}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity onPress={() => router.push('/profile/edit')} style={styles.editBtn}>
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfoCore}>
            <View style={styles.avatarWrapper}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{user?.name ? user.name[0].toUpperCase() : 'U'}</Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || 'Ftafat User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '—'}</Text>
            {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.replace('_', ' ') || 'CUSTOMER'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content Body */}
        <View style={styles.bodyContainer}>

          {/* Quick Links Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(tabs)/orders')}>
              <View style={styles.statIconBox}>
                <Ionicons name="bag-handle-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(tabs)/saved')}>
              <View style={styles.statIconBox}>
                <Ionicons name="heart-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statLabel}>Favorites</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity style={styles.statBox} onPress={() => router.push('/notifications')}>
              <View style={styles.statIconBox}>
                <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
                <View style={styles.statBadge} />
              </View>
              <Text style={styles.statLabel}>Alerts</Text>
            </TouchableOpacity>
          </View>

          {/* Food & Activity Section */}
          <Text style={styles.sectionTitle}>Food & Activity</Text>
          <View style={styles.menuGroup}>
            <ProfileRow
              icon="location-outline"
              title="Manage Addresses"
              subtitle="Home, Work & other locations"
              onPress={() => router.push('/address')}
              iconColor="#0EA5E9"
              bgColor="#F0F9FF"
            />
            <View style={styles.menuDivider} />
            <ProfileRow
              icon="pricetag-outline"
              title="Coupons & Offers"
              subtitle="Vouchers and promotional codes"
              onPress={() => Alert.alert('Coupons', 'No active coupons at the moment.')}
              iconColor="#10B981"
              bgColor="#ECFDF5"
            />
            <View style={styles.menuDivider} />
            <ProfileRow
              icon="star-outline"
              title="My Reviews"
              subtitle="Ratings and feedback you provided"
              onPress={() => Alert.alert('Coming Soon', 'Your reviews will appear here.')}
              iconColor="#F59E0B"
              bgColor="#FEF3C7"
              hideBorder
            />
          </View>

          {/* Payments & Wallet Section */}
          <Text style={styles.sectionTitle}>Money & Payments</Text>
          <View style={styles.menuGroup}>
            <ProfileRow
              icon="wallet-outline"
              title="Ftafat Wallet"
              subtitle="Balance & gift cards"
              onPress={() => Alert.alert('Ftafat Wallet', 'Your wallet balance is ₹0')}
              iconColor="#8B5CF6"
              bgColor="#F5F3FF"
            />
            <View style={styles.menuDivider} />
            <ProfileRow
              icon="card-outline"
              title="Payment Modes"
              subtitle="Saved cards, UPI & more"
              onPress={() => Alert.alert('Payment Modes', 'Manage your saved cards and UPI IDs here (Coming soon).')}
              iconColor="#3B82F6"
              bgColor="#EFF6FF"
              hideBorder
            />
          </View>

          {/* Refer & Earn Banner */}
          <TouchableOpacity
            style={styles.referBanner}
            onPress={() => Alert.alert('Refer & Earn', 'Your referral code is FTAFAT150. Share it with friends!')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={styles.referGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.referContent}>
                <Text style={styles.referTitle}>Refer & Earn ₹150</Text>
                <Text style={styles.referSub}>Invite friends to Ftafat and earn rewards</Text>
              </View>
              <View style={styles.referIconBox}>
                <Ionicons name="sparkles-outline" size={28} color="#4F46E5" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Role-Specific Dashboard Banners */}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/(admin)/dashboard')}
              style={[styles.portalBanner, { backgroundColor: '#1E1B4B', borderColor: '#3730A3' }]}
            >
              <View style={styles.portalLeft}>
                <View style={[styles.portalIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#818CF8" />
                </View>
                <View>
                  <Text style={[styles.portalTitle, { color: '#E0E7FF' }]}>Super Admin Portal</Text>
                  <Text style={[styles.portalSub, { color: '#818CF8' }]}>Platform KPIs & Moderation</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#818CF8" />
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              onPress={() => router.push('/(owner)/dashboard')}
              style={[styles.portalBanner, { backgroundColor: '#431407', borderColor: '#7C2D12' }]}
            >
              <View style={styles.portalLeft}>
                <View style={[styles.portalIcon, { backgroundColor: 'rgba(234, 88, 12, 0.2)' }]}>
                  <Ionicons name="storefront-outline" size={24} color="#FB923C" />
                </View>
                <View>
                  <Text style={[styles.portalTitle, { color: '#FFEDD5' }]}>Restaurant Partner</Text>
                  <Text style={[styles.portalSub, { color: '#FB923C' }]}>Manage Kitchen & Menu</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#FB923C" />
            </TouchableOpacity>
          )}

          {isRider && (
            <TouchableOpacity
              onPress={() => router.push('/(rider)/dashboard')}
              style={[styles.portalBanner, { backgroundColor: '#082F49', borderColor: '#0C4A6E' }]}
            >
              <View style={styles.portalLeft}>
                <View style={[styles.portalIcon, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                  <Ionicons name="bicycle-outline" size={24} color="#38BDF8" />
                </View>
                <View>
                  <Text style={[styles.portalTitle, { color: '#E0F2FE' }]}>Delivery Partner</Text>
                  <Text style={[styles.portalSub, { color: '#38BDF8' }]}>Manage Runs & Earnings</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#38BDF8" />
            </TouchableOpacity>
          )}

          {/* General Settings */}
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.menuGroup}>
            <ProfileRow
              icon="document-text-outline"
              title="Terms & Privacy Policy"
              subtitle="Legal details and conditions"
              onPress={() => Alert.alert('Terms & Privacy', 'Our full terms and privacy policy will open in a browser.')}
              iconColor="#4F46E5"
              bgColor="#EEF2FF"
            />
            <View style={styles.menuDivider} />
            <ProfileRow
              icon="headset-outline"
              title="Help & Support"
              subtitle="24/7 Live chat & assistance"
              onPress={() => Alert.alert('Support', 'Contacting support...')}
              iconColor="#10B981"
              bgColor="#ECFDF5"
              hideBorder
            />
          </View>

          {/* Danger Zone */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.dangerGroup}>
            <TouchableOpacity onPress={handleLogout} style={styles.actionRow}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              </View>
              <Text style={styles.actionText}>Log Out</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity onPress={handleDeleteAccount} style={styles.actionRow}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>Ftafat v1.0.0</Text>

        </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ icon, title, subtitle, onPress, iconColor, bgColor, hideBorder = false }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.rowContainer} activeOpacity={0.7}>
      <View style={[styles.rowIconCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' }, // Softer neutral background
  scrollContainer: { flex: 1 },

  headerContainer: {
    paddingBottom: 45,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 10,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    overflow: 'hidden', // Keeps shapes inside the header
    position: 'relative',
  },
  headerShape1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerShape2: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerShape3: {
    position: 'absolute',
    bottom: -70,
    right: 50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Slight emerald tint glow
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: 24,
    color: '#FFFFFF',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInfoCore: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    ...Typography.heading,
    fontSize: 42,
    color: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  userName: {
    ...Typography.heading,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userPhone: {
    ...Typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  userEmail: {
    ...Typography.caption,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    ...Typography.label,
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    marginTop: -30,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  statBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  statLabel: {
    ...Typography.subtitle,
    fontSize: 13,
    color: '#475569',
  },

  sectionTitle: {
    ...Typography.label,
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 8,
    marginTop: 8,
  },

  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 58, // Align with text
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.subtitle,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 2,
  },
  rowSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: '#64748B',
  },

  referBanner: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  referGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    justifyContent: 'space-between',
  },
  referContent: {
    flex: 1,
    marginRight: 16,
  },
  referTitle: {
    ...Typography.heading,
    fontSize: 19,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  referSub: {
    ...Typography.body,
    fontSize: 13,
    color: '#E0E7FF',
    lineHeight: 18,
  },
  referIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  portalBanner: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  portalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  portalTitle: {
    ...Typography.heading,
    fontSize: 15,
    marginBottom: 2,
  },
  portalSub: {
    ...Typography.caption,
    fontSize: 12,
  },

  dangerGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
    ...Typography.subtitle,
    fontSize: 15,
    color: '#1E293B',
  },
  versionText: {
    textAlign: 'center',
    ...Typography.caption,
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  }
});
