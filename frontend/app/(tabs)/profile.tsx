import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { userService } from '../../services/user.service';
import { Typography, BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';

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
        {/* Premium Dark Header */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerGlow1} />
          <View style={styles.headerGlow2} />
          
          <View style={styles.headerNav}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity onPress={() => router.push('/profile/edit')} style={styles.editBtn}>
              <Ionicons name="pencil" size={16} color="#FFF" />
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
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            </View>
            <Text style={styles.premiumName}>{user?.name || 'Ftafat User'}</Text>
            <Text style={styles.premiumPhone}>{user?.phone || '—'}</Text>
            {user?.email ? <Text style={styles.premiumEmail}>{user.email}</Text> : null}
            
            <View style={styles.roleBadgePremium}>
              <Text style={styles.roleTextPremium}>{user?.role?.replace('_', ' ') || 'CUSTOMER'}</Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.bodyContainer}>
          
          {/* Quick Stats/Links Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => router.push('/address')}>
              <Ionicons name="location" size={24} color="#D94E1B" />
              <Text style={styles.statLabel}>Addresses</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statBox} onPress={() => router.push('/notifications')}>
              <View>
                <Ionicons name="notifications" size={24} color="#D94E1B" />
                <View style={styles.statBadge} />
              </View>
              <Text style={styles.statLabel}>Alerts</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statBox} onPress={() => {}}>
              <Ionicons name="wallet" size={24} color="#D94E1B" />
              <Text style={styles.statLabel}>Wallet</Text>
            </TouchableOpacity>
          </View>

          {/* Role-Specific Dashboard Banners */}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/(admin)/dashboard')}
              style={[styles.portalBanner, { backgroundColor: '#1E1B4B', borderColor: '#3730A3' }]}
            >
              <View style={styles.portalLeft}>
                <View style={[styles.portalIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#818CF8" />
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
                  <Ionicons name="storefront" size={22} color="#FB923C" />
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
                  <Ionicons name="bicycle" size={22} color="#38BDF8" />
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
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>General</Text>
          </View>
          
          <View style={styles.menuCard}>
            <ProfileRow
              icon="document-text-outline"
              title="Terms & Privacy Policy"
              subtitle="Legal details and conditions"
              onPress={() => {}}
              iconColor="#4F46E5"
              bgColor="#EEF2FF"
            />
            <View style={styles.menuDivider} />
            <ProfileRow
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="24/7 Live chat & assistance"
              onPress={() => {}}
              iconColor="#10B981"
              bgColor="#ECFDF5"
              hideBorder
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity onPress={handleLogout} style={styles.actionRow}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.actionText}>Log Out</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity onPress={handleDeleteAccount} style={styles.actionRow}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <Text style={[styles.actionText, { color: '#DC2626' }]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
    <TouchableOpacity onPress={onPress} style={styles.rowContainer}>
      <View style={[styles.rowIconCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContainer: { flex: 1 },
  headerContainer: {
    backgroundColor: '#0F172A',
    paddingBottom: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlow1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(217, 78, 27, 0.2)', // Ftafat Orange glow
    transform: [{ scaleX: 2 }],
  },
  headerGlow2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: BOLD_FONT,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#D94E1B',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#D94E1B',
  },
  avatarInitial: {
    fontSize: 40,
    fontFamily: BOLD_FONT,
    color: '#D94E1B',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  premiumName: {
    fontSize: 24,
    fontFamily: BOLD_FONT,
    color: '#FFF',
    marginBottom: 4,
  },
  premiumPhone: {
    fontSize: 14,
    fontFamily: STYLISH_FONT,
    fontWeight: '600',
    color: '#94A3B8',
  },
  premiumEmail: {
    fontSize: 13,
    fontFamily: STYLISH_FONT,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadgePremium: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleTextPremium: {
    fontSize: 10,
    fontFamily: BOLD_FONT,
    color: '#FFF',
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
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
  },
  statBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
    marginTop: 8,
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
    fontSize: 15,
    fontFamily: BOLD_FONT,
    marginBottom: 2,
  },
  portalSub: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    fontWeight: '500',
  },
  sectionTitleRow: {
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
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
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
  }
});
