import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, Notification } from '../../services/notification.service';
import { Typography, Colors } from '../../constants/Theme';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(1, 50);
      setNotifications(data.notifications);
    } catch (err) {
      // Silently fail or show toast
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (err) {
        // ignore failure to mark read
      }
    }

    if (notification.type === 'order_status') {
      router.push(`/order/${notification.data.orderId}`);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order_status': return 'fast-food-outline';
      case 'payment': return 'card-outline';
      case 'offer': return 'pricetag-outline';
      case 'promotion': return 'gift-outline';
      case 'announcement': return 'megaphone-outline';
      case 'alert': return 'warning-outline';
      default: return 'notifications-outline';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Notifications</Text>
        </View>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <Loading message="Loading notifications..." />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState 
            icon="notifications-off-outline" 
            title="No Notifications" 
            message="You're all caught up! There are no new notifications." 
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {notifications.map((notification) => (
            <TouchableOpacity 
              key={notification._id} 
              style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={[styles.iconCircle, !notification.isRead && styles.unreadIconCircle]}>
                <Ionicons name={getIconForType(notification.type) as any} size={20} color={!notification.isRead ? Colors.primary : Colors.textSecondary} />
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, !notification.isRead && styles.unreadText]}>{notification.title}</Text>
                <Text style={styles.body}>{notification.body}</Text>
                <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
              </View>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  markAllText: { ...Typography.button, color: Colors.primary, fontSize: 13 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, padding: 24 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  notificationCard: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  unreadCard: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  unreadIconCircle: { backgroundColor: '#FFF' },
  content: { flex: 1, paddingRight: 8 },
  title: { ...Typography.title, fontSize: 15, marginBottom: 4 },
  unreadText: { color: Colors.primary },
  body: { ...Typography.bodySmall, color: Colors.text, marginBottom: 6 },
  time: { ...Typography.caption, color: Colors.textSecondary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, alignSelf: 'center' },
});
