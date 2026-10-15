import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../services/order.service';
import { socketService } from '../../services/socket.service';
import { useOrderTrackingStore } from '../../store/orderTracking.store';
import { Order } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { ErrorState } from '../../components/ui/ErrorState';
import { OrderDetailSkeleton } from '../../components/ui/Skeleton';
import { useOrderDetailQuery, useCancelOrderMutation, useCancellationReasonsQuery } from '../../hooks';

const STATUS_STEPS = [
  { status: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle' as const },
  { status: 'PREPARING', label: 'Preparing', icon: 'flame' as const },
  { status: 'PICKED_UP', label: 'On The Way', icon: 'bicycle' as const },
  { status: 'DELIVERED', label: 'Delivered', icon: 'home' as const },
];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // TanStack Query: Cached & Deduped Order Details
  const {
    data: order,
    isLoading: loading,
    isError,
    error: orderErr,
    refetch: fetchOrderDetails,
  } = useOrderDetailQuery(id);
  const error = isError ? (orderErr as any)?.message || 'Unable to load this order.' : '';

  const cancelMutation = useCancelOrderMutation();

  // Socket state
  const activeOrder = useOrderTrackingStore((state) => state.activeOrder);
  const riderLocation = useOrderTrackingStore((state) => state.riderLocation);
  const updateOrderStatus = useOrderTrackingStore((state) => state.updateOrderStatus);

  useEffect(() => {
    let activeSocket: any = null;
    const isFinished = !order || ['DELIVERED', 'CANCELLED', 'REFUNDED', 'REJECTED', 'EXPIRED'].includes(
      (order.status || (order as any).orderStatus || '').toString().toUpperCase()
    );
    if (!isFinished && order?._id) {
      socketService.connect().then((sock) => {
        activeSocket = sock;
        socketService.joinOrderRoom(order._id);

        sock.on('order:rider_assigned', (data: any) => {
          if (data?.orderId === order._id || !data?.orderId) {
            fetchOrderDetails();
          }
        });

        sock.on('order:status_changed', (payload: any) => {
          if (payload?.orderId === order._id) {
            updateOrderStatus(payload.status);
            fetchOrderDetails();
          }
        });
      });
    }

    return () => {
      if (activeSocket) {
        activeSocket.off('order:rider_assigned');
        activeSocket.off('order:status_changed');
      }
      if (!isFinished && order?._id) {
        socketService.leaveOrderRoom(order._id);
      }
    };
  }, [order?._id]);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const { data: cancelReasons = [] } = useCancellationReasonsQuery('customer');

  const handleCancelOrder = () => {
    if (!order) return;
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async (reasonObj: { _id?: string; name: string }) => {
    if (!order) return;
    setCancelModalVisible(false);
    try {
      await cancelMutation.mutateAsync({
        orderId: order._id,
        reason: reasonObj.name,
        cancellationReasonId: reasonObj._id,
      });
      updateOrderStatus('CANCELLED');
      Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not cancel order');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Loading Order...</Text>
          <View style={{ width: 22 }} />
        </View>
        <OrderDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ErrorState title="Order Not Found" message={error} onRetry={fetchOrderDetails} />
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const rawDisplayStatus = (activeOrder && activeOrder._id === order._id) 
    ? (activeOrder.status || (activeOrder as any).orderStatus) 
    : (order.status || (order as any).orderStatus);
  const displayStatus = (rawDisplayStatus || 'PENDING').toString().toUpperCase();

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PAYMENT_PENDING':
      case 'PLACED':
      case 'PENDING':
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 0;
      case 'PREPARING':
      case 'READY':
      case 'READY_FOR_PICKUP':
        return 1;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(displayStatus);
  const isCancelled = ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(displayStatus);
  const isGroceryOrder = (order as any).vertical === 'grocery' || (order as any).orderType === 'grocery';
  const restName = isGroceryOrder
    ? 'Ftafat Fresh Grocery Mart'
    : (typeof (order as any).restaurant === 'object' && (order as any).restaurant !== null && (order as any).restaurant.name)
    || (typeof (order as any).vendor === 'object' && (order as any).vendor !== null && (order as any).vendor.name)
    || (typeof order.restaurantId === 'object' && order.restaurantId !== null && (order.restaurantId as any).name)
    || 'Partner Store';

  const assignedPartner = order.deliveryPartner || (order as any).deliveryPartnerId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Tracking Timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>ORDER TRACKING</Text>
            <View style={styles.timelineRow}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <View key={step.status} style={styles.timelineStep}>
                    <View style={[styles.stepCircle, isPassed && styles.stepCirclePassed, isCurrent && styles.stepCircleCurrent]}>
                      <Ionicons name={step.icon} size={16} color={isPassed || isCurrent ? '#FFF' : '#9CA3AF'} />
                    </View>
                    <Text style={[styles.stepLabel, isPassed && styles.stepLabelPassed, isCurrent && styles.stepLabelCurrent]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {riderLocation && activeOrder?._id === order._id && ['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(displayStatus) && (
              <View style={styles.riderAlertBox}>
                <Ionicons name="navigate" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.riderAlertText}>Delivery partner is arriving soon!</Text>
              </View>
            )}

            {['PENDING', 'CONFIRMED', 'PLACED', 'ACCEPTED'].includes(displayStatus) && (
              <TouchableOpacity onPress={handleCancelOrder} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Delivery Partner Assigned Card */}
        {assignedPartner && !isCancelled && (
          <View style={styles.riderCard}>
            <View style={styles.riderCardHeader}>
              <View style={styles.riderCardHeaderLeft}>
                <Ionicons name="bicycle" size={16} color="#2563EB" />
                <Text style={styles.riderCardHeading}>DELIVERY PARTNER</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            <View style={styles.riderCardBody}>
              <Image
                source={{
                  uri: assignedPartner.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
                }}
                style={styles.riderAvatar}
              />
              <View style={styles.riderInfo}>
                <Text style={styles.riderNameText}>{assignedPartner.name || 'Delivery Partner'}</Text>
                <Text style={styles.riderVehicleText}>
                  {assignedPartner.vehicle?.type?.toUpperCase() || (assignedPartner as any).vehicleDetails?.model || 'SCOOTER'} • {assignedPartner.vehicle?.licenseNumber || (assignedPartner as any).vehicleDetails?.plateNumber || 'Verified Partner'}
                </Text>
                <Text style={styles.riderStatusText}>
                  {displayStatus === 'OUT_FOR_DELIVERY' || displayStatus === 'PICKED_UP'
                    ? '🛵 Out for delivery to your location'
                    : 'Arriving at store to pick up food'}
                </Text>
              </View>

              {assignedPartner.phone ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${assignedPartner.phone}`)}
                  style={styles.callRiderBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.card, styles.cancelledCard]}>
            <Ionicons name="close-circle" size={32} color={Colors.error} />
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledSubtitle}>This order has been cancelled.</Text>
          </View>
        )}

        {/* Vendor / Restaurant Info */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{isGroceryOrder ? 'GROCERY STORE' : 'RESTAURANT'}</Text>
          <Text style={styles.restaurantName}>{restName}</Text>
          <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleString()}</Text>
        </View>

        {/* Items Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>ITEMS</Text>
          {order.items?.map((item, idx) => {
            const imageUrl = (item as any).menuItem?.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg';
            const isVeg = (item as any).menuItem?.isVeg;

            return (
              <View key={idx} style={[styles.itemRow, idx !== order.items.length - 1 && styles.itemBorder]}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                <View style={styles.itemMiddle}>
                  <View style={styles.itemNameRow}>
                    {isVeg !== undefined && (
                      <View style={[styles.vegSquare, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                        <View style={[styles.vegDot, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
                      </View>
                    )}
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatPaise(item.totalItemPrice || (item.price * item.quantity))}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>BILL DETAILS</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>
              {formatPaise(order.pricing?.itemsTotal ?? (order as any).pricing?.itemsPaise ?? (order as any).subtotal ?? 0)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {formatPaise(order.pricing?.deliveryFee ?? (order as any).pricing?.deliveryPaise ?? (order as any).deliveryFee ?? 0)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST</Text>
            <Text style={styles.billValue}>
              {formatPaise(order.pricing?.gstAndTaxes ?? (order as any).pricing?.taxPaise ?? (order as any).taxAmount ?? 0)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>
              {formatPaise(order.pricing?.platformFee ?? (order as any).pricing?.packagingPaise ?? 500)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>
              {formatPaise(order.pricing?.totalAmount ?? (order as any).pricing?.totalPaise ?? (order as any).totalAmount ?? 0)}
            </Text>
          </View>
        </View>

        {/* Delivery Details */}
        {order.deliveryAddress && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>DELIVERY DETAILS</Text>
            <View style={styles.addressBox}>
              <Text style={styles.addressType}>{order.deliveryAddress.label || 'Home'}</Text>
              <Text style={styles.addressStreet}>
                {order.deliveryAddress.line1 || (order.deliveryAddress as any).street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── CANCELLATION REASON MODAL ── */}
      <Modal visible={cancelModalVisible} transparent animationType="slide" onRequestClose={() => setCancelModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCancelModalVisible(false)}>
          <TouchableOpacity style={styles.cancelSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.cancelSheetTitle}>Reason for Cancellation</Text>
            <Text style={styles.cancelSheetSub}>Please select why you are cancelling this order:</Text>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {cancelReasons.map((r) => (
                <TouchableOpacity
                  key={r._id}
                  style={styles.reasonOption}
                  onPress={() => handleConfirmCancel(r)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="radio-button-off" size={18} color="#94A3B8" />
                  <Text style={styles.reasonOptionText}>{r.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setCancelModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Don't Cancel (Keep Order)</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  goBackButton: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  goBackText: { ...Typography.button, color: Colors.white },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeading: { ...Typography.label, letterSpacing: 0.5, marginBottom: 12, color: Colors.textSecondary },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingHorizontal: 4 },
  timelineStep: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepCirclePassed: { backgroundColor: Colors.success },
  stepCircleCurrent: { backgroundColor: Colors.primary },
  stepLabel: { ...Typography.caption, textAlign: 'center', fontSize: 10 },
  stepLabelPassed: { color: Colors.text },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '900' },
  riderAlertBox: { backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFEDD5' },
  riderAlertText: { ...Typography.subtitle, color: '#C2410C', fontSize: 12, flex: 1 },
  cancelButton: { backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', marginTop: 16 },
  cancelButtonText: { ...Typography.button, color: Colors.error },
  cancelledCard: { alignItems: 'center', paddingVertical: 24 },
  cancelledTitle: { ...Typography.heading, fontSize: 18, color: Colors.error, marginTop: 12 },
  cancelledSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  restaurantName: { ...Typography.title, fontSize: 18, marginBottom: 4 },
  dateText: { ...Typography.caption, color: Colors.textSecondary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: Colors.border },
  itemMiddle: { flex: 1, marginLeft: 12, marginRight: 8 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  vegSquare: { width: 12, height: 12, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { ...Typography.subtitle, fontSize: 14, flex: 1, color: Colors.text },
  itemQuantity: { ...Typography.caption, color: Colors.textSecondary },
  itemPrice: { ...Typography.title, fontSize: 14, color: Colors.text },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  billValue: { ...Typography.subtitle, fontSize: 13 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { ...Typography.title, fontSize: 15 },
  grandTotalValue: { ...Typography.heading, fontSize: 17, color: Colors.primary },
  addressBox: { backgroundColor: Colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  addressType: { ...Typography.title, fontSize: 13, marginBottom: 4 },
  addressStreet: { ...Typography.bodySmall, color: Colors.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  cancelSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  cancelSheetTitle: { ...Typography.heading, fontSize: 18, color: Colors.text, marginBottom: 4 },
  cancelSheetSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 16 },
  reasonOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  reasonOptionText: { ...Typography.body, fontSize: 14, color: Colors.text, marginLeft: 10, flex: 1 },
  closeModalBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  closeModalBtnText: { ...Typography.button, color: '#64748B', fontSize: 13 },

  /* Delivery Partner Card Styles */
  riderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  riderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  riderCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  riderCardHeading: { ...Typography.label, letterSpacing: 0.5, color: '#1E40AF', fontSize: 11, fontWeight: '700' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, gap: 3 },
  verifiedText: { ...Typography.caption, fontSize: 10, color: '#15803D', fontWeight: '700' },

  riderCardBody: { flexDirection: 'row', alignItems: 'center' },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#3B82F6', marginRight: 12 },
  riderInfo: { flex: 1 },
  riderNameText: { ...Typography.title, fontSize: 15, color: '#0F172A', fontWeight: '700' },
  riderVehicleText: { ...Typography.caption, color: '#64748B', fontSize: 11, marginTop: 2 },
  riderStatusText: { ...Typography.bodySmall, color: '#2563EB', fontSize: 11, fontWeight: '600', marginTop: 3 },

  callRiderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
});
