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
import { formatPaise } from '../../utils/formatters';
import { Address, PaymentMethod } from '../../types';

export default function OrderCheckoutScreen() {
  const { restaurant, items, updateQuantity, clearCart, getItemsTotal, getDeliveryFee, getGstAndTaxes, getPlatformFee, getGrandTotal } =
    useCartStore();
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
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
      },
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

      const placedOrder = await orderService.createOrder(orderPayload);
      setActiveOrder(placedOrder);
      clearCart();

      Alert.alert('Order Placed! 🎉', `Order #${placedOrder.orderNumber} confirmed successfully.`, [
        {
          text: 'Track Order',
          onPress: () => router.replace('/(tabs)/orders'),
        },
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
        <Ionicons name="cart-outline" size={72} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Explore delicious cuisines and add something yummy!
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.browseButton}
        >
          <Text style={styles.browseButtonText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
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
        {/* Cart Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>ORDER ITEMS ({items.length})</Text>

          {items.map((item, idx) => (
            <View
              key={item.menuItem._id}
              style={[
                styles.itemRow,
                idx !== items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItem.name}</Text>
                <Text style={styles.itemPrice}>{formatPaise(item.totalItemPrice)}</Text>
              </View>

              {/* Quantity Counter */}
              <View style={styles.counterBox}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.menuItem._id, -1)}
                  style={styles.counterBtn}
                >
                  <Ionicons name="remove" size={14} color="#FF6000" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.menuItem._id, 1)}
                  style={styles.counterBtn}
                >
                  <Ionicons name="add" size={14} color="#FF6000" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.locationHeaderRow}>
            <Ionicons name="location" size={18} color="#FF6000" style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>DELIVERY LOCATION</Text>
          </View>

          {selectedAddress ? (
            <View style={styles.addressBox}>
              <Text style={styles.addressType}>
                {selectedAddress.type} • {user?.name || 'Customer'}
              </Text>
              <Text style={styles.addressStreet}>
                {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}
              </Text>
            </View>
          ) : (
            <View style={styles.addressBox}>
              <Text style={styles.addressType}>Default Location</Text>
              <Text style={styles.addressStreet}>
                Flat 402, Sunshine Heights, Connaught Place, New Delhi - 110001
              </Text>
            </View>
          )}

          {/* Delivery Instructions */}
          <TextInput
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="Delivery instructions (e.g. Leave at door, don't ring bell)"
            style={styles.instructionInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Payment Method Selection */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>PAYMENT OPTION</Text>

          <TouchableOpacity
            onPress={() => setPaymentMethod('COD')}
            style={[
              styles.paymentOption,
              paymentMethod === 'COD' && styles.paymentOptionActive,
            ]}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="cash-outline" size={20} color="#FF6000" style={{ marginRight: 8 }} />
              <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
            </View>
            <Ionicons
              name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={paymentMethod === 'COD' ? '#FF6000' : '#9CA3AF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('ONLINE')}
            style={[
              styles.paymentOption,
              paymentMethod === 'ONLINE' && styles.paymentOptionActive,
            ]}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color="#FF6000" style={{ marginRight: 8 }} />
              <Text style={styles.paymentText}>Online Payment (Razorpay / UPI)</Text>
            </View>
            <Ionicons
              name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={paymentMethod === 'ONLINE' ? '#FF6000' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {/* Bill Summary */}
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

      {/* Floating Bottom Place Order Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          style={styles.placeOrderButton}
        >
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#FF6000',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#FF6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },
  navSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4B5563',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  counterBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterBtn: {
    paddingHorizontal: 6,
  },
  counterValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FF6000',
    paddingHorizontal: 6,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  addressType: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  addressStreet: {
    fontSize: 12,
    color: '#4B5563',
  },
  instructionInput: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#1F2937',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  paymentOptionActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF6000',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF6000',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  placeOrderButton: {
    backgroundColor: '#FF6000',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#FF6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  buttonActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 6,
  },
});
