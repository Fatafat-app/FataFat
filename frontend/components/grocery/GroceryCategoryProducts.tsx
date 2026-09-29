import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GColors, GRadius, GSpacing, GShadow } from '../../constants/GroceryTheme';
import { GroceryProduct } from '../../constants/GroceryData';
import { groceryService, BackendGroceryCategory, BackendGroceryProduct } from '../../services/grocery.service';
import { useGroceryStore, useGroceryCartCount, useGroceryCartTotal } from '../../store/grocery.store';
import { useLocationStore } from '../../store/location.store';
import { GroceryTabBar } from './GroceryTabBar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 2 - 12) / 2;

type SortOption = 'price_asc' | 'price_desc' | 'popularity' | 'rating';

export function GroceryCategoryProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string; name?: string }>();

  const cartCount = useGroceryCartCount();
  const cartTotal = useGroceryCartTotal();
  const { locationSubtitle, locationTitle, selectedAddress } = useLocationStore();
  const { cart, addToCart, incrementQty, decrementQty, toggleWishlist, wishlist } = useGroceryStore();

  const [category, setCategory] = useState<BackendGroceryCategory | null>(null);
  const [products, setProducts] = useState<GroceryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subcategory tabs & filters
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [activeSort, setActiveSort] = useState<SortOption>('price_asc');
  const [discountOnly, setDiscountOnly] = useState(false);

  const categorySlug = params.slug || 'cooking-oils-ghee';

  const fetchCategoryData = useCallback(async () => {
    try {
      const [allCats, prodsRes] = await Promise.all([
        groceryService.getCategories(),
        groceryService.getProducts({
          category: categorySlug,
          sort: activeSort,
          filter: discountOnly ? 'deals' : undefined,
        }),
      ]);

      const matchedCat = allCats.find(
        (c) => c.slug === categorySlug || c._id === categorySlug
      );
      if (matchedCat) {
        setCategory(matchedCat);
      }

      if (prodsRes && prodsRes.products) {
        const mapped: GroceryProduct[] = prodsRes.products.map((p) => ({
          id: p._id || p.slug,
          _id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          originalPrice: p.originalPrice,
          unit: p.unit,
          image:
            p.images && p.images.length > 0
              ? ( (!p.images[0] || p.images[0].includes('pexels')) ? getImageForName(p.name) : p.images[0] )
              : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
          images: p.images,
          badge: (p.badge as any) || undefined,
          discount: p.discount,
          rating: p.rating || 4.7,
        }));
        setProducts(mapped);
      }
    } catch (_err) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [categorySlug, activeSort, discountOnly]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategoryData();
    setRefreshing(false);
  };

  const getSubcategories = () => {
    if (categorySlug.includes('oil') || categorySlug.includes('ghee')) {
      return [
        { id: 'all', label: `All Oils (${products.length})` },
        { id: 'olive', label: 'Olive Oil' },
        { id: 'ghee', label: 'Ghee & Butter' },
        { id: 'organic', label: 'Organic' },
      ];
    }
    return [
      { id: 'all', label: `All (${products.length})` },
      { id: 'organic', label: 'Organic' },
      { id: 'deals', label: 'Top Deals' },
      { id: 'daily', label: 'Daily Essentials' },
    ];
  };

  const subcategories = getSubcategories();

  const toggleSort = () => {
    setActiveSort((prev) => (prev === 'price_asc' ? 'price_desc' : 'price_asc'));
  };

  const categoryTitle = category?.name || params.name || 'Cooking Oils & Ghee';

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1E3D34" />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryTitleText}>{categoryTitle}</Text>
            <Ionicons name="chevron-down" size={16} color="#1E3D34" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.headerSubtitle}>
            {products.length} items found in pantry
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={21} color="#1E3D34" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={21} color="#1E3D34" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E3D34']}
            tintColor="#1E3D34"
          />
        }
      >
        {/* Instant 10 Min Delivery Pill Banner */}
        <TouchableOpacity style={styles.deliveryPill} activeOpacity={0.9}>
          <View style={styles.deliveryBoltCircle}>
            <Ionicons name="flash" size={13} color="#1E3D34" />
          </View>
          <Text style={styles.deliveryBoldText}>Instant 10 Min Delivery</Text>
          <Text style={styles.deliveryDot}>•</Text>
          <Text style={styles.deliveryLocationText} numberOfLines={1}>
            {selectedAddress?.city || locationSubtitle || locationTitle || 'Your Location'}
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#D4F468" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Subcategories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcatScroll}
          style={styles.subcatScrollView}
        >
          {subcategories.map((sub) => {
            const isSelected = selectedSubcat === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[styles.subcatChip, isSelected ? styles.subcatChipActive : styles.subcatChipInactive]}
                onPress={() => setSelectedSubcat(sub.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subcatChipText,
                    { color: isSelected ? '#1E3D34' : '#4B5563', fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {sub.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort & Filter Bar */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterChip} onPress={toggleSort} activeOpacity={0.8}>
            <Ionicons name="swap-vertical" size={14} color="#1E3D34" style={{ marginRight: 4 }} />
            <Text style={styles.filterChipText}>
              Sort: Price {activeSort === 'price_asc' ? '(Low to High)' : '(High to Low)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, discountOnly && styles.filterChipActive]}
            onPress={() => setDiscountOnly((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, discountOnly && { color: '#1E3D34', fontFamily: BOLD_FONT }]}>
              Discount
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterChip} activeOpacity={0.8}>
            <Text style={styles.filterChipText}>Brand</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.8}>
            <Ionicons name="options-outline" size={16} color="#1E3D34" />
          </TouchableOpacity>
        </View>

        {/* 2-Column Product Grid */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1E3D34" />
          </View>
        ) : products.length > 0 ? (
          <View style={styles.grid}>
            {products.map((product) => {
              const prodId = product._id || product.id;
              const cartItem = cart.find((i) => (i.product._id || i.product.id) === prodId);
              const qty = cartItem?.quantity ?? 0;
              const isWishlisted = wishlist.includes(prodId);

              // Badge styling
              let badgeBg = '#D4F468';
              let badgeTextColor = '#1E3D34';
              let badgeLabel = product.discount || (product.badge ? 'Bestseller' : null);

              if (product.badge === 'best_seller' || badgeLabel === 'Bestseller') {
                badgeBg = '#162E27';
                badgeTextColor = '#FFFFFF';
                badgeLabel = 'Bestseller';
              } else if (badgeLabel === 'Everyday Value') {
                badgeBg = '#F3F4F6';
                badgeTextColor = '#4B5563';
              } else if (badgeLabel === 'Cold Pressed') {
                badgeBg = '#D4F468';
                badgeTextColor = '#1E3D34';
              }

              return (
                <View key={prodId} style={styles.productCard}>
                  {/* Top Image Container */}
                  <View style={styles.cardImageContainer}>
                    {badgeLabel && (
                      <View style={[styles.productBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.productBadgeText, { color: badgeTextColor }]}>
                          {badgeLabel}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.cardWishlistBtn}
                      onPress={() => toggleWishlist(prodId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isWishlisted ? 'heart' : 'heart-outline'}
                        size={15}
                        color={isWishlisted ? '#EF4444' : '#9CA3AF'}
                      />
                    </TouchableOpacity>

                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImg}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Rating */}
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingValue}>{product.rating || '4.8'}</Text>
                    <Text style={styles.ratingCount}>(94)</Text>
                  </View>

                  {/* Title & Unit */}
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productUnit}>{product.unit}</Text>

                  {/* Price & Add / Stepper */}
                  <View style={styles.priceRow}>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceText}>₹{product.price.toFixed(0)}</Text>
                      {product.originalPrice && (
                        <Text style={styles.originalPriceText}>
                          ₹{product.originalPrice.toFixed(0)}
                        </Text>
                      )}
                    </View>

                    {/* Stepper or Add Button */}
                    {qty > 0 ? (
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => decrementQty(prodId)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepQtyText}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.stepBtn, styles.stepBtnAdd]}
                          onPress={() => incrementQty(prodId)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.stepBtnText, { color: '#1E3D34' }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addCircleBtn}
                        onPress={() => addToCart(product)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.addCircleText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found in this category.</Text>
          </View>
        )}

        {/* Quality & Trust Banner Card */}
        <View style={styles.trustBanner}>
          <View style={styles.trustIconCircle}>
            <Ionicons name="checkmark-circle" size={24} color="#1E3D34" />
          </View>
          <View style={styles.trustTextContent}>
            <Text style={styles.trustTitle}>100% Cold-Pressed & Certified Pure</Text>
            <Text style={styles.trustSubtitle}>
              Sourced directly from verified organic farms across Southeast Asia.
            </Text>
          </View>
        </View>

        {/* Bottom padding for tab / floating cart */}
        <View style={{ height: cartCount > 0 ? 170 : 120 }} />
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCartBar, GShadow.level3]}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartCountPill}>
            <Text style={styles.cartCountPillText}>
              {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
            </Text>
          </View>

          <View style={styles.cartPriceCol}>
            <Text style={styles.cartPriceAmount}>₹{cartTotal.toFixed(0)}</Text>
            <Text style={styles.cartFreeDeliveryText}>plus free delivery</Text>
          </View>

          <View style={styles.viewCartBtn}>
            <Text style={styles.viewCartBtnText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={14} color="#D4F468" style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Tab Bar */}
      <GroceryTabBar activeTab="categories" />
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
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitleText: {
    fontSize: 16.5,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Instant Delivery Pill
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162E27',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  deliveryBoltCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4F468',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  deliveryBoldText: {
    fontSize: 11.5,
    fontFamily: BOLD_FONT,
    color: '#D4F468',
  },
  deliveryDot: {
    color: '#9CA3AF',
    marginHorizontal: 6,
    fontSize: 12,
  },
  deliveryLocationText: {
    fontSize: 11.5,
    color: '#E5E7EB',
    maxWidth: 130,
  },

  // Subcategories
  subcatScrollView: {
    marginBottom: 12,
  },
  subcatScroll: {
    gap: 8,
  },
  subcatChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  subcatChipActive: {
    backgroundColor: '#D4F468',
    borderColor: '#D4F468',
  },
  subcatChipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8ECE6',
  },
  subcatChipText: {
    fontSize: 12.5,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 32,
  },
  filterChipActive: {
    backgroundColor: '#D4F468',
    borderColor: '#D4F468',
  },
  filterChipText: {
    fontSize: 11.5,
    fontFamily: STYLISH_FONT,
    color: '#374151',
  },
  filterIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  // Product Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    padding: 10,
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9F8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  productBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  productBadgeText: {
    fontSize: 9.5,
    fontFamily: BOLD_FONT,
  },
  cardWishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  productImg: {
    width: '80%',
    height: '80%',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 11,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
  },
  ratingCount: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  productName: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
    lineHeight: 17,
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceText: {
    fontSize: 14.5,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
  },
  originalPriceText: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  addCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#162E27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: BOLD_FONT,
    lineHeight: 20,
  },

  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F7F2',
    borderRadius: 14,
    height: 28,
    paddingHorizontal: 2,
  },
  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnAdd: {
    backgroundColor: '#D4F468',
  },
  stepBtnText: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
  },
  stepQtyText: {
    fontSize: 12,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
    paddingHorizontal: 6,
  },

  // Quality Banner
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  trustIconCircle: {
    marginRight: 10,
  },
  trustTextContent: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 12.5,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
    marginBottom: 2,
  },
  trustSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },

  loaderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
  },

  // Floating Cart
  floatingCartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 82 : 72,
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#162E27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 900,
    shadowColor: '#162E27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cartCountPill: {
    backgroundColor: '#D4F468',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  cartCountPillText: {
    color: '#1E3D34',
    fontSize: 12,
    fontFamily: BOLD_FONT,
  },
  cartPriceCol: {
    flex: 1,
    marginLeft: 12,
  },
  cartPriceAmount: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#FFFFFF',
  },
  cartFreeDeliveryText: {
    fontSize: 10,
    color: '#A7C4B8',
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartBtnText: {
    color: '#D4F468',
    fontSize: 13,
    fontFamily: BOLD_FONT,
  },
});
