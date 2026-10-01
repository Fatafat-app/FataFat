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
  Platform,
  Image,
  Modal,
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
import { Typography, Colors } from '../../constants/Theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { useGroceryStore } from '../../store/grocery.store';
import { useConfigStore } from '../../store/config.store';
import { GroceryCart } from '../../components/grocery/GroceryCart';

export default function CartScreen() {
  const activeSection = useGroceryStore((state) => state.activeSection);
  const groceryCart = useGroceryStore((state) => state.cart);
  const foodItems = useCartStore((state) => state.items);

  const isFoodAvailable = useConfigStore((state) => state.isVerticalAvailable('food'));
  const foodMode = useConfigStore((state) => state.config?.verticals?.food?.mode || 'ON');
  const isFoodEnabled = isFoodAvailable && foodMode !== 'OFF';

  const isGroceryAvailable = useConfigStore((state) => state.isVerticalAvailable('grocery'));
  const groceryMode = useConfigStore((state) => state.config?.verticals?.grocery?.mode || 'ON');
  const isGroceryEnabled = isGroceryAvailable && groceryMode !== 'OFF';

  if (!isFoodEnabled && !isGroceryEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="cloud-offline" size={36} color="#DC2626" />
        </View>
        <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: '#1E293B', textAlign: 'center' }}>Ordering Currently Offline</Text>
        <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6 }}>
          Deliveries are temporarily paused. We'll be back shortly!
        </Text>
      </SafeAreaView>
    );
  }

  if (isGroceryEnabled && (!isFoodEnabled || activeSection === 'grocery' || (groceryCart.length > 0 && foodItems.length === 0))) {
    return <GroceryCart />;
  }

  return <FoodCartContent />;
}

function FoodCartContent() {
  const {
    restaurant,
    items,
    updateQuantity,
    clearCart,
    getItemsTotal,
    getDeliveryFee,
    getGstAndTaxes,
    getPlatformFee,
    getPackagingFee,
    getSurgeFee,
    getCustomFeesTotal,
    getGrandTotal,
    feeConfig,
    fetchFeeConfig,
  } = useCartStore();

  const { user, isAuthenticated } = useAuthStore();
  const { locationTitle, locationSubtitle, selectedAddress, setSelectedAddress } = useLocationStore();
  const setActiveOrder = useOrderTrackingStore((state) => state.setActiveOrder);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);

  // Calculate generic delivery estimate (45 mins from now)
  const getDeliveryEstimate = () => {
    const d = new Date(Date.now() + 45 * 60000);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `Delivery by ${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} • ${hours}:${mins} ${ampm}`;
  };

  useEffect(() => {
    fetchFeeConfig();
    const fetchUserAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const userAddresses = await addressService.getAddresses();
        const addressList = Array.isArray(userAddresses) ? userAddresses : [];
        setAddresses(addressList);
        if (addressList.length > 0 && !selectedAddress) {
          const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0];
          setSelectedAddress(defaultAddr);
        }
      } catch (err) {
        console.warn('Could not load addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    if (isAuthenticated) {
      fetchUserAddresses();
    }
  }, [isAuthenticated]);

  const itemsTotal = getItemsTotal();
  const deliveryFee = getDeliveryFee();
  const taxes = getGstAndTaxes();
  const platformFee = getPlatformFee();
  const packagingFee = getPackagingFee();
  const surgeFee = getSurgeFee();
  const customFeesTotal = getCustomFeesTotal();
  const grandTotal = getGrandTotal();

  const handlePlaceOrder = async () => {
    if (!restaurant || items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items before placing order.');
      return;
    }

    // 1. Enforce Authentication
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required',
        'Please login to place your food order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login Now', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    // 2. Enforce Valid Address
    if (!selectedAddress || (!selectedAddress.line1 && !(selectedAddress as any).street)) {
      Alert.alert(
        'Address Required',
        'Please select or add a delivery address to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Address', onPress: () => router.push('/address') },
        ]
      );
      return;
    }

    const addressToUse = {
      line1: selectedAddress.line1 || (selectedAddress as any)?.street || 'Main Road',
      line2: selectedAddress.line2 || '',
      city: selectedAddress.city || 'New Delhi',
      state: selectedAddress.state || 'Delhi',
      pincode: selectedAddress.pincode || '110001',
      location: selectedAddress.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
    };

    try {
      setPlacingOrder(true);

      const orderPayload = {
        restaurantId: restaurant._id,
        items: items.map((i) => ({
          menuItemId: i.menuItem._id,
          name: i.menuItem.name,
          price: i.menuItem.price,
          quantity: i.quantity,
          selectedModifiers: i.selectedModifiers,
        })),
        deliveryAddress: addressToUse,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        paymentMethod,
      };

      const { order, payment } = await orderService.createOrder(orderPayload);

      if (paymentMethod === 'ONLINE') {
        if (payment && payment.razorpayOrderId) {
          Alert.alert('Payment Notice', 'Online payment order created: ' + payment.razorpayOrderId);
        }
      }

      setActiveOrder(order);
      clearCart();

      const orderRef = order?.orderNumber || (order as any)?._id?.slice(-6) || 'New';
      Alert.alert('Order Placed! 🎉', `Order #${orderRef} confirmed successfully.`, [
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
          message="Explore delicious cuisines and add something yummy to your plate!"
          actionText="Browse Restaurants"
          onAction={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <Ionicons name="cart" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.navTitle}>{restaurant?.name || 'My Cart'}</Text>
            <Text style={styles.navSubtitle}>{items.reduce((s, i) => s + i.quantity, 0)} Items Added</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ordered Items List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>ITEMS IN YOUR CART ({items.length})</Text>
          {items.map((item, idx) => {
            const imageUrl = item.menuItem.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg';
            const isVeg = item.menuItem.isVeg;
            
            return (
              <View
                key={item.menuItem._id}
                style={[styles.itemRow, idx !== items.length - 1 && styles.itemRowBorder]}
              >
                <TouchableOpacity onPress={() => setSelectedItemForDetails(item.menuItem)} activeOpacity={0.8}>
                  <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                </TouchableOpacity>
                
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    {isVeg !== undefined && (
                      <View style={[styles.vegSquare, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                        <View style={[styles.vegDot, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
                      </View>
                    )}
                    <Text style={styles.itemName} numberOfLines={2}>{item.menuItem.name}</Text>
                  </View>
                  
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <Text style={styles.itemModifiers}>
                      {item.selectedModifiers.map((m) => m.name).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>{formatPaise(item.totalItemPrice)}</Text>
                  <Text style={styles.deliveryEstText}>{getDeliveryEstimate()}</Text>
                </View>

                <View style={styles.counterBox}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.menuItem._id, -1)}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="remove" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.menuItem._id, 1)}
                    style={styles.counterBtn}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Location */}
        <View style={styles.card}>
          <View style={styles.locationHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeading}>DELIVERY ADDRESS</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/address')}>
              <Text style={{ ...Typography.button, color: Colors.primary, fontSize: 12 }}>Change</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addressBox}
            onPress={() => router.push('/address')}
            activeOpacity={0.8}
          >
            {selectedAddress ? (
              <>
                <Text style={styles.addressType}>
                  {(selectedAddress.label || (selectedAddress as any).type || 'Delivery Address')} • {user?.name || 'Customer'}
                </Text>
                <Text style={styles.addressStreet}>
                  {selectedAddress.line1 || (selectedAddress as any)?.street}
                  {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}, {selectedAddress.city} -{' '}
                  {selectedAddress.pincode}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.addressType}>{locationTitle || 'Current Location'}</Text>
                <Text style={styles.addressStreet}>{locationSubtitle || 'Tap to select or add delivery address'}</Text>
              </>
            )}
          </TouchableOpacity>

          <TextInput
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="Delivery instructions (e.g. Leave at door, don't ring bell)"
            style={styles.instructionInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Payment Option */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>PAYMENT METHOD</Text>
          <TouchableOpacity
            onPress={() => setPaymentMethod('COD')}
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
            </View>
            <Ionicons
              name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={paymentMethod === 'COD' ? Colors.primary : '#9CA3AF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('ONLINE')}
            style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.paymentText}>Online Payment (UPI / Cards)</Text>
            </View>
            <Ionicons
              name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={paymentMethod === 'ONLINE' ? Colors.primary : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {/* Bill Breakdown */}
        <View style={[styles.card, { marginBottom: 90 }]}>
          <Text style={styles.cardHeading}>BILL DETAILS</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPaise(itemsTotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Partner Fee</Text>
            <Text style={styles.billValue}>
              {deliveryFee === 0 ? 'FREE' : formatPaise(deliveryFee)}
            </Text>
          </View>
          {taxes > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>
                Taxes & GST ({feeConfig?.taxPercent ?? 5}%)
              </Text>
              <Text style={styles.billValue}>{formatPaise(taxes)}</Text>
            </View>
          )}
          {platformFee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billValue}>{formatPaise(platformFee)}</Text>
            </View>
          )}
          {packagingFee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Packaging & Handling Charge</Text>
              <Text style={styles.billValue}>{formatPaise(packagingFee)}</Text>
            </View>
          )}
          {surgeFee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Surge / Bad Weather Fee</Text>
              <Text style={styles.billValue}>{formatPaise(surgeFee)}</Text>
            </View>
          )}
          {feeConfig?.customFees?.filter((f) => f.isEnabled && f.amount > 0).map((f, idx) => (
            <View key={idx} style={styles.billRow}>
              <Text style={styles.billLabel}>{f.name}</Text>
              <Text style={styles.billValue}>{formatPaise(f.amount)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>{formatPaise(grandTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total to Pay</Text>
          <Text style={styles.bottomTotalPrice}>{formatPaise(grandTotal)}</Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          style={[styles.placeOrderBtn, placingOrder && { opacity: 0.8 }]}
        >
          {placingOrder ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.placeOrderBtnInner}>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 6 }} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Item Details Modal */}
      <Modal
        visible={!!selectedItemForDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedItemForDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setSelectedItemForDetails(null)}
            >
              <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            {selectedItemForDetails && (
              <>
                <Image 
                  source={{ uri: selectedItemForDetails.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' }} 
                  style={styles.modalImage} 
                />
                <View style={styles.modalInfo}>
                  <View style={styles.itemNameRow}>
                    {selectedItemForDetails.isVeg !== undefined && (
                      <View style={[styles.vegSquare, { borderColor: selectedItemForDetails.isVeg ? '#16A34A' : '#DC2626' }]}>
                        <View style={[styles.vegDot, { backgroundColor: selectedItemForDetails.isVeg ? '#16A34A' : '#DC2626' }]} />
                      </View>
                    )}
                    <Text style={styles.modalTitle}>{selectedItemForDetails.name}</Text>
                  </View>
                  <Text style={styles.modalPrice}>{formatPaise(selectedItemForDetails.price)}</Text>
                  {selectedItemForDetails.description ? (
                    <Text style={styles.modalDesc}>{selectedItemForDetails.description}</Text>
                  ) : null}

                  <TouchableOpacity 
                    style={styles.showAllDetailsBtn}
                    onPress={() => {
                      setSelectedItemForDetails(null);
                      if (restaurant?._id) {
                        router.push(`/restaurant/${restaurant._id}`);
                      }
                    }}
                  >
                    <Text style={styles.showAllDetailsText}>Show Full Menu & Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center' },
  navbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { ...Typography.heading, fontSize: 18 },
  navSubtitle: { ...Typography.caption, fontSize: 12, color: Colors.primary },
  clearBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  clearText: { ...Typography.button, color: Colors.error, fontSize: 11 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 180 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeading: { ...Typography.label, letterSpacing: 0.5, marginBottom: 12, color: Colors.textSecondary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.border },
  itemInfo: { flex: 1, marginLeft: 12, marginRight: 10 },
  itemNameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  vegSquare: { width: 12, height: 12, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginTop: 3 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { ...Typography.subtitle, fontSize: 14, flex: 1, color: Colors.text, lineHeight: 18 },
  itemModifiers: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, fontSize: 11 },
  itemPrice: { ...Typography.title, color: Colors.text, marginTop: 4, fontSize: 14 },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  counterBtn: { padding: 4 },
  counterValue: { ...Typography.title, color: Colors.primary, marginHorizontal: 10, fontSize: 14 },
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addressBox: { backgroundColor: Colors.background, padding: 12, borderRadius: 12, marginBottom: 10 },
  addressType: { ...Typography.title, fontSize: 14, marginBottom: 2 },
  addressStreet: { ...Typography.bodySmall, color: Colors.textSecondary, fontSize: 12 },
  instructionInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    ...Typography.bodySmall,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    backgroundColor: Colors.background,
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  paymentText: { ...Typography.body, fontSize: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  billValue: { ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { ...Typography.title, fontSize: 16 },
  grandTotalValue: { ...Typography.heading, fontSize: 18, color: Colors.primary },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 98 : 90,
    left: 16,
    right: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomTotalLabel: { ...Typography.caption, fontSize: 11 },
  bottomTotalPrice: { ...Typography.heading, fontSize: 18, color: Colors.primary },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  placeOrderBtnInner: { flexDirection: 'row', alignItems: 'center' },
  placeOrderText: { ...Typography.button, color: Colors.white, fontSize: 14 },
  deliveryEstText: { ...Typography.caption, color: '#16A34A', fontSize: 10, marginTop: 4, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '80%' },
  closeModalBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16 },
  modalImage: { width: '100%', height: 220, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalInfo: { padding: 20 },
  modalTitle: { ...Typography.heading, fontSize: 20, flex: 1 },
  modalPrice: { ...Typography.title, color: Colors.primary, marginTop: 6, fontSize: 18 },
  modalDesc: { ...Typography.body, color: Colors.textSecondary, marginTop: 12, lineHeight: 22 },
  showAllDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  showAllDetailsText: { ...Typography.button, color: Colors.primary, fontSize: 14, marginRight: 6 },
});
