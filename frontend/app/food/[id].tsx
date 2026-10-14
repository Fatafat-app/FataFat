import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFoodProductDetailQuery } from '../../hooks';
import { useCartStore } from '../../store/cart.store';
import { useFavoritesStore } from '../../store/favorites.store';
import { formatPaise, formatDeliveryTime } from '../../utils/formatters';
import { BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';
import { Restaurant } from '../../types';

const { width } = Dimensions.get('window');

export default function FoodProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: item, isLoading, isError, refetch } = useFoodProductDetailQuery(id);

  // Cart Store
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartRestaurant = useCartStore((state) => state.restaurant);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemsCount = useCartStore((state) => state.getItemsCount);
  const getItemsTotal = useCartStore((state) => state.getItemsTotal);

  // Favorites
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const isFav = item?._id ? isFavorite(item._id) : false;

  const currentCartQuantity = item?._id
    ? cartItems
        .filter((ci) => ci.menuItem._id === item._id || (ci.menuItem as any).id === item._id)
        .reduce((sum, ci) => sum + ci.quantity, 0)
    : 0;

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `Check out ${item.name} on Ftafat! Delivered fresh in minutes.`,
      });
    } catch {
      // Ignored
    }
  };

  const handleToggleFav = () => {
    if (!item) return;
    const dishImage = item.images?.[0] || '';
    toggleFavorite({
      _id: item._id,
      name: item.name,
      price: item.price,
      images: item.images || [dishImage],
      image: dishImage,
      isVeg: item.isVeg,
      type: 'product',
      addedAt: Date.now(),
    });
  };

  const handleAddToCart = () => {
    if (!item) return;
    const rawRest: any = item.restaurant;
    const targetRestaurant: Restaurant = (typeof rawRest === 'object' && rawRest?._id)
      ? {
          _id: rawRest._id,
          name: rawRest.name || 'Restaurant',
          images: rawRest.images || [],
          isOpen: rawRest.isOpen !== false,
          rating: rawRest.rating || { average: 4.5, count: 10 },
          deliveryInfo: rawRest.deliveryInfo || { estimatedMinutes: 30, deliveryFee: 3000 },
          address: rawRest.address || { line1: 'Partner Store' },
        } as any
      : {
          _id: (typeof rawRest === 'string' ? rawRest : null) || 'ftft-kitchen',
          name: 'Partner Restaurant',
          images: [],
          isOpen: true,
          address: { line1: 'Partner Store' },
        } as any;

    const rawPrice = Number(item.price) || 0;
    const priceInPaise = rawPrice >= 100 ? rawPrice : rawPrice * 100;

    const formattedItem = {
      ...item,
      price: priceInPaise,
    };

    const success = addItem(formattedItem as any, targetRestaurant as any, []);
    if (!success) {
      Alert.alert(
        'Replace cart items?',
        `Your cart contains dishes from ${cartRestaurant?.name || 'another restaurant'}. Do you want to discard your previous selection and add items from ${targetRestaurant.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Replace',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(formattedItem as any, targetRestaurant as any, []);
            },
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading delicious details...</Text>
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <View style={styles.errorIconWrap}>
          <MaterialCommunityIcons name="food-off" size={48} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Dish Not Found</Text>
        <Text style={styles.errorSub}>
          This dish might be currently unavailable or moved to another section.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rawRest: any = item.restaurant;
  const restaurantId = typeof rawRest === 'object' && rawRest?._id ? rawRest._id : (typeof rawRest === 'string' ? rawRest : null);
  const restaurantName = typeof rawRest === 'object' && rawRest?.name ? rawRest.name : 'Kitchen Special';
  const restaurantAddress = typeof rawRest === 'object' && rawRest?.address ? (rawRest.address.line1 || rawRest.address.city || '') : '';
  const estimatedMins = typeof rawRest === 'object' && rawRest?.deliveryInfo?.estimatedMinutes ? rawRest.deliveryInfo.estimatedMinutes : 25;

  const rawPrice = Number(item.price) || 0;
  const priceInPaise = rawPrice >= 100 ? rawPrice : rawPrice * 100;
  const mrpPaise = priceInPaise + 4000;
  const discountPercent = Math.round(((mrpPaise - priceInPaise) / mrpPaise) * 100);

  const heroImage = item.images?.[0] || (item as any).image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80';
  const ratingScore = item.rating?.average ? item.rating.average.toFixed(1) : '4.6';
  const ratingCount = item.rating?.count || 48;
  const isVeg = item.isVeg !== false;

  const totalCartCount = getItemsCount();
  const totalCartPrice = getItemsTotal();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: totalCartCount > 0 ? 150 : 100 }}
      >
        {/* Hero Image Section */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.4)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar Floating Controls */}
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.circleBtn}
              activeOpacity={0.8}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.topRightBtns}>
              <TouchableOpacity
                style={styles.circleBtn}
                activeOpacity={0.8}
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={19} color="#0F172A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtn}
                activeOpacity={0.8}
                onPress={handleToggleFav}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFav ? '#EF4444' : '#0F172A'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Veg / Non-Veg & Bestseller Badges on Hero Bottom */}
          <View style={styles.heroBottomBadges}>
            <View style={[styles.vegBadge, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
              <View style={[styles.vegDot, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
              <Text style={[styles.vegText, { color: isVeg ? '#16A34A' : '#DC2626' }]}>
                {isVeg ? 'PURE VEG' : 'NON-VEG'}
              </Text>
            </View>

            {item.isBestseller && (
              <View style={styles.bestsellerBadge}>
                <Ionicons name="flame" size={12} color="#FFF" style={{ marginRight: 3 }} />
                <Text style={styles.bestsellerText}>BESTSELLER</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dish Title & Price Card */}
        <View style={styles.contentCard}>
          <Text style={styles.dishName}>{item.name}</Text>

          {/* Price & Rating Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceGroup}>
              <Text style={styles.currentPrice}>{formatPaise(priceInPaise)}</Text>
              <Text style={styles.mrpPrice}>{formatPaise(mrpPaise)}</Text>
              <View style={styles.discountPill}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            </View>

            {/* Rating Pill */}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#FBBF24" style={{ marginRight: 3 }} />
              <Text style={styles.ratingScore}>{ratingScore}</Text>
              <Text style={styles.ratingCount}>({ratingCount})</Text>
            </View>
          </View>

          {/* Description */}
          {item.description ? (
            <View style={styles.descSection}>
              <Text style={styles.descHeading}>About this dish</Text>
              <Text style={styles.descText}>{item.description}</Text>
            </View>
          ) : null}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.map((t, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Restaurant Information Card */}
          <View style={styles.restaurantSection}>
            <View style={styles.restaurantRow}>
              <View style={styles.restaurantIcon}>
                <MaterialCommunityIcons name="storefront-outline" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurantBy}>Prepared & Packed by</Text>
                <Text style={styles.restaurantName} numberOfLines={1}>{restaurantName}</Text>
                {restaurantAddress ? (
                  <Text style={styles.restaurantAddress} numberOfLines={1}>{restaurantAddress}</Text>
                ) : null}
              </View>
            </View>

            {/* Delivery Info Sub-row */}
            <View style={styles.deliveryInfoRow}>
              <View style={styles.deliveryPill}>
                <Ionicons name="time-outline" size={14} color="#0D9488" style={{ marginRight: 4 }} />
                <Text style={styles.deliveryPillText}>{formatDeliveryTime(estimatedMins)}</Text>
              </View>
              <View style={styles.deliveryPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.deliveryPillText}>Ftafat Guaranteed Fresh</Text>
              </View>
            </View>

            {/* View Full Menu Button */}
            {restaurantId && (
              <TouchableOpacity
                style={styles.viewMenuBtn}
                activeOpacity={0.8}
                onPress={() => router.push(`/restaurant/${restaurantId}` as any)}
              >
                <Text style={styles.viewMenuText}>View Full Restaurant Menu</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Guarantee Badges */}
          <View style={styles.featuresCard}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Ionicons name="restaurant-outline" size={18} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Cooked Fresh to Order</Text>
                <Text style={styles.featureSub}>Prepared after order placement for peak taste</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Ionicons name="cube-outline" size={18} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Tamper-Proof Packaging</Text>
                <Text style={styles.featureSub}>Sealed tightly in insulated food-safe containers</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPriceValue}>
            {formatPaise(priceInPaise * Math.max(currentCartQuantity, 1))}
          </Text>
        </View>

        {currentCartQuantity > 0 ? (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={() => updateQuantity(item._id, -1)}
              style={styles.stepperBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="remove" size={18} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.stepperQuantity}>{currentCartQuantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item._id, 1)}
              style={styles.stepperBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addToCartBtn}
            activeOpacity={0.88}
            onPress={handleAddToCart}
          >
            <Ionicons name="bag-add" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.addToCartText}>ADD TO BASKET</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Floating View Cart Bar if Cart has Items */}
      {totalCartCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push('/(tabs)/cart' as any)}
          style={[styles.floatingCartBar, { bottom: Math.max(insets.bottom, 12) + 72 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{totalCartCount}</Text>
            </View>
            <View>
              <Text style={styles.cartSummaryTitle}>Items in Cart</Text>
              <Text style={styles.cartSummaryPrice}>{formatPaise(totalCartPrice)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    fontFamily: STYLISH_FONT,
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 6,
  },
  errorSub: {
    fontFamily: STYLISH_FONT,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
  },
  primaryBtnText: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#FFF',
  },
  imageContainer: {
    width: '100%',
    height: 330,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heroBottomBadges: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  vegText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bestsellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  bestsellerText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  dishName: {
    fontFamily: BOLD_FONT,
    fontSize: 22,
    color: '#0F172A',
    lineHeight: 28,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontFamily: BOLD_FONT,
    fontSize: 22,
    color: '#0F172A',
  },
  mrpPrice: {
    fontFamily: STYLISH_FONT,
    fontSize: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  discountText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#059669',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingScore: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#0F172A',
    marginRight: 2,
  },
  ratingCount: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#64748B',
  },
  descSection: {
    marginBottom: 16,
  },
  descHeading: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  descText: {
    fontFamily: STYLISH_FONT,
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  restaurantSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantBy: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#64748B',
    marginBottom: 1,
  },
  restaurantName: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: '#0F172A',
  },
  restaurantAddress: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryPillText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#0F172A',
  },
  viewMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CCFBF1',
    gap: 4,
  },
  viewMenuText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: Colors.primary,
  },
  featuresCard: {
    gap: 12,
    paddingTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  featureTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 12.5,
    color: '#0F172A',
  },
  featureSub: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#64748B',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#64748B',
  },
  bottomPriceValue: {
    fontFamily: BOLD_FONT,
    fontSize: 20,
    color: '#0F172A',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addToCartText: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  stepperBtn: {
    padding: 3,
  },
  stepperQuantity: {
    fontFamily: BOLD_FONT,
    fontSize: 16,
    color: '#FFF',
    minWidth: 20,
    textAlign: 'center',
  },
  floatingCartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cartCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#FFF',
  },
  cartSummaryTitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 10,
    color: '#94A3B8',
  },
  cartSummaryPrice: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#FFF',
  },
  viewCartText: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#FFF',
  },
});
