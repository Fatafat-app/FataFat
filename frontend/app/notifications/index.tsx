import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/notification.store';
import { Notification } from '../../services/notification.service';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.type === 'order_status' && notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
    } else if (notification.type === 'order' && notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order_status':
      case 'order':
        return { name: 'fast-food' as const, bg: '#FFEDD5', color: '#EA580C' };
      case 'payment':
        return { name: 'card' as const, bg: '#DCFCE7', color: '#16A34A' };
      case 'offer':
      case 'promotion':
        return { name: 'pricetag' as const, bg: '#FCE7F3', color: '#DB2777' };
      case 'announcement':
        return { name: 'megaphone' as const, bg: '#EEF2FF', color: '#4F46E5' };
      case 'alert':
        return { name: 'warning' as const, bg: '#FEE2E2', color: '#DC2626' };
      default:
        return { name: 'notifications' as const, bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={styles.navTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadSub}>{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={16} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !refreshing && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications Yet"
            message="You're all caught up! Order status updates, offers, and announcements will appear here."
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {notifications.map((notification) => {
            const { name, bg, color } = getIconForType(notification.type);
            const isUnread = !notification.isRead;

            return (
              <TouchableOpacity
                key={notification._id}
                style={[styles.notificationCard, isUnread && styles.unreadCard]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconCircle, { backgroundColor: bg }]}>
                  <Ionicons name={name} size={20} color={color} />
                </View>

                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.body} numberOfLines={3}>
                    {notification.body}
                  </Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
                    {notification.type === 'order_status' && notification.data?.orderId ? (
                      <View style={styles.viewOrderTag}>
                        <Text style={styles.viewOrderText}>View Order</Text>
                        <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navTitle: { ...Typography.title, fontSize: 17 },
  unreadSub: { ...Typography.caption, color: Colors.primary, fontSize: 11, marginTop: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  markAllText: { ...Typography.button, color: Colors.primary, fontSize: 12 },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: 24,
  },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 10 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FFFDF9',
    borderColor: 'rgba(255, 96, 0, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  title: { ...Typography.title, fontSize: 14, color: '#1E293B', flex: 1, marginRight: 6 },
  unreadTitle: { color: '#0F172A', fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  body: { ...Typography.bodySmall, color: '#475569', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11 },
  viewOrderTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewOrderText: { ...Typography.caption, color: Colors.primary, fontWeight: '700', fontSize: 11 },
});
