import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { useLocationStore } from '../../store/location.store';
import { useOrderTrackingStore } from '../../store/orderTracking.store';
import { orderService } from '../../services/order.service';
import { addressService } from '../../services/address.service';
import { paymentService } from '../../services/payment.service';
import { formatPaise } from '../../utils/formatters';
import { Address, PaymentMethod } from '../../types';
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';

export default function OrderCheckoutScreen() {
  const { restaurant, items, updateQuantity, clearCart, getItemsTotal, getDeliveryFee, getGstAndTaxes, getPlatformFee, getGrandTotal } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const selectedAddress = useLocationStore((state) => state.selectedAddress);
  const setSelectedAddress = useLocationStore((state) => state.setSelectedAddress);
  const setActiveOrder = useOrderTrackingStore((state) => state.setActiveOrder);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const userAddresses = await addressService.getAddresses();
        setAddresses(userAddresses);
        if (userAddresses.length > 0 && !selectedAddress) {
          const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
          setSelectedAddress(defaultAddr);
        }
      } catch (err) {
        console.warn('Could not load addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchUserAddresses();
  }, []);

  const itemsTotal = getItemsTotal();
  const deliveryFee = getDeliveryFee();
  const taxes = getGstAndTaxes();
  const platformFee = getPlatformFee();
  const grandTotal = getGrandTotal();

  const handlePlaceOrder = async () => {
    if (!restaurant || items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items before placing order.');
      return;
    }

    const addressToUse: Address = selectedAddress || {
      _id: 'default-mock-id',
      type: 'Home',
      street: 'Flat 402, Sunshine Heights, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      location: { type: 'Point', coordinates: [77.2090, 28.6139] },
      isDefault: true,
    };

    try {
      setPlacingOrder(true);

      const orderPayload = {
        restaurantId: restaurant._id,
        items: items.map((i) => ({
          menuItemId: i.menuItem._id,
          quantity: i.quantity,
          selectedModifiers: i.selectedModifiers,
        })),
        deliveryAddress: addressToUse,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        paymentMethod,
      };

      const { order, payment } = await orderService.createOrder(orderPayload);

      if (paymentMethod === 'ONLINE') {
        // Razorpay flow should use the returned payment object containing razorpayOrderId
        // Mocking the razorpay flow since SDK is missing
        if (payment && payment.razorpayOrderId) {
          Alert.alert('Razorpay Frontend Blocked', 'Razorpay SDK is not installed in the frontend to process the order: ' + payment.razorpayOrderId);
        } else {
          Alert.alert('Payment Warning', 'Online payment initialized, but no Razorpay ID returned.');
        }
      }

      setActiveOrder(order);
      clearCart();

      Alert.alert('Order Placed! 🎉', `Order #${order.orderNumber} confirmed successfully.`, [
        { text: 'Track Order', onPress: () => router.replace('/(tabs)/orders') },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order';
      Alert.alert('Order Error', msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <EmptyState 
          icon="cart-outline" 
          title="Your Cart is Empty" 
          message="Explore delicious cuisines and add something yummy!" 
          actionText="Browse Restaurants"
          onAction={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={styles.navTitle}>{restaurant?.name || 'Checkout'}</Text>
            <Text style={styles.navSubtitle}>Review & Place Order</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardHeading}>ORDER ITEMS ({items.length})</Text>
          {items.map((item, idx) => (
            <View key={item.menuItem._id} style={[styles.itemRow, idx !== items.length - 1 && styles.itemRowBorder]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItem.name}</Text>
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <Text style={styles.itemModifiers}>{item.selectedModifiers.map(m => m.name).join(', ')}</Text>
                )}
                <Text style={styles.itemPrice}>{formatPaise(item.totalItemPrice)}</Text>
              </View>
              <View style={styles.counterBox}>
                <TouchableOpacity onPress={() => updateQuantity(item.menuItem._id, -1)} style={styles.counterBtn}>
                  <Ionicons name="remove" size={14} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.menuItem._id, 1)} style={styles.counterBtn}>
                  <Ionicons name="add" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.locationHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeading}>DELIVERY LOCATION</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/address')}>
              <Text style={{ ...Typography.button, color: Colors.primary, fontSize: 12 }}>Change</Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressBox}>
              <Text style={styles.addressType}>{selectedAddress.type} • {user?.name || 'Customer'}</Text>
              <Text style={styles.addressStreet}>{selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}</Text>
            </View>
          ) : (
            <View style={styles.addressBox}>
              <Text style={styles.addressType}>Default Location</Text>
              <Text style={styles.addressStreet}>Flat 402, Sunshine Heights, Connaught Place, New Delhi - 110001</Text>
            </View>
          )}
          <TextInput
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="Delivery instructions (e.g. Leave at door, don't ring bell)"
            style={styles.instructionInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>PAYMENT OPTION</Text>
          <TouchableOpacity onPress={() => setPaymentMethod('COD')} style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}>
            <View style={styles.paymentLeft}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
            </View>
            <Ionicons name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'} size={18} color={paymentMethod === 'COD' ? Colors.primary : '#9CA3AF'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethod('ONLINE')} style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]}>
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.paymentText}>Online Payment (Razorpay / UPI)</Text>
            </View>
            <Ionicons name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'} size={18} color={paymentMethod === 'ONLINE' ? Colors.primary : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginBottom: 90 }]}>
          <Text style={styles.cardHeading}>BILL DETAILS</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPaise(itemsTotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>{formatPaise(deliveryFee)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST & Restaurant Charges (5%)</Text>
            <Text style={styles.billValue}>{formatPaise(taxes)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>{formatPaise(platformFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>{formatPaise(grandTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
        <TouchableOpacity onPress={handlePlaceOrder} disabled={placingOrder} style={styles.placeOrderButton}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatPaise(grandTotal)}</Text>
          </View>
          {placingOrder ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.buttonActionRow}>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  navSubtitle: { ...Typography.bodySmall, fontSize: 11 },
  clearText: { ...Typography.label, color: Colors.error },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeading: { ...Typography.label, letterSpacing: 0.5, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.background },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { ...Typography.subtitle, fontSize: 14 },
  itemModifiers: { ...Typography.caption, color: Colors.primary, marginTop: 2 },
  itemPrice: { ...Typography.bodySmall, fontSize: 12, marginTop: 2 },
  counterBox: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: '#FED7AA', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  counterBtn: { paddingHorizontal: 6 },
  counterValue: { ...Typography.button, color: Colors.primary, fontSize: 13, paddingHorizontal: 6 },
  locationHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addressBox: { backgroundColor: Colors.background, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  addressType: { ...Typography.title, fontSize: 12, marginBottom: 2 },
  addressStreet: { ...Typography.bodySmall, fontSize: 12 },
  instructionInput: { ...Typography.bodySmall, marginTop: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.borderDark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text },
  paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, marginBottom: 8 },
  paymentOptionActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  paymentText: { ...Typography.subtitle, fontSize: 13 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel: { ...Typography.bodySmall },
  billValue: { ...Typography.subtitle, fontSize: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { ...Typography.title, fontSize: 14 },
  grandTotalValue: { ...Typography.heading, fontSize: 16, color: Colors.primary },
  bottomBarContainer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  placeOrderButton: { backgroundColor: Colors.primary, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  totalLabel: { ...Typography.bodySmall, color: Colors.white, opacity: 0.9 },
  totalAmount: { ...Typography.heading, color: Colors.white, fontSize: 17 },
  buttonActionRow: { flexDirection: 'row', alignItems: 'center' },
  placeOrderText: { ...Typography.button, marginRight: 6 },
});
