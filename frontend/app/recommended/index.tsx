import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { useRecommendedProductsQuery, useHomeFeedQuery } from '../../hooks';
import { useCartStore } from '../../store/cart.store';
import { useLocationStore } from '../../store/location.store';
import { useFavoritesStore } from '../../store/favorites.store';
import { formatPaise } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;
const DEFAULT_FOOD_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';

const getDishImage = (item: any) => {
  if (item?.images && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0].replace(/&amp;/g, '&');
  }
  if (item?.image) {
    return item.image.replace(/&amp;/g, '&');
  }
  const lower = (item?.name || '').toLowerCase();
  if (lower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80';
  if (lower.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80';
  if (lower.includes('biryani') || lower.includes('rice')) return 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&q=80';
  if (lower.includes('fries')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80';
  if (lower.includes('coffee') || lower.includes('shake') || lower.includes('tea')) return 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80';
  if (lower.includes('cake') || lower.includes('dessert') || lower.includes('sweet')) return 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=500&q=80';
  if (lower.includes('wrap') || lower.includes('roll')) return 'https://images.unsplash.com/photo-1626804475297-41609ae0f4dc?w=500&q=80';
  if (lower.includes('momo') || lower.includes('dimsum')) return 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500&q=80';
  if (lower.includes('tikka') || lower.includes('paneer') || lower.includes('curry')) return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80';
  if (lower.includes('chicken') || lower.includes('wing')) return 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&q=80';
  if (lower.includes('dosa') || lower.includes('idli')) return 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80';
  return DEFAULT_FOOD_IMG;
};

type QuickFilter = 'all' | 'veg' | 'bestseller' | 'topRated' | 'under199';

export default function RecommendedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc'>('popular');

  const { locationTitle, currentLocation, activeCity } = useLocationStore();
  const { items: cartItems, addItem, updateQuantity, clearCart, restaurant: cartRestaurant, getItemsCount, getItemsTotal } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  // Queries
  const { data: queryProducts = [], isLoading: loadingQuery, refetch: refetchQuery, isRefetching } = useRecommendedProductsQuery();
  const { data: homeFeed, refetch: refetchFeed } = useHomeFeedQuery({
    lat: currentLocation?.latitude,
    lng: currentLocation?.longitude,
  });

  // Combine & deduplicate recommendations from home feed + query
  const allProducts = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    const feedRecommended = homeFeed?.recommended || [];
    for (const item of feedRecommended) {
      const id = String((item as any)?._id || (item as any)?.id || '');
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push(item);
      }
    }

    for (const item of queryProducts) {
      const id = String((item as any)?._id || (item as any)?.id || '');
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push(item);
      }
    }

    return list;
  }, [homeFeed?.recommended, queryProducts]);

  // Price extractor
  const getProductPrice = (item: any) => {
    const raw = Number(item.price) || 0;
    const paise = raw >= 100 ? raw : raw * 100;
    const rupees = Math.round(paise / 100);
    const mrp = Math.round(rupees * 1.3);
    return { paise, rupees, mrp };
  };

  // Cart quantity check
  const getItemQtyInCart = (id: string) => {
    const found = cartItems.find((ci: any) => String(ci.menuItem?._id || ci.menuItem?.id) === String(id));
    return found ? found.quantity : 0;
  };

  // Add to cart with cross-restaurant check
  const handleAddToCart = (item: any) => {
    const rawRest = item.restaurant;
    const restObj: any = {
      _id: (typeof rawRest === 'object' && rawRest?._id) ? rawRest._id : (typeof rawRest === 'string' ? rawRest : item.restaurantId || 'rest-default'),
      name: (typeof rawRest === 'object' && rawRest?.name) ? rawRest.name : (item.restaurantName || 'Kitchen Special'),
      rating: (typeof rawRest === 'object' && rawRest?.rating?.average) ? rawRest.rating.average : 4.5,
      deliveryTime: 25,
      minOrderAmount: 0,
      isActive: true,
      isOpen: true,
    };

    const priceInfo = getProductPrice(item);
    const normalizedMenuItem: any = {
      ...item,
      _id: item._id || item.id,
      name: item.name || 'Special Dish',
      price: priceInfo.paise,
      restaurant: restObj._id,
      isAvailable: true,
    };

    const added = addItem(normalizedMenuItem, restObj);
    if (!added) {
      Alert.alert(
        'Replace cart items?',
        `Your cart contains items from "${cartRestaurant?.name || 'another restaurant'}". Would you like to clear your cart and add this item?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Replace',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(normalizedMenuItem, restObj);
            },
          },
        ]
      );
    }
  };

  // Filter & Search logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const restName = (typeof p.restaurant === 'object' ? p.restaurant?.name : p.restaurantName || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || restName.includes(q);
      });
    }

    // Quick filters
    if (activeFilter === 'veg') {
      result = result.filter((p) => p.isVeg !== false);
    } else if (activeFilter === 'bestseller') {
      result = result.filter((p) => p.isBestseller || (p.tags && p.tags.includes('Bestseller')));
    } else if (activeFilter === 'topRated') {
      result = result.filter((p) => {
        const rating = typeof p.rating === 'object' ? p.rating?.average : Number(p.rating) || 0;
        return rating >= 4.4;
      });
    } else if (activeFilter === 'under199') {
      result = result.filter((p) => {
        const { rupees } = getProductPrice(p);
        return rupees <= 199;
      });
    }

    // Sorting
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => getProductPrice(a).rupees - getProductPrice(b).rupees);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => getProductPrice(b).rupees - getProductPrice(a).rupees);
    }

    return result;
  }, [allProducts, searchQuery, activeFilter, sortBy]);

  const onRefresh = async () => {
    await Promise.all([refetchQuery(), refetchFeed()]);
  };

  const totalCartCount = getItemsCount();
  const totalCartValue = getItemsTotal();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="chef-hat" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Recommended for You</Text>
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {locationTitle ? `Delivering to ${locationTitle}` : 'Handpicked dishes tailored for you'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cart' as any)}
          style={styles.cartHeaderButton}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={22} color={Colors.text} />
          {totalCartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in recommended dishes..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              ✨ All ({allProducts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'veg' && styles.filterChipActiveVeg]}
            onPress={() => setActiveFilter(activeFilter === 'veg' ? 'all' : 'veg')}
            activeOpacity={0.75}
          >
            <View style={styles.vegDot} />
            <Text style={[styles.filterChipText, activeFilter === 'veg' && styles.filterChipTextActiveVeg]}>
              Pure Veg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'bestseller' && styles.filterChipActive]}
            onPress={() => setActiveFilter(activeFilter === 'bestseller' ? 'all' : 'bestseller')}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === 'bestseller' && styles.filterChipTextActive]}>
              ★ Bestsellers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'topRated' && styles.filterChipActive]}
            onPress={() => setActiveFilter(activeFilter === 'topRated' ? 'all' : 'topRated')}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === 'topRated' && styles.filterChipTextActive]}>
              ⭐ 4.5+ Rated
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'under199' && styles.filterChipActive]}
            onPress={() => setActiveFilter(activeFilter === 'under199' ? 'all' : 'under199')}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === 'under199' && styles.filterChipTextActive]}>
              ⚡ Under ₹199
            </Text>
          </TouchableOpacity>

          {/* Sort Pill */}
          <TouchableOpacity
            style={[styles.filterChip, sortBy !== 'popular' && styles.filterChipActive]}
            onPress={() => {
              if (sortBy === 'popular') setSortBy('priceAsc');
              else if (sortBy === 'priceAsc') setSortBy('priceDesc');
              else setSortBy('popular');
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="swap-vertical" size={13} color={sortBy !== 'popular' ? Colors.primary : '#64748B'} />
            <Text style={[styles.filterChipText, sortBy !== 'popular' && styles.filterChipTextActive]}>
              {sortBy === 'priceAsc' ? 'Price: Low' : sortBy === 'priceDesc' ? 'Price: High' : 'Sort'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          totalCartCount > 0 && { paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Count banner */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing <Text style={{ fontFamily: BOLD_FONT, color: Colors.text }}>{filteredProducts.length}</Text> handpicked dishes
          </Text>
        </View>

        {/* 2-Column Product Grid */}
        {loadingQuery && allProducts.length === 0 ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.card, { height: 260, backgroundColor: '#F8FAFC' }]} />
            ))}
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="food-off" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No recommended dishes found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search keywords or resetting active filters.</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setActiveFilter('all');
                setSortBy('popular');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((prod, idx) => {
              const prodId = String(prod._id || prod.id || `rec-${idx}`);
              const dishImage = getDishImage(prod);
              const { paise, rupees, mrp } = getProductPrice(prod);
              const qty = getItemQtyInCart(prodId);
              const isFav = isFavorite(prodId);
              const isVeg = prod.isVeg !== false;
              const rawRest = prod.restaurant;
              const restName = (typeof rawRest === 'object' && rawRest?.name) ? rawRest.name : (prod.restaurantName || 'Kitchen Special');
              const rating = typeof prod.rating === 'object' ? prod.rating?.average?.toFixed(1) : (Number(prod.rating) ? Number(prod.rating).toFixed(1) : '4.8');
              const isBestseller = prod.isBestseller || (idx % 3 === 0);

              return (
                <TouchableOpacity
                  key={prodId}
                  style={styles.card}
                  activeOpacity={0.94}
                  onPress={() => router.push({ pathname: '/food/[id]', params: { id: prodId } } as any)}
                >
                  {/* Image Container */}
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: dishImage }} style={styles.image} resizeMode="cover" />

                    {/* Veg / Non-Veg Indicator */}
                    <View style={styles.vegBadge}>
                      <View style={[styles.vegSquare, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                        <View style={[styles.vegCircle, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
                      </View>
                    </View>

                    {/* Bestseller Badge */}
                    {isBestseller && (
                      <View style={styles.bestsellerBadge}>
                        <Text style={styles.bestsellerText}>★ BESTSELLER</Text>
                      </View>
                    )}

                    {/* Favorite Heart */}
                    <TouchableOpacity
                      style={styles.heartButton}
                      activeOpacity={0.8}
                      onPress={(e: any) => {
                        e.stopPropagation?.();
                        toggleFavorite({
                          _id: prodId,
                          name: prod.name,
                          price: prod.price,
                          images: prod.images || (dishImage ? [dishImage] : []),
                          image: dishImage,
                          isVeg: isVeg,
                          type: 'product',
                          rating: Number(rating) || 4.8,
                          addedAt: Date.now(),
                        });
                      }}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isFav ? '#EF4444' : '#FFFFFF'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Card Details */}
                  <View style={styles.cardBody}>
                    <Text style={styles.dishName} numberOfLines={1}>
                      {prod.name}
                    </Text>

                    <Text style={styles.restName} numberOfLines={1}>
                      {restName}
                    </Text>

                    {/* Rating row */}
                    <View style={styles.ratingRow}>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.ratingText}>{rating}</Text>
                      </View>
                      <Text style={styles.prepTime}>• 20-25m</Text>
                    </View>

                    {/* Price and Add to Cart Row */}
                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.priceText}>₹{rupees}</Text>
                        {mrp > rupees && <Text style={styles.mrpText}>₹{mrp}</Text>}
                      </View>

                      {qty > 0 ? (
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={(e: any) => {
                              e.stopPropagation?.();
                              updateQuantity(prodId, -1);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="remove" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={(e: any) => {
                              e.stopPropagation?.();
                              updateQuantity(prodId, 1);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="add" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addButton}
                          activeOpacity={0.85}
                          onPress={(e: any) => {
                            e.stopPropagation?.();
                            handleAddToCart(prod);
                          }}
                        >
                          <Text style={styles.addButtonText}>ADD</Text>
                          <Ionicons name="add" size={13} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View style={[styles.floatingCartWrap, { bottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.floatingCart}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/cart' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.cartIconCircle}>
                <Ionicons name="cart" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.floatingCartCount}>
                  {totalCartCount} {totalCartCount === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
                <Text style={styles.floatingCartTotal}>{formatPaise(totalCartValue)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.floatingCartAction}>View Cart</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  headerTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cartHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: STYLISH_FONT,
    fontSize: 13,
    color: Colors.text,
    padding: 0,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#F0FDFA',
    borderColor: Colors.primary,
  },
  filterChipActiveVeg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  filterChipText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  filterChipTextActiveVeg: {
    color: '#16A34A',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  scrollContent: {
    padding: 16,
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  imageWrap: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 3,
    borderRadius: 5,
  },
  vegSquare: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bestsellerBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestsellerText: {
    fontFamily: BOLD_FONT,
    fontSize: 8.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 10,
  },
  dishName: {
    fontFamily: BOLD_FONT,
    fontSize: 13.5,
    color: Colors.text,
    lineHeight: 18,
  },
  restName: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    gap: 2,
  },
  ratingText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#FFFFFF',
  },
  prepTime: {
    fontFamily: STYLISH_FONT,
    fontSize: 10,
    color: '#94A3B8',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceText: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: Colors.text,
  },
  mrpText: {
    fontFamily: STYLISH_FONT,
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  addButtonText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: Colors.primary,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 6,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: BOLD_FONT,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  resetButtonText: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#FFFFFF',
  },
  floatingCartWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99,
  },
  floatingCart: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cartIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartCount: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  floatingCartTotal: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#FFFFFF',
  },
  floatingCartAction: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
