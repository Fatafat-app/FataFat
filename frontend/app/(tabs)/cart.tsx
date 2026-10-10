import { useState, useEffect } from 'react';
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
import { Typography, Colors, BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
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
    toggleItemSelection,
    getSelectedItems,
    buyNowItem,
  } = useCartStore();

  const { user, isAuthenticated } = useAuthStore();
  const { locationTitle, locationSubtitle, selectedAddress, setSelectedAddress } = useLocationStore();
  const setActiveOrder = useOrderTrackingStore((state) => state.setActiveOrder);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placingBuyNow, setPlacingBuyNow] = useState(false);
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

    const coords = selectedAddress.location?.coordinates ||
      (selectedAddress as any).coordinates ||
      [77.2090, 28.6139];

    const addressToUse = {
      // Send both formats so backend is happy regardless of which it checks
      line1: selectedAddress.line1 || (selectedAddress as any)?.street || 'Main Road',
      street: selectedAddress.line1 || (selectedAddress as any)?.street || 'Main Road',
      line2: selectedAddress.line2 || '',
      city: selectedAddress.city || 'New Delhi',
      state: selectedAddress.state || 'Delhi',
      pincode: selectedAddress.pincode || (selectedAddress as any)?.postalCode || '110001',
      postalCode: selectedAddress.pincode || (selectedAddress as any)?.postalCode || '110001',
      country: 'India',
      location: { type: 'Point', coordinates: coords },
      coordinates: coords,
    };

    // Normalize paymentMethod to lowercase for backend (COD -> cod, ONLINE -> razorpay)
    const normalizedPayment =
      paymentMethod === 'COD' ? 'cod' :
        paymentMethod === 'ONLINE' ? 'razorpay' :
          (paymentMethod as string).toLowerCase();

    const itemsToOrder = getSelectedItems();

    if (itemsToOrder.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to place an order.');
      return;
    }

    try {
      setPlacingOrder(true);

      const orderPayload = {
        restaurantId: restaurant._id,
        items: itemsToOrder.map((i) => ({
          menuItemId: i.menuItem._id,
          name: i.menuItem.name,
          price: i.menuItem.price,
          quantity: i.quantity,
          selectedModifiers: i.selectedModifiers,
        })),
        deliveryAddress: addressToUse as unknown as Address,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        paymentMethod: normalizedPayment as any,
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

  // Flipkart-style Buy Now: select only that item and instantly place order
  const handleBuyNow = async (menuItemId: string) => {
    buyNowItem(menuItemId);
    // Give zustand a tick to update state before placing order
    setTimeout(() => handlePlaceOrder(), 50);
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
            const desc = item.menuItem.description;
            const category = item.menuItem.category;
            // Don't show raw MongoDB ObjectIds as category
            const showCategory = category && !/^[a-f\d]{24}$/i.test(category);
            const prepTime = item.menuItem.preparationTime;
            const unitPrice = item.menuItem.price;

            return (
              // @ts-ignore
              <View
                key={item.menuItem._id}
                style={[
                  styles.itemCard,
                  idx !== items.length - 1 && { marginBottom: 12 },
                ]}
              >
                {/* Top Row: Image + Info */}
                <View style={styles.itemRow}>
                  <TouchableOpacity onPress={() => setSelectedItemForDetails(item.menuItem)} activeOpacity={0.85}>
                    <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                  </TouchableOpacity>

                  <View style={styles.itemInfo}>
                    {/* Veg/Non-veg label + Category */}
                    <View style={styles.itemTopBadgeRow}>
                      <View style={[styles.vegSquare, { borderColor: isVeg ? Colors.success : Colors.error }]}>
                        <View style={[styles.vegDot, { backgroundColor: isVeg ? Colors.success : Colors.error }]} />
                      </View>
                      <Text style={[styles.vegLabel, { color: isVeg ? Colors.success : Colors.error }]}>
                        {isVeg ? 'Veg' : 'Non-Veg'}
                      </Text>
                      {showCategory ? (
                        <Text style={styles.categoryLabel}> · {category}</Text>
                      ) : null}
                    </View>

                    {/* Name */}
                    <Text style={styles.itemName} numberOfLines={2}>{item.menuItem.name}</Text>

                    {/* Description */}
                    {desc ? (
                      <Text style={styles.itemDesc} numberOfLines={2}>{desc}</Text>
                    ) : null}

                    {/* Modifiers */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <Text style={styles.itemModifiers}>
                        + {item.selectedModifiers.map((m) => m.name).join(', ')}
                      </Text>
                    )}

                    {/* Price row: unit price × qty = total */}
                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>{formatPaise(item.totalItemPrice)}</Text>
                      <Text style={styles.unitPriceText}>
                        {formatPaise(unitPrice)} × {item.quantity}
                      </Text>
                    </View>

                    {/* Delivery estimate + prep time */}
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={11} color={Colors.success} />
                      <Text style={styles.deliveryEstText}>
                        {prepTime ? `Ready in ${prepTime} min  ·  ` : ''}{getDeliveryEstimate()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Row: Qty Counter + Buy Now */}
                <View style={styles.itemActionRow}>
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

                  <TouchableOpacity
                    style={styles.buyNowBtn}
                    onPress={() => handleBuyNow(item.menuItem._id)}
                    disabled={placingBuyNow || placingOrder}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="cart-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.buyNowText}>Buy Now</Text>
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
            // @ts-ignore
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
                      <View style={[styles.vegSquare, { borderColor: selectedItemForDetails.isVeg ? Colors.success : Colors.error }]}>
                        <View style={[styles.vegDot, { backgroundColor: selectedItemForDetails.isVeg ? Colors.success : Colors.error }]} />
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
  clearBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  clearText: { ...Typography.button, color: Colors.error, fontSize: 11 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 220 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeading: { ...Typography.label, letterSpacing: 0.5, marginBottom: 12, color: Colors.textSecondary },
  itemCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: Colors.border },
  vegBadge: {
    width: 14, height: 14, borderWidth: 1.5, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, backgroundColor: '#fff',
  },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemNameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  itemTopBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  vegSquare: { width: 12, height: 12, borderWidth: 1.5, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  vegLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  categoryLabel: { fontSize: 11, color: Colors.textSecondary, marginLeft: 2 },
  itemName: { ...Typography.subtitle, fontSize: 15, color: Colors.text, lineHeight: 20, marginBottom: 3 },
  itemDesc: { ...Typography.caption, fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 4 },
  itemModifiers: { ...Typography.caption, color: Colors.primary, marginBottom: 4, fontSize: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  itemPrice: { ...Typography.title, color: Colors.text, fontSize: 15, fontWeight: '700' },
  unitPriceText: { fontSize: 12, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  deliveryEstText: { ...Typography.caption, color: Colors.success, fontSize: 11, fontWeight: '600' },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderColor: Colors.primary,
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
    bottom: Platform.OS === 'ios' ? 110 : 105,
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
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 100,
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
  deliveryEstText: { ...Typography.caption, color: Colors.success, fontSize: 10, marginTop: 4, fontWeight: '600' },
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
    borderColor: Colors.primary,
  },
  showAllDetailsText: { ...Typography.button, color: Colors.primary, fontSize: 14, marginRight: 6 },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buyNowText: { ...Typography.button, color: '#FFFFFF', fontSize: 13, letterSpacing: 0.3 },
});
