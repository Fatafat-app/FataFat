import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRiderStore } from '../../store/rider.store';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

export default function RiderHistoryScreen() {
  const { history, isLoading, fetchHistory } = useRiderStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => fetchHistory();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <Text style={styles.pageTitle}>Earnings & History</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>TOTAL LIFETIME EARNINGS</Text>
          <Text style={styles.earningsValue}>
            {formatPaise(history?.partnerEarnings?.total || 0)}
          </Text>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsRow}>
            <View>
              <Text style={styles.earningsSubLabel}>Pending Payout</Text>
              <Text style={styles.earningsSubValue}>{formatPaise(history?.partnerEarnings?.pendingPayout || 0)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.earningsSubLabel}>Total Trips</Text>
              <Text style={styles.earningsSubValue}>{history?.partnerStats?.completedDeliveries || 0}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PAST DELIVERIES</Text>

        {!history?.orders || history.orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="list-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No History</Text>
            <Text style={styles.emptySubtitle}>Completed orders will appear here.</Text>
          </View>
        ) : (
          history.orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>DELIVERED</Text>
                </View>
              </View>
              
              <Text style={styles.restaurantName}>
                {typeof order.restaurant === 'object' ? order.restaurant.name : 'Restaurant'}
              </Text>
              
              <View style={styles.orderFooter}>
                <Text style={styles.dateText}>
                  {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.earnedText}>+ {formatPaise(order.deliveryFee || 4000)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center' },
  pageTitle: { ...Typography.heading, fontSize: 18 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 },
  earningsCard: { backgroundColor: '#1E3A8A', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  earningsLabel: { ...Typography.label, fontSize: 10, color: '#93C5FD' },
  earningsValue: { ...Typography.heading, fontSize: 32, color: Colors.white, marginTop: 4, marginBottom: 16 },
  earningsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  earningsSubLabel: { ...Typography.button, fontSize: 11, color: '#93C5FD' },
  earningsSubValue: { ...Typography.heading, fontSize: 16, color: Colors.white, marginTop: 4 },
  sectionTitle: { ...Typography.label, fontSize: 11, marginBottom: 10, color: Colors.textSecondary },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  emptySubtitle: { ...Typography.caption, marginTop: 4 },
  orderCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { ...Typography.title, fontSize: 14 },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { ...Typography.label, fontSize: 9, color: '#16A34A' },
  restaurantName: { ...Typography.bodySmall, fontSize: 13, color: Colors.text },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.background },
  dateText: { ...Typography.caption, fontSize: 11 },
  earnedText: { ...Typography.button, fontSize: 14, color: '#2563EB' },
});
