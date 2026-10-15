import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRiderStore } from '../../store/rider.store';
import { useAuthStore } from '../../store/auth.store';
import { socketService } from '../../services/socket.service';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import * as Location from 'expo-location';

export default function RiderDashboardScreen() {
  const {
    partner,
    isLoading,
    fetchProfile,
    toggleOnline,
    updateLiveLocation,
    availableOrders,
    fetchAvailableOrders,
    acceptOrder,
    removeClaimedOrder,
    addAvailableOrder,
  } = useRiderStore();
  const user = useAuthStore((state) => state.user);
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);
  
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchAvailableOrders();
    // Poll available orders every 7 seconds for live updates
    const pollInterval = setInterval(() => {
      fetchAvailableOrders();
    }, 7000);
    return () => {
      clearInterval(pollInterval);
      stopLocationInterval();
    };
  }, []);

  useEffect(() => {
    // Start interval when online
    if (partner?.isOnline) {
      startLocationInterval();
      fetchAvailableOrders();
    } else {
      stopLocationInterval();
    }
  }, [partner?.isOnline]);

  useEffect(() => {
    let activeSocket: any = null;

    const startSocketListeners = async () => {
      activeSocket = await socketService.connect();
      
      // When a new order is placed and waiting for a rider
      activeSocket.on('delivery:order_available', (data: any) => {
        addAvailableOrder(data);
      });

      // When another rider claims an order, remove it immediately in real-time
      activeSocket.on('delivery:order_claimed', ({ orderId }: { orderId: string }) => {
        removeClaimedOrder(orderId);
      });

      // When order is directly assigned
      activeSocket.on('delivery:order_assigned', (data: any) => {
        Alert.alert(
          'New Delivery Request 🚨',
          `You have been assigned an order from ${data.restaurant?.name || 'Restaurant'}. Pickup location is nearby!`,
          [
            { text: 'View Route', onPress: () => router.push('/(rider)/delivery') }
          ]
        );
        fetchProfile();
      });
    };

    startSocketListeners();

    return () => {
      if (activeSocket) {
        activeSocket.off('delivery:order_available');
        activeSocket.off('delivery:order_claimed');
        activeSocket.off('delivery:order_assigned');
      }
    };
  }, []);

  const startLocationInterval = () => {
    if (!locationIntervalRef.current) {
      // Fire immediately then every 30 seconds
      updateLiveLocation();
      locationIntervalRef.current = setInterval(updateLiveLocation, 30000);
    }
  };

  const stopLocationInterval = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const handleOnlineToggle = async () => {
    if (!partner?.isOnline) {
      // Trying to go online
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to receive nearby orders.');
          return;
        }
      }
    }
    await toggleOnline();
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setAcceptingId(orderId);
      const success = await acceptOrder(orderId);
      if (success) {
        Alert.alert('Order Accepted! 🚀', 'Heading to delivery route screen.', [
          { text: 'Start Pickup', onPress: () => router.push('/(rider)/delivery') }
        ]);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchProfile(), fetchAvailableOrders()]);
  };

  if (isLoading && !partner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const isOnline = partner?.isOnline ?? false;
  const earningsToday = partner?.earnings?.today || 0;
  const completedDeliveries = partner?.stats?.completedDeliveries || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Premium Header */}
      <View style={styles.headerPremium}>
        <View style={styles.headerTopRow}>
          <View style={styles.riderProfileBox}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg' }} 
              style={styles.avatarImage} 
            />
            <View>
              <Text style={styles.greetingText}>Hello,</Text>
              <Text style={styles.riderName}>{user?.name || 'Rider'}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.switchModeButton}
          >
            <Ionicons name="apps" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.switchModeText}>User App</Text>
          </TouchableOpacity>
        </View>

        {/* Status Toggle Card - Elevated */}
        <View style={styles.statusElevatedCard}>
          <View style={styles.statusInfoBox}>
            <View style={[styles.statusGlowDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444', shadowColor: isOnline ? '#10B981' : '#EF4444' }]} />
            <View>
              <Text style={[styles.statusTitle, { color: isOnline ? '#065F46' : '#991B1B' }]}>
                {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Waiting for nearby orders' : 'Go online to get deliveries'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleOnlineToggle}
            trackColor={{ false: '#FECACA', true: '#6EE7B7' }}
            thumbColor={isOnline ? '#10B981' : '#F87171'}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#2563EB']} />}
      >
        {/* Active Order Alert */}
        {partner?.activeOrder && (
          <TouchableOpacity
            onPress={() => router.push('/(rider)/delivery')}
            style={styles.activeAlertCard}
            activeOpacity={0.9}
          >
            <View style={styles.alertLeft}>
              <View style={styles.alertPulseCircle}>
                <Ionicons name="bicycle" size={24} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.alertHeading}>Active Delivery!</Text>
                <Text style={styles.alertSub}>Tap to view pickup details</Text>
              </View>
            </View>
            <View style={styles.alertActionBtn}>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Live Available Orders Feed */}
        {!partner?.activeOrder && (
          <View style={styles.ordersFeedSection}>
            <View style={styles.feedHeaderRow}>
              <View style={styles.feedTitleContainer}>
                <View style={[styles.radarPulseDot, !isOnline && { backgroundColor: '#94A3B8' }]} />
                <Text style={styles.sectionTitleBold}>LIVE ORDERS NEARBY</Text>
              </View>
              <View style={[styles.liveBadge, !isOnline && styles.offlineBadge]}>
                <Text style={[styles.liveBadgeText, !isOnline && styles.offlineBadgeText]}>
                  {availableOrders.length} {availableOrders.length === 1 ? 'ORDER' : 'ORDERS'}
                </Text>
              </View>
            </View>

            {!isOnline && (
              <TouchableOpacity onPress={handleOnlineToggle} style={styles.offlineNoticeBanner} activeOpacity={0.8}>
                <Ionicons name="power" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.offlineNoticeText}>
                  You are currently OFFLINE. Tap here or switch toggle to go online & accept orders!
                </Text>
              </TouchableOpacity>
            )}

            {availableOrders.length === 0 ? (
              <View style={styles.emptyFeedCard}>
                <View style={[styles.emptyRadarIconCircle, !isOnline && { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name={isOnline ? "radio" : "cloud-offline"} size={30} color={isOnline ? "#3B82F6" : "#64748B"} />
                </View>
                <Text style={styles.emptyFeedTitle}>
                  {isOnline ? 'Searching for nearby orders...' : 'No orders available yet'}
                </Text>
                <Text style={styles.emptyFeedSubtitle}>
                  {isOnline
                    ? "You're online and visible. New customer orders will pop up here in real-time!"
                    : "Turn your status ONLINE to receive incoming delivery requests."}
                </Text>
              </View>
            ) : (
              availableOrders.map((order: any) => {
                const orderId = order._id || order.id || order.orderId;
                const isAcceptingThis = acceptingId === orderId;
                const restName = order.restaurantName || order.restaurant?.name || 'Restaurant Partner';
                const restAddr = order.restaurantAddress || order.restaurant?.address?.street || order.restaurant?.address?.line1 || order.restaurant?.address?.city || 'Local Kitchen';
                const dropAddr = order.deliveryAddress?.line1 || order.deliveryAddress?.street || (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : 'Customer Address');
                const payoutPaise = order.deliveryFee || 4000;
                const itemsCount = order.itemsCount || order.items?.length || 1;
                const totalAmountPaise = order.totalAmount || order.pricing?.totalAmount || 0;

                return (
                  <View key={orderId} style={styles.orderAvailableCard}>
                    {/* Card Top: Order Number & Payout */}
                    <View style={styles.orderCardTopRow}>
                      <View style={styles.orderNumTag}>
                        <Text style={styles.orderNumText}>
                          #{order.orderNumber || String(orderId).slice(-6).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.payoutBadge}>
                        <Text style={styles.payoutLabel}>YOU EARN</Text>
                        <Text style={styles.payoutAmount}>{formatPaise(payoutPaise)}</Text>
                      </View>
                    </View>

                    {/* Route Details */}
                    <View style={styles.routeContainer}>
                      {/* Pickup */}
                      <View style={styles.routePointRow}>
                        <View style={[styles.routeIconDot, { backgroundColor: '#F59E0B' }]}>
                          <Ionicons name="storefront" size={12} color="#FFF" />
                        </View>
                        <View style={styles.routeTextContainer}>
                          <Text style={styles.routePointTitle} numberOfLines={1}>{restName}</Text>
                          <Text style={styles.routePointSub} numberOfLines={1}>{restAddr}</Text>
                        </View>
                      </View>

                      {/* Route Line */}
                      <View style={styles.routeDottedLine} />

                      {/* Drop */}
                      <View style={styles.routePointRow}>
                        <View style={[styles.routeIconDot, { backgroundColor: '#10B981' }]}>
                          <Ionicons name="location" size={12} color="#FFF" />
                        </View>
                        <View style={styles.routeTextContainer}>
                          <Text style={styles.routePointTitle}>Delivery Location</Text>
                          <Text style={styles.routePointSub} numberOfLines={1}>{dropAddr}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Order Meta */}
                    <View style={styles.orderMetaBar}>
                      <View style={styles.orderMetaItem}>
                        <Ionicons name="fast-food-outline" size={14} color="#64748B" />
                        <Text style={styles.orderMetaText}>{itemsCount} items</Text>
                      </View>
                      <View style={styles.orderMetaItem}>
                        <Ionicons name="card-outline" size={14} color="#64748B" />
                        <Text style={styles.orderMetaText}>{formatPaise(totalAmountPaise)} order</Text>
                      </View>
                    </View>

                    {/* Accept Action Button */}
                    <TouchableOpacity
                      onPress={() => {
                        if (!isOnline) {
                          handleOnlineToggle();
                        } else {
                          handleAcceptOrder(orderId);
                        }
                      }}
                      disabled={isAcceptingThis || (isOnline && acceptingId !== null)}
                      style={[
                        styles.acceptOrderBtn,
                        !isOnline && styles.acceptOrderBtnOffline,
                        isAcceptingThis && styles.acceptOrderBtnDisabled,
                      ]}
                      activeOpacity={0.8}
                    >
                      {isAcceptingThis ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : !isOnline ? (
                        <>
                          <Ionicons name="power" size={16} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.acceptOrderBtnText}>GO ONLINE TO ACCEPT</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="flash" size={18} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.acceptOrderBtnText}>ACCEPT DELIVERY ⚡</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Premium Dashboard Metrics */}
        <Text style={styles.sectionTitle}>TODAY'S INSIGHTS</Text>
        <View style={styles.metricsGrid}>
          {/* Earnings */}
          <View style={styles.metricCardBig}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabelBig}>Earnings</Text>
              <Ionicons name="wallet" size={20} color="#16A34A" />
            </View>
            <Text style={styles.metricValueBig}>{formatPaise(earningsToday)}</Text>
            <Text style={styles.metricGrowthText}>+12% from yesterday</Text>
          </View>

          {/* Deliveries */}
          <View style={styles.metricCardBig}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabelBig}>Deliveries</Text>
              <Ionicons name="cube" size={20} color="#2563EB" />
            </View>
            <Text style={styles.metricValueBig}>{completedDeliveries}</Text>
            <Text style={styles.metricGrowthText}>100% acceptance rate</Text>
          </View>
        </View>

        {/* Small Metrics Row */}
        <View style={styles.smallMetricsRow}>
          <View style={styles.smallMetricBox}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.smallMetricVal}>4.2h</Text>
            <Text style={styles.smallMetricName}>Online Time</Text>
          </View>
          <View style={styles.smallMetricBox}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.smallMetricVal}>{partner?.stats?.rating?.toFixed(1) || '4.9'}</Text>
            <Text style={styles.smallMetricName}>Rating</Text>
          </View>
          <View style={styles.smallMetricBox}>
            <Ionicons name="speedometer" size={20} color="#8B5CF6" />
            <Text style={styles.smallMetricVal}>N/A</Text>
            <Text style={styles.smallMetricName}>Avg Time</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.cardHeader}>VEHICLE INFORMATION</Text>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="bicycle-outline" size={18} color="#4B5563" style={{ marginRight: 8 }} />
              <Text style={styles.settingLabel}>Vehicle Type</Text>
            </View>
            <Text style={styles.settingValue}>{partner?.vehicle?.type?.toUpperCase() || 'SCOOTER'}</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={18} color="#4B5563" style={{ marginRight: 8 }} />
              <Text style={styles.settingLabel}>License Number</Text>
            </View>
            <Text style={styles.settingValue}>{partner?.vehicle?.licenseNumber || 'DL-01-XX-9999'}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  
  headerPremium: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 45,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  riderProfileBox: { flexDirection: 'row', alignItems: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#38BDF8', marginRight: 12 },
  greetingText: { ...Typography.bodySmall, color: '#94A3B8', fontSize: 13 },
  riderName: { ...Typography.heading, color: '#FFFFFF', fontSize: 20 },
  
  switchModeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  switchModeText: { ...Typography.button, fontSize: 12, color: '#FFFFFF' },

  statusElevatedCard: {
    position: 'absolute',
    bottom: -35,
    alignSelf: 'center',
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  statusInfoBox: { flexDirection: 'row', alignItems: 'center' },
  statusGlowDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 5 },
  statusTitle: { ...Typography.button, fontSize: 14, letterSpacing: 0.5 },
  statusSubtitle: { ...Typography.bodySmall, fontSize: 12, color: '#64748B', marginTop: 2 },

  scrollContainer: { flex: 1, marginTop: 45 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  activeAlertCard: { backgroundColor: '#3B82F6', borderRadius: 24, padding: 18, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  alertLeft: { flexDirection: 'row', alignItems: 'center' },
  alertPulseCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  alertHeading: { ...Typography.title, fontSize: 16, color: '#FFFFFF' },
  alertSub: { ...Typography.bodySmall, color: '#E0E7FF', marginTop: 2 },
  alertActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { ...Typography.label, fontSize: 12, letterSpacing: 1, color: '#64748B', marginBottom: 16, marginTop: 8 },
  
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricCardBig: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  metricHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  metricLabelBig: { ...Typography.bodySmall, color: '#64748B', fontSize: 13 },
  metricValueBig: { ...Typography.heading, fontSize: 26, color: '#0F172A', marginBottom: 4 },
  metricGrowthText: { ...Typography.caption, color: '#10B981', fontWeight: '600' },

  smallMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  smallMetricBox: { width: '31%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  smallMetricVal: { ...Typography.title, fontSize: 16, color: '#0F172A', marginTop: 8, marginBottom: 2 },
  smallMetricName: { ...Typography.caption, color: '#64748B' },

  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { ...Typography.label, fontSize: 11, letterSpacing: 0.5, color: '#64748B', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingLabel: { ...Typography.bodySmall, fontSize: 14, color: '#475569' },
  settingValue: { ...Typography.button, fontSize: 14, color: '#0F172A' },

  /* Live Feed Styles */
  ordersFeedSection: { marginBottom: 24 },
  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  feedTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  radarPulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 8 },
  sectionTitleBold: { ...Typography.label, fontSize: 13, letterSpacing: 0.8, color: '#0F172A', fontWeight: '700' },
  liveBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#86EFAC' },
  liveBadgeText: { ...Typography.caption, color: '#166534', fontWeight: '700', fontSize: 11 },
  offlineBadge: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  offlineBadgeText: { color: '#64748B' },

  offlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  offlineNoticeText: { ...Typography.caption, color: '#B91C1C', flex: 1, fontWeight: '600', fontSize: 12 },

  emptyFeedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyRadarIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyFeedTitle: { ...Typography.title, fontSize: 15, color: '#1E293B', marginBottom: 4 },
  emptyFeedSubtitle: { ...Typography.bodySmall, fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },

  orderAvailableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  orderCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  orderNumTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderNumText: { ...Typography.caption, fontWeight: '700', color: '#334155', letterSpacing: 0.5 },
  payoutBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignItems: 'flex-end', borderWidth: 1, borderColor: '#A7F3D0' },
  payoutLabel: { ...Typography.caption, fontSize: 9, color: '#059669', fontWeight: '800' },
  payoutAmount: { ...Typography.heading, fontSize: 18, color: '#047857' },

  routeContainer: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginBottom: 12 },
  routePointRow: { flexDirection: 'row', alignItems: 'center' },
  routeIconDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  routeTextContainer: { flex: 1 },
  routePointTitle: { ...Typography.title, fontSize: 13, color: '#0F172A' },
  routePointSub: { ...Typography.bodySmall, fontSize: 11, color: '#64748B' },
  routeDottedLine: { width: 2, height: 14, backgroundColor: '#CBD5E1', marginLeft: 10, marginVertical: 3 },

  orderMetaBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 14 },
  orderMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderMetaText: { ...Typography.caption, color: '#64748B', fontSize: 12 },

  acceptOrderBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptOrderBtnOffline: { backgroundColor: '#475569', shadowColor: '#475569' },
  acceptOrderBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  acceptOrderBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 14, letterSpacing: 0.5 },
});
