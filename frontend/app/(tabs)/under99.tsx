import React, { useState, useMemo, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { useUnder99ProductsQuery } from '../../hooks/useRestaurantQueries';
import { useCartStore } from '../../store/cart.store';
import { useLocationStore } from '../../store/location.store';
import { useFavoritesStore } from '../../store/favorites.store';
import { formatPaise } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;
const DEFAULT_FOOD_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';

type PriceFilter = 'all' | 'under49' | 'under69' | 'under99';
type CategoryFilter = 'all' | 'meals' | 'snacks' | 'beverages' | 'desserts' | 'breads';

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All Deals', icon: 'sparkles' },
  { id: 'meals', label: 'Meals @ ₹99', icon: 'restaurant' },
  { id: 'snacks', label: 'Snacks & Bites', icon: 'fast-food' },
  { id: 'beverages', label: 'Chai & Drinks', icon: 'cafe' },
  { id: 'breads', label: 'Naan & Breads', icon: 'pizza' },
  { id: 'desserts', label: 'Desserts', icon: 'ice-cream' },
];

export default function Under99Screen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'rating'>('popular');

  const { locationTitle } = useLocationStore();
  const { items: cartItems, addItem, updateQuantity, clearCart, restaurant: cartRestaurant } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const { data: rawProducts = [], isLoading, refetch, isRefetching } = useUnder99ProductsQuery(vegOnly ? true : undefined);

  // Price helper
  const getProductPrice = (item: any) => {
    const raw = Number(item.price) || 0;
    const paise = raw >= 100 ? raw : raw * 100;
    const rupees = Math.round(paise / 100);
    const mrp = Math.round(rupees * 1.32);
    return { paise, rupees, mrp };
  };

  // Image helper
  const getDishImage = (item: any) => {
    if (item.images && item.images.length > 0 && item.images[0]) {
      return item.images[0].replace(/&amp;/g, '&');
    }
    if (item.image) {
      return item.image.replace(/&amp;/g, '&');
    }
    return DEFAULT_FOOD_IMG;
  };

  // Restaurant info extractor
  const getRestaurantInfo = (item: any) => {
    const r = item.restaurant;
    if (typeof r === 'object' && r) {
      return {
        id: r._id || r.id || '',
        name: r.name || 'Kitchen Special',
        rating: typeof r.rating === 'object' ? r.rating?.average : r.rating || 4.3,
        coverImage: r.coverImage || DEFAULT_FOOD_IMG,
      };
    }
    return {
      id: typeof r === 'string' ? r : '',
      name: 'Kitchen Special',
      rating: 4.3,
      coverImage: DEFAULT_FOOD_IMG,
    };
  };

  // Cart quantity check
  const getItemQtyInCart = (id: string) => {
    const found = cartItems.find((ci: any) => (ci.menuItem?._id || ci.menuItem?.id) === id);
    return found ? found.quantity : 0;
  };

  // Add to cart handler
  const handleAddToCart = (prod: any) => {
    const { paise } = getProductPrice(prod);
    const rest = getRestaurantInfo(prod);

    const targetRestaurant = typeof prod.restaurant === 'object' && prod.restaurant
      ? prod.restaurant
      : {
          _id: rest.id || 'ftft-99-kitchen',
          name: rest.name,
          image: rest.coverImage || DEFAULT_FOOD_IMG,
          address: { street: 'Local Express Kitchen' },
        };

    const formattedItem = {
      _id: prod._id || prod.id || `u99-${prod.name.replace(/\s+/g, '-')}`,
      name: prod.name,
      price: paise,
      description: prod.description || 'Curated ₹99 Store value meal',
      images: prod.images || (prod.image ? [prod.image] : [DEFAULT_FOOD_IMG]),
      isVeg: prod.isVeg !== false,
      restaurant: targetRestaurant._id,
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

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = [...rawProducts];

    // Veg filter
    if (vegOnly) {
      list = list.filter((p: any) => p.isVeg !== false);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p: any) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const rest = typeof p.restaurant === 'object' ? (p.restaurant?.name || '').toLowerCase() : '';
        const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
        return name.includes(q) || desc.includes(q) || rest.includes(q) || tags.includes(q);
      });
    }

    // Price filters
    if (priceFilter === 'under49') {
      list = list.filter((p: any) => getProductPrice(p).rupees <= 49);
    } else if (priceFilter === 'under69') {
      list = list.filter((p: any) => getProductPrice(p).rupees <= 69);
    } else if (priceFilter === 'under99') {
      list = list.filter((p: any) => getProductPrice(p).rupees <= 99);
    }

    // Category filters
    if (selectedCategory !== 'all') {
      list = list.filter((p: any) => {
        const text = `${p.name || ''} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (selectedCategory === 'meals') return text.includes('meal') || text.includes('thali') || text.includes('rice') || text.includes('combo');
        if (selectedCategory === 'snacks') return text.includes('snack') || text.includes('momo') || text.includes('fries') || text.includes('vada') || text.includes('roll');
        if (selectedCategory === 'beverages') return text.includes('tea') || text.includes('coffee') || text.includes('beverage') || text.includes('drink') || text.includes('shake');
        if (selectedCategory === 'breads') return text.includes('naan') || text.includes('roti') || text.includes('paratha') || text.includes('bread');
        if (selectedCategory === 'desserts') return text.includes('jamun') || text.includes('sweet') || text.includes('dessert') || text.includes('ice');
        return true;
      });
    }

    // Sorting
    if (sortBy === 'priceAsc') {
      list.sort((a: any, b: any) => getProductPrice(a).rupees - getProductPrice(b).rupees);
    } else if (sortBy === 'rating') {
      list.sort((a: any, b: any) => {
        const rA = typeof a.rating === 'object' ? a.rating?.average || 0 : a.rating || 0;
        const rB = typeof b.rating === 'object' ? b.rating?.average || 0 : b.rating || 0;
        return rB - rA;
      });
    }

    return list;
  }, [rawProducts, vegOnly, searchQuery, priceFilter, selectedCategory, sortBy]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const totalCartValue = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.totalItemPrice, 0);
  }, [cartItems]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.topLocationWrapper}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#0D9488" />
            <Text style={styles.locationTitle} numberOfLines={1}>
              {locationTitle || 'Nearby Restaurants'}
            </Text>
          </View>
          <Text style={styles.subBrand}>99 Store • Super Saver Zone</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cart' as any)}
          style={styles.cartIconButton}
          activeOpacity={0.8}
        >
          <Ionicons name="bag-handle" size={20} color="#0D9488" />
          {totalCartCount > 0 && (
            <View style={styles.topCartBadge}>
              <Text style={styles.topCartBadgeText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#0D9488']} />
        }
      >
        {/* Hero 99 Store Banner */}
        <LinearGradient
          colors={['#0D9488', '#0F766E', '#115E59']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.brandBadgeRow}>
              <View style={styles.storeTagCircle}>
                <Text style={styles.storeTag99}>99</Text>
              </View>
              <Text style={styles.storeTagText}>STORE</Text>
              <View style={styles.flashTag}>
                <Ionicons name="flash" size={10} color="#FEF08A" />
                <Text style={styles.flashTagText}>EVERYTHING UNDER ₹99</Text>
              </View>
            </View>

            <Text style={styles.heroHeadline}>Pocket Friendly Feast</Text>
            <Text style={styles.heroSubtitle}>
              Signature dishes, snacks & drinks from ₹49 to ₹99 with Free Delivery!
            </Text>

            <View style={styles.perksRow}>
              <View style={styles.perkChip}>
                <Ionicons name="checkmark-circle" size={12} color="#A7F3D0" />
                <Text style={styles.perkText}>Zero Delivery Fee</Text>
              </View>
              <View style={styles.perkChip}>
                <Ionicons name="restaurant-outline" size={12} color="#A7F3D0" />
                <Text style={styles.perkText}>Top Rated Kitchens</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Search Bar Inside 99 Store */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search dishes or restaurants under ₹99..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Veg Only Toggle */}
          <TouchableOpacity
            onPress={() => setVegOnly(!vegOnly)}
            activeOpacity={0.8}
            style={[styles.vegToggleBtn, vegOnly && styles.vegToggleBtnActive]}
          >
            <View style={[styles.vegIndicatorCircle, { borderColor: vegOnly ? '#16A34A' : '#94A3B8' }]}>
              <View style={[styles.vegIndicatorDot, { backgroundColor: vegOnly ? '#16A34A' : 'transparent' }]} />
            </View>
            <Text style={[styles.vegToggleText, vegOnly && styles.vegToggleTextActive]}>
              Veg Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price Filter Chips */}
        <View style={styles.priceRow}>
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'under49', label: 'Under ₹49' },
            { id: 'under69', label: 'Under ₹69' },
            { id: 'under99', label: 'Under ₹99' },
          ].map((pf) => (
            <TouchableOpacity
              key={pf.id}
              onPress={() => setPriceFilter(pf.id as PriceFilter)}
              style={[styles.priceChip, priceFilter === pf.id && styles.priceChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.priceChipText, priceFilter === pf.id && styles.priceChipTextActive]}>
                {pf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#0D9488'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort & Results Bar */}
        <View style={styles.metaBar}>
          <Text style={styles.countText}>
            Showing <Text style={{ fontFamily: BOLD_FONT, color: '#0F172A' }}>{filteredProducts.length}</Text> value items
          </Text>

          <View style={styles.sortRow}>
            {(['popular', 'priceAsc', 'rating'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setSortBy(mode)}
                style={[styles.sortChip, sortBy === mode && styles.sortChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.sortChipText, sortBy === mode && styles.sortChipTextActive]}>
                  {mode === 'popular' ? 'Popular' : mode === 'priceAsc' ? 'Price ↑' : 'Rating ★'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Product Grid */}
        {isLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.card, { backgroundColor: '#F1F5F9', height: 250 }]} />
            ))}
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="fast-food-outline" size={44} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySubtitle}>
              Try changing your price filter or search query to discover more meals under ₹99!
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setPriceFilter('all');
                setSelectedCategory('all');
                setVegOnly(false);
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((prod: any) => {
              const prodId = prod._id || prod.id;
              const { rupees, mrp } = getProductPrice(prod);
              const rest = getRestaurantInfo(prod);
              const qty = getItemQtyInCart(prodId);
              const isFav = isFavorite(prodId);

              return (
                <TouchableOpacity
                  key={prodId}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/food/[id]', params: { id: prodId } } as any)}
                >
                  {/* Card Image Container */}
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{ uri: getDishImage(prod) }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />

                    {/* Veg/Non-Veg Badge */}
                    <View style={styles.vegBadge}>
                      <View
                        style={[
                          styles.vegBox,
                          { borderColor: prod.isVeg !== false ? '#16A34A' : '#DC2626' },
                        ]}
                      >
                        <View
                          style={[
                            styles.vegDot,
                            { backgroundColor: prod.isVeg !== false ? '#16A34A' : '#DC2626' },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Favorite Heart Button */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite({
                          _id: prodId,
                          name: prod.name,
                          price: prod.price,
                          images: prod.images || (prod.image ? [prod.image] : []),
                          isVeg: prod.isVeg !== false,
                          type: 'product',
                        });
                      }}
                      style={styles.favBtn}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={17}
                        color={isFav ? '#EF4444' : '#FFFFFF'}
                      />
                    </TouchableOpacity>

                    {/* Value Badge */}
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>DEAL ₹{rupees}</Text>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.dishName} numberOfLines={2}>
                      {prod.name}
                    </Text>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (rest.id) router.push(`/restaurant/${rest.id}`);
                      }}
                      style={styles.restaurantRow}
                      hitSlop={4}
                    >
                      <Ionicons name="storefront-outline" size={11} color="#64748B" />
                      <Text style={styles.restaurantName} numberOfLines={1}>
                        {rest.name}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.ratingPriceRow}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceRupees}>₹{rupees}</Text>
                        {mrp > rupees && <Text style={styles.mrpText}>₹{mrp}</Text>}
                      </View>

                      {rest.rating ? (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={10} color="#F59E0B" />
                          <Text style={styles.ratingText}>
                            {typeof rest.rating === 'number' ? rest.rating.toFixed(1) : rest.rating}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action / Stepper Button */}
                    <View style={styles.actionBtnRow}>
                      {qty === 0 ? (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(prod);
                          }}
                          style={styles.addButton}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={15} color="#0D9488" />
                          <Text style={styles.addButtonText}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              updateQuantity(prodId, -1);
                            }}
                            style={styles.stepperBtn}
                            hitSlop={6}
                          >
                            <Ionicons name="remove" size={13} color="#FFFFFF" />
                          </TouchableOpacity>
                          <Text style={styles.stepperText}>{qty}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              updateQuantity(prodId, 1);
                            }}
                            style={styles.stepperBtn}
                            hitSlop={6}
                          >
                            <Ionicons name="add" size={13} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom Spacer for TabBar and Floating Cart */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View style={[styles.floatingCartWrap, { bottom: Platform.OS === 'ios' ? 100 : 90 }]}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cart' as any)}
            activeOpacity={0.9}
            style={styles.floatingCartBar}
          >
            <View style={styles.floatingLeft}>
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>{totalCartCount}</Text>
              </View>
              <View>
                <Text style={styles.floatingCountText}>
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in Cart
                </Text>
                <Text style={styles.floatingAmountText}>{formatPaise(totalCartValue)}</Text>
              </View>
            </View>

            <View style={styles.floatingRight}>
              <Text style={styles.viewCartText}>View Cart</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topLocationWrapper: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#0F172A',
    flexShrink: 1,
  },
  subBrand: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '700',
    marginTop: 1,
  },
  cartIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F97316',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  topCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  scrollBody: {
    paddingBottom: 24,
  },
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  heroContent: {
    gap: 6,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  storeTagCircle: {
    backgroundColor: '#FEF08A',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  storeTag99: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '900',
  },
  storeTagText: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  flashTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  flashTagText: {
    fontFamily: BOLD_FONT,
    fontSize: 9,
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  heroHeadline: {
    fontFamily: BOLD_FONT,
    fontSize: 21,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#CCFBF1',
    lineHeight: 16,
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#F0FDFA',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: STYLISH_FONT,
    fontSize: 13,
    color: '#0F172A',
    height: '100%',
  },
  vegToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  vegToggleBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  vegIndicatorCircle: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegToggleText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#64748B',
  },
  vegToggleTextActive: {
    color: '#16A34A',
  },
  priceRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  priceChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  priceChipText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#64748B',
  },
  priceChipTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryTabActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  categoryTabText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#334155',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  countText: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#64748B',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  sortChipActive: {
    backgroundColor: '#0D9488',
  },
  sortChipText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#64748B',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vegBox: {
    width: 11,
    height: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: '#0D9488',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontFamily: BOLD_FONT,
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  dishName: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#0F172A',
    height: 34,
    lineHeight: 17,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restaurantName: {
    fontFamily: STYLISH_FONT,
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  ratingPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceRupees: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: '#0D9488',
    fontWeight: '900',
  },
  mrpText: {
    fontFamily: STYLISH_FONT,
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontFamily: BOLD_FONT,
    fontSize: 9,
    color: '#92400E',
    fontWeight: '800',
  },
  actionBtnRow: {
    marginTop: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 6,
    gap: 2,
  },
  addButtonText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '900',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '900',
  },
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 17,
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetBtnText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#FFFFFF',
  },
  floatingCartWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 998,
  },
  floatingCartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F766E',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadgeText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '900',
  },
  floatingCountText: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#CCFBF1',
  },
  floatingAmountText: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  floatingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  viewCartText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
