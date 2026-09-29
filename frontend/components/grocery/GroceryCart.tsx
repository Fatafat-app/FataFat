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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GColors, GRadius, GSpacing, GShadow } from '../../constants/GroceryTheme';
import { useGroceryStore, useGroceryCartCount, useGroceryCartTotal } from '../../store/grocery.store';
import { useLocationStore } from '../../store/location.store';
import { useAuthStore } from '../../store/auth.store';
import { addressService } from '../../services/address.service';
import { Address } from '../../types';

export function GroceryCart() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const { locationTitle, locationSubtitle, selectedAddress, setSelectedAddress } = useLocationStore();

  const {
    cart,
    incrementQty,
    decrementQty,
    clearCart,
    appliedCoupon,
    removeCoupon,
    applyCoupon,
  } = useGroceryStore();

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
    if (!selectedAddress) {
      fetchUserAddresses();
    }
  }, [selectedAddress]);

  const cartCount = useGroceryCartCount();
  const itemTotal = useGroceryCartTotal();

  const isFreeDelivery = itemTotal >= 10;
  const deliveryFee = itemTotal > 0 ? (isFreeDelivery ? 0 : 1.50) : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalToPay = Math.max(0, itemTotal + deliveryFee - couponDiscount);

  const freeDeliveryThreshold = 10;
  const neededForFree = Math.max(0, freeDeliveryThreshold - itemTotal);
  const progressPercent = Math.min(100, Math.round((itemTotal / freeDeliveryThreshold) * 100));

  const [promoInput, setPromoInput] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

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
      applyCoupon(code, 2.0);
      setShowPromoInput(false);
      setPromoInput('');
    } else if (code === 'ORGANIC20') {
      applyCoupon(code, 1.5);
      setShowPromoInput(false);
      setPromoInput('');
    } else {
      Alert.alert('Invalid Coupon', 'Please enter a valid code like FRESH40 or ORGANIC20');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    Alert.alert(
      'Order Placed Successfully! 🎉',
      `Your grocery order of $${finalToPay.toFixed(2)} has been placed for ${
        selectedAddress?.line1 || locationTitle || 'your delivery address'
      }. Fast Lane 25-35 mins delivery started!`,
      [
        {
          text: 'View Orders',
          onPress: () => {
            clearCart();
            router.push('/(tabs)/orders');
          },
        },
      ]
    );
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
    <View style={styles.root}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#1E3D34" />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitleText}>My Cart</Text>
          {cartCount > 0 && (
            <View style={styles.headerItemBadge}>
              <Text style={styles.headerItemBadgeText}>{cartCount} items</Text>
            </View>
          )}
        </View>

        {cartCount > 0 ? (
          <TouchableOpacity style={styles.headerCircleBtn} onPress={handleClearCart} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color="#1E3D34" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Delivering Location & Fast Lane Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressTopRow}>
            <View style={styles.locationPinCircle}>
              <Ionicons name="location" size={18} color="#1E3D34" />
            </View>

            <View style={styles.addressTextContent}>
              <View style={styles.deliveringToRow}>
                <Text style={styles.deliveringToLabel}>Delivering to</Text>
                <Ionicons name="chevron-down" size={13} color="#6B7280" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.cityText} numberOfLines={1}>{displayLabel}</Text>
              <Text style={styles.streetText} numberOfLines={2}>{displayAddress}</Text>
            </View>

            <TouchableOpacity onPress={() => router.push('/address')} activeOpacity={0.7}>
              <Text style={styles.changeLinkText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressDivider} />

          <View style={styles.addressBottomRow}>
            <Ionicons name="flash" size={15} color="#1E3D34" style={{ marginRight: 6 }} />
            <Text style={styles.instantDeliveryText}>
              Instant Delivery:{' '}
              <Text style={styles.instantDeliveryTime}>25-35 mins</Text>
            </Text>

            <View style={styles.fastLaneBadge}>
              <Text style={styles.fastLaneText}>Fast Lane</Text>
            </View>
          </View>
        </View>

        {/* Empty Cart State */}
        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bag-handle-outline" size={42} color="#1E3D34" />
            </View>
            <Text style={styles.emptyTitle}>Your grocery cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore fresh organic veggies, daily dairy, fruits and pantry essentials.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/grocery/categories')}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreBtnText}>Browse Departments</Text>
              <Ionicons name="arrow-forward" size={16} color="#1E3D34" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Cart Items</Text>
              <Text style={styles.coldChainText}>Free cold-chain packing</Text>
            </View>

            {/* Live Cart Items List */}
            <View style={styles.itemsList}>
              {cart.map((item) => {
                const prodId = item.product._id || item.product.id;
                const product = item.product;
                const unit = product.unit || '1 pack';
                const originalPrice = product.originalPrice;

                return (
                  <View key={prodId} style={styles.itemCard}>
                    {/* Circular Product Image */}
                    <View style={styles.itemImgCircle}>
                      <Image
                        source={{
                          uri:
                            product.image ||
                            product.images?.[0] ||
                            'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300',
                        }}
                        style={styles.itemImg}
                        resizeMode="cover"
                      />
                    </View>

                    {/* Product Details */}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.itemUnit}>{unit}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.itemPrice}>
                          ${(product.price * item.quantity).toFixed(2)}
                        </Text>
                        {originalPrice && (
                          <Text style={styles.itemOriginalPrice}>
                            ${(originalPrice * item.quantity).toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Stepper Pill */}
                    <View style={styles.stepperPill}>
                      <TouchableOpacity
                        style={styles.stepperMinusBtn}
                        onPress={() => decrementQty(prodId)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperMinusText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.stepperQtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.stepperPlusCircle}
                        onPress={() => incrementQty(prodId)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.stepperPlusText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Promo / Coupon Applied Card */}
            {appliedCoupon ? (
              <View style={styles.couponCard}>
                <View style={styles.couponIconBox}>
                  <Ionicons name="pricetag" size={17} color="#1E3D34" />
                </View>
                <View style={styles.couponTextContent}>
                  <View style={styles.couponRow}>
                    <Text style={styles.couponCodeText}>{appliedCoupon.code}</Text>
                    <View style={styles.couponAppliedBadge}>
                      <Text style={styles.couponAppliedBadgeText}>Applied</Text>
                    </View>
                  </View>
                  <Text style={styles.couponDiscountSubtitle}>
                    Enjoy -${appliedCoupon.discount.toFixed(2)} off order
                  </Text>
                </View>
                <TouchableOpacity onPress={removeCoupon} activeOpacity={0.7} style={styles.couponCloseBtn}>
                  <Ionicons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ) : showPromoInput ? (
              <View style={styles.promoInputRow}>
                <TextInput
                  style={styles.promoTextInput}
                  placeholder="Enter code (e.g. FRESH40)"
                  placeholderTextColor="#9CA3AF"
                  value={promoInput}
                  onChangeText={setPromoInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPromo} activeOpacity={0.8}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.couponCardAdd}
                onPress={() => setShowPromoInput(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="pricetag-outline" size={18} color="#1E3D34" style={{ marginRight: 10 }} />
                <Text style={styles.applyCouponText}>Apply Coupon / Voucher</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {/* Bill Summary Card */}
            <View style={styles.billCard}>
              <Text style={styles.billHeading}>Bill Summary</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>${itemTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <View style={styles.freeOverBadge}>
                    <Text style={styles.freeOverText}>Free over $10</Text>
                  </View>
                </View>
                <Text style={styles.billValue}>
                  {isFreeDelivery ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                </Text>
              </View>

              {couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billDiscountLabel}>
                    Promo Discount ({appliedCoupon?.code})
                  </Text>
                  <Text style={styles.billDiscountValue}>
                    -${couponDiscount.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.billDivider} />

              <View style={styles.toPayRow}>
                <View>
                  <Text style={styles.toPayHeading}>To Pay</Text>
                  <Text style={styles.toPaySubtitle}>Inclusive of all local taxes</Text>
                </View>
                <Text style={styles.toPayAmount}>${finalToPay.toFixed(2)}</Text>
              </View>
            </View>

            {/* Free Delivery Progress Bar Hint */}
            {!isFreeDelivery && (
              <View style={styles.freeDeliveryBanner}>
                <Ionicons name="leaf" size={16} color="#657917" style={{ marginRight: 8 }} />
                <Text style={styles.freeDeliveryBannerText}>
                  Add <Text style={{ fontWeight: '800' }}>${neededForFree.toFixed(2)}</Text> more for Free Delivery
                </Text>
                <Text style={styles.freeDeliveryPercentText}>{progressPercent}%</Text>
              </View>
            )}
          </>
        )}

        {/* Bottom spacer for sticky bar and tabbar */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Sticky Checkout Bar (Only when items exist) */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalAmountLabel}>Total Amount</Text>
            <Text style={styles.totalAmountPrice}>${finalToPay.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.9}>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF7',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F8FAF7',
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3D34',
  },
  headerItemBadge: {
    backgroundColor: '#D4F468',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  headerItemBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3D34',
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Address Card
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    padding: 14,
    marginBottom: 16,
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressTextContent: {
    flex: 1,
  },
  deliveringToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  deliveringToLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  cityText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E3D34',
    marginBottom: 1,
  },
  streetText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  changeLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3D34',
  },

  addressDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },

  addressBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instantDeliveryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E3D34',
    flex: 1,
  },
  instantDeliveryTime: {
    fontWeight: '800',
  },
  fastLaneBadge: {
    backgroundColor: '#EBF9C5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fastLaneText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E3D34',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF0EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3D34',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4F468',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E3D34',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3D34',
  },
  coldChainText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Cart Items
  itemsList: {
    gap: 10,
    marginBottom: 14,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    padding: 10,
  },
  itemImgCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9F8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3D34',
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 11.5,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemPrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E3D34',
  },
  itemOriginalPrice: {
    fontSize: 11.5,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  // Stepper Pill
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F4',
    borderRadius: 18,
    height: 34,
    paddingHorizontal: 4,
  },
  stepperMinusBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMinusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3D34',
  },
  stepperQtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3D34',
    paddingHorizontal: 8,
  },
  stepperPlusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D4F468',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3D34',
  },

  // Coupon Applied Card
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFEF8',
    borderWidth: 1.5,
    borderColor: '#E2F2BF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  couponCardAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  applyCouponText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3D34',
  },
  couponIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D4F468',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  couponTextContent: {
    flex: 1,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  couponCodeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E3D34',
  },
  couponAppliedBadge: {
    backgroundColor: '#D4F468',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  couponAppliedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E3D34',
  },
  couponDiscountSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  couponCloseBtn: {
    padding: 4,
  },

  // Promo Input Row
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  promoTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3D34',
  },
  applyBtn: {
    backgroundColor: '#1E3D34',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Bill Summary
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    padding: 16,
    marginBottom: 12,
  },
  billHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3D34',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13.5,
    color: '#4B5563',
  },
  freeOverBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  freeOverText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#657917',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3D34',
  },
  billDiscountLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#657917',
  },
  billDiscountValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#657917',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  toPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toPayHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3D34',
  },
  toPaySubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  toPayAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3D34',
  },

  // Free Delivery Progress Banner
  freeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8E9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  freeDeliveryBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3D34',
  },
  freeDeliveryPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#657917',
  },

  // Bottom Sticky Floating Checkout Bar
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 88,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8ECE6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  totalAmountLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalAmountPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3D34',
  },
  checkoutBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#162E27',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
