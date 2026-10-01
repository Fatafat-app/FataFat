import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GColors, GRadius, GSpacing, GShadow } from '../../constants/GroceryTheme';
import { useGroceryStore, useGroceryCartCount, useGroceryCartTotal } from '../../store/grocery.store';
import { useLocationStore } from '../../store/location.store';
import { useAuthStore } from '../../store/auth.store';
import { useOrderTrackingStore } from '../../store/orderTracking.store';
import { orderService } from '../../services/order.service';
import { addressService } from '../../services/address.service';
import { Address } from '../../types';

export function GroceryCart() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, isAuthenticated } = useAuthStore();
  const { locationTitle, locationSubtitle, selectedAddress, setSelectedAddress } = useLocationStore();
  const setActiveOrder = useOrderTrackingStore((state) => state.setActiveOrder);

  const {
    cart,
    incrementQty,
    decrementQty,
    clearCart,
    appliedCoupon,
    removeCoupon,
    applyCoupon,
  } = useGroceryStore();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  useEffect(() => {
    const fetchUserAddresses = async () => {
      try {
        const userAddresses = await addressService.getAddresses();
        const addressList = Array.isArray(userAddresses) ? userAddresses : [];
        if (addressList.length > 0 && !selectedAddress) {
          const defaultAddr = addressList.find((a: Address) => a.isDefault) || addressList[0];
          setSelectedAddress(defaultAddr);
        }
      } catch (err) {
        // Fallback gracefully
      }
    };
    if (!selectedAddress && isAuthenticated) {
      fetchUserAddresses();
    }
  }, [selectedAddress, isAuthenticated]);

  const cartCount = useGroceryCartCount();
  const itemTotal = useGroceryCartTotal();

  const isFreeDelivery = itemTotal >= 300;
  const deliveryFee = itemTotal > 0 ? (isFreeDelivery ? 0 : 35) : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalToPay = Math.max(0, itemTotal + deliveryFee - couponDiscount);

  const [promoInput, setPromoInput] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'FRESH40' || code === 'FRESH30') {
      applyCoupon(code, 40);
      setShowPromoInput(false);
      setPromoInput('');
    } else if (code === 'ORGANIC20') {
      applyCoupon(code, 20);
      setShowPromoInput(false);
      setPromoInput('');
    } else {
      Alert.alert('Invalid Coupon', 'Please enter a valid code like FRESH40 or ORGANIC20');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // 1. Enforce Authentication
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required',
        'Please login to place your grocery order.',
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

    try {
      setPlacingOrder(true);

      const addressToUse = {
        line1: selectedAddress.line1 || (selectedAddress as any)?.street || 'Main Road',
        line2: selectedAddress.line2 || '',
        city: selectedAddress.city || 'New Delhi',
        state: selectedAddress.state || 'Delhi',
        pincode: selectedAddress.pincode || '110001',
        location: selectedAddress.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
      };

      const itemsPayload = cart.map((i) => ({
        menuItemId: i.product._id || i.product.id,
        productId: i.product._id || i.product.id,
        name: i.product.name,
        price: Math.round(i.product.price * 100), // in paise
        quantity: i.quantity,
      }));

      const { order } = await orderService.createOrder({
        restaurantId: (cart[0]?.product as any)?.vendorId || 'platform_grocery_store',
        items: itemsPayload as any,
        deliveryAddress: addressToUse as any,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        paymentMethod: 'COD',
        couponCode: appliedCoupon?.code,
        orderType: 'grocery',
        vertical: 'grocery',
      } as any);

      setActiveOrder(order);
      clearCart();

      const orderRef = order?.orderNumber || (order as any)?._id?.slice(-6) || 'New';
      Alert.alert(
        'Order Placed Successfully! 🎉',
        `Grocery Order #${orderRef} placed for ₹${(finalToPay + 2).toFixed(0)}. Quick Delivery in 20-30 mins!`,
        [
          {
            text: 'Track Order',
            onPress: () => router.push('/(tabs)/orders'),
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to place grocery order';
      Alert.alert('Order Error', msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  const displayLabel = selectedAddress
    ? `${selectedAddress.label || (selectedAddress as any).type || 'Delivery Address'} • ${user?.name || 'Customer'}`
    : (locationTitle || 'Your Current Location');

  const displayAddress = selectedAddress
    ? `${selectedAddress.line1 || (selectedAddress as any)?.street || ''}${
        selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''
      }, ${selectedAddress.city} - ${selectedAddress.pincode}`
    : (locationSubtitle || 'Tap to select delivery address');

  return (
    <View style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Ionicons name="basket" size={24} color="#16A34A" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.navTitle}>Grocery Cart</Text>
            <Text style={styles.navSubtitle}>{cartCount} Items Added</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={60} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Your Grocery Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>Explore fresh groceries and add something to your cart!</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/grocery/categories')}>
              <Text style={styles.exploreBtnText}>Browse Departments</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Ordered Items List */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>ITEMS IN YOUR CART ({cartCount})</Text>
              {cart.map((item, idx) => {
                const prodId = item.product._id || item.product.id;
                const product = item.product;
                const imageUrl = product.image || product.images?.[0] || 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg';
                
                return (
                  <View
                    key={prodId}
                    style={[styles.itemRow, idx !== cart.length - 1 && styles.itemRowBorder]}
                  >
                    <TouchableOpacity onPress={() => setSelectedItemForDetails(product)} activeOpacity={0.8}>
                      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                    </TouchableOpacity>
                    
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <View style={[styles.vegSquare, { borderColor: '#16A34A' }]}>
                          <View style={[styles.vegDot, { backgroundColor: '#16A34A' }]} />
                        </View>
                        <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
                      </View>
                      
                      <Text style={styles.itemModifiers}>{product.unit || '1 pack'}</Text>
                      <Text style={styles.itemPrice}>₹{(product.price * item.quantity).toFixed(0)}</Text>
                    </View>

                    <View style={styles.counterBox}>
                      <TouchableOpacity
                        onPress={() => decrementQty(prodId)}
                        style={styles.counterBtn}
                      >
                        <Ionicons name="remove" size={16} color="#16A34A" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => incrementQty(prodId)}
                        style={styles.counterBtn}
                      >
                        <Ionicons name="add" size={16} color="#16A34A" />
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
                  <Ionicons name="location" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text style={styles.cardHeading}>DELIVERY ADDRESS</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/address')}>
                  <Text style={{ fontFamily: BOLD_FONT, color: '#16A34A', fontSize: 12 }}>Change</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.push('/address')} activeOpacity={0.8} style={styles.addressBox}>
                <Text style={styles.addressType}>{displayLabel}</Text>
                <Text style={styles.addressStreet}>{displayAddress}</Text>
              </TouchableOpacity>

              <TextInput
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                placeholder="Delivery instructions (e.g. Leave at door, don't ring bell)"
                style={styles.instructionInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Coupon Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>OFFERS & BENEFITS</Text>
              {!appliedCoupon ? (
                showPromoInput ? (
                  <View style={styles.promoInputRow}>
                    <Ionicons name="pricetag" size={20} color="#16A34A" />
                    <TextInput
                      style={styles.promoInput}
                      placeholder="Enter coupon code"
                      placeholderTextColor="#9CA3AF"
                      value={promoInput}
                      onChangeText={setPromoInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPromo}>
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.promoTrigger} onPress={() => setShowPromoInput(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="pricetag-outline" size={20} color="#111827" />
                      <Text style={styles.promoTriggerText}>Apply Coupon</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )
              ) : (
                <View style={styles.appliedPromoRow}>
                  <View style={styles.appliedPromoLeft}>
                    <Ionicons name="pricetag" size={20} color="#16A34A" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.appliedPromoCode}>{appliedCoupon.code}</Text>
                      <Text style={styles.appliedPromoDesc}>Coupon applied successfully</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={removeCoupon}>
                    <Text style={styles.removePromoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bill Breakdown */}
            <View style={[styles.card, { marginBottom: 90 }]}>
              <Text style={styles.cardHeading}>BILL DETAILS</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{itemTotal.toFixed(0)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Partner Fee</Text>
                <Text style={styles.billValue}>
                  {deliveryFee === 0 ? <Text style={{ color: '#16A34A' }}>FREE</Text> : `₹${deliveryFee.toFixed(0)}`}
                </Text>
              </View>
              {couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#16A34A' }]}>Coupon Discount</Text>
                  <Text style={[styles.billValue, { color: '#16A34A' }]}>-₹{couponDiscount.toFixed(0)}</Text>
                </View>
              )}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Handling Charge</Text>
                <Text style={styles.billValue}>₹2</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>To Pay</Text>
                <Text style={styles.grandTotalValue}>₹{(finalToPay + 2).toFixed(0)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Bar */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomTotalLabel}>Total to Pay</Text>
            <Text style={styles.bottomTotalPrice}>₹{(finalToPay + 2).toFixed(0)}</Text>
          </View>

          <TouchableOpacity
            onPress={handleCheckout}
            disabled={placingOrder}
            style={[styles.placeOrderBtn, placingOrder && { opacity: 0.8 }]}
            activeOpacity={0.9}
          >
            {placingOrder ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.placeOrderBtnInner}>
                <Text style={styles.placeOrderText}>Place Order</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

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
              <Ionicons name="close-circle" size={28} color="#6B7280" />
            </TouchableOpacity>
            
            {selectedItemForDetails && (
              <>
                <Image 
                  source={{ uri: selectedItemForDetails.image || selectedItemForDetails.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' }} 
                  style={styles.modalImage} 
                />
                <View style={styles.modalInfo}>
                  <View style={styles.itemNameRow}>
                    <View style={[styles.vegSquare, { borderColor: '#16A34A' }]}>
                      <View style={[styles.vegDot, { backgroundColor: '#16A34A' }]} />
                    </View>
                    <Text style={styles.modalTitle}>{selectedItemForDetails.name}</Text>
                  </View>
                  <Text style={styles.modalPrice}>₹{selectedItemForDetails.price}</Text>
                  {selectedItemForDetails.description ? (
                    <Text style={styles.modalDesc}>{selectedItemForDetails.description}</Text>
                  ) : (
                    <Text style={styles.modalDesc}>Fresh and high-quality product sourced for you.</Text>
                  )}

                  <TouchableOpacity 
                    style={styles.showAllDetailsBtn}
                    onPress={() => {
                      const prodId = selectedItemForDetails._id || selectedItemForDetails.id || selectedItemForDetails.slug;
                      setSelectedItemForDetails(null);
                      if (prodId) {
                        router.push(`/grocery/product/${prodId}`);
                      }
                    }}
                  >
                    <Text style={styles.showAllDetailsText}>Show Full Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#16A34A" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { fontFamily: BOLD_FONT, fontSize: 18, color: '#111827' },
  navSubtitle: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#16A34A' },
  clearBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  clearText: { fontFamily: BOLD_FONT, color: '#EF4444', fontSize: 11 },
  
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 180 },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: BOLD_FONT, fontSize: 20, color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontFamily: STYLISH_FONT, fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  exploreBtn: { backgroundColor: '#16A34A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { fontFamily: BOLD_FONT, color: '#FFFFFF', fontSize: 14 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeading: { fontFamily: BOLD_FONT, fontSize: 12, letterSpacing: 0.5, marginBottom: 12, color: '#6B7280' },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F3F4F6' },
  itemInfo: { flex: 1, marginLeft: 12, marginRight: 10 },
  itemNameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  vegSquare: { width: 12, height: 12, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginTop: 3 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { fontFamily: BOLD_FONT, fontSize: 14, flex: 1, color: '#111827', lineHeight: 18 },
  itemModifiers: { fontFamily: STYLISH_FONT, color: '#6B7280', marginTop: 4, fontSize: 11 },
  itemPrice: { fontFamily: BOLD_FONT, color: '#111827', marginTop: 4, fontSize: 14 },
  
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  counterBtn: { padding: 4 },
  counterValue: { fontFamily: BOLD_FONT, color: '#16A34A', marginHorizontal: 10, fontSize: 14 },
  
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addressBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 10 },
  addressType: { fontFamily: BOLD_FONT, fontSize: 14, marginBottom: 2, color: '#111827' },
  addressStreet: { fontFamily: STYLISH_FONT, color: '#6B7280', fontSize: 12 },
  instructionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  promoTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  promoTriggerText: { fontFamily: BOLD_FONT, fontSize: 15, color: '#111827', marginLeft: 10 },
  promoInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  promoInput: { flex: 1, fontFamily: STYLISH_FONT, fontSize: 14, color: '#111827', marginLeft: 10, height: 40 },
  applyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  applyBtnText: { fontFamily: BOLD_FONT, fontSize: 14, color: '#16A34A' },
  appliedPromoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appliedPromoLeft: { flexDirection: 'row', alignItems: 'center' },
  appliedPromoCode: { fontFamily: BOLD_FONT, fontSize: 15, color: '#111827' },
  appliedPromoDesc: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#16A34A', marginTop: 2 },
  removePromoText: { fontFamily: BOLD_FONT, fontSize: 13, color: '#EF4444' },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontFamily: STYLISH_FONT, fontSize: 13, color: '#6B7280' },
  billValue: { fontFamily: STYLISH_FONT, fontSize: 13, color: '#111827', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { fontFamily: BOLD_FONT, fontSize: 16, color: '#111827' },
  grandTotalValue: { fontFamily: BOLD_FONT, fontSize: 18, color: '#16A34A' },
  
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 98 : 90,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomTotalLabel: { fontFamily: STYLISH_FONT, fontSize: 11, color: '#6B7280' },
  bottomTotalPrice: { fontFamily: BOLD_FONT, fontSize: 18, color: '#16A34A' },
  placeOrderBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  placeOrderBtnInner: { flexDirection: 'row', alignItems: 'center' },
  placeOrderText: { fontFamily: BOLD_FONT, color: '#FFFFFF', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '80%' },
  closeModalBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: '100%', height: 220, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalInfo: { padding: 20 },
  modalTitle: { fontFamily: BOLD_FONT, fontSize: 20, flex: 1, color: '#111827' },
  modalPrice: { fontFamily: BOLD_FONT, color: '#16A34A', marginTop: 6, fontSize: 18 },
  modalDesc: { fontFamily: STYLISH_FONT, color: '#6B7280', marginTop: 12, lineHeight: 22 },
  showAllDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  showAllDetailsText: { fontFamily: BOLD_FONT, color: '#16A34A', fontSize: 14 },
});
