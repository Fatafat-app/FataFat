import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { restaurantService } from '../../services/restaurant.service';
import { useLocationStore } from '../../store';
import { useCartStore } from '../../store/cart.store';
import { Restaurant, MenuItem } from '../../types';
import { RestaurantCard } from '../../components/ui/RestaurantCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Loading } from '../../components/ui/Loading';
import { Colors, Typography, BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { formatPaise } from '../../utils/formatters';

const THEME_COLOR = '#0D9488'; // Main App Color (Teal)

const formatDistance = (meters?: number) => {
  if (!meters) return '';
  return `${(meters / 1000).toFixed(1)} km`;
};

const POPULAR_TAGS = [
  { label: '🍕 Pizza', query: 'Pizza' },
  { label: '🍔 Burger', query: 'Burger' },
  { label: '🍛 Biryani', query: 'Biryani' },
  { label: '🥟 Momos', query: 'Momos' },
  { label: '🥪 Sandwich', query: 'Sandwich' },
  { label: '🍰 Desserts', query: 'Dessert' },
  { label: '🍜 Noodles', query: 'Noodles' },
  { label: '☕ Beverages', query: 'Coffee' },
  { label: '🥗 Healthy', query: 'Salad' },
  { label: '🥘 North Indian', query: 'Thali' },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q || '';

  const { currentLocation } = useLocationStore();
  const cartItemsCount = useCartStore((state) => state.getItemsCount());
  const cartTotal = useCartStore((state) => state.getItemsTotal());
  const cartRestaurant = useCartStore((state) => state.restaurant);

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isTyping, setIsTyping] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active filter tab: 'all' | 'restaurants' | 'dishes'
  const [activeTab, setActiveTab] = useState<'all' | 'restaurants' | 'dishes'>('all');
  const [vegOnly, setVegOnly] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Sync with route params if passed
  useEffect(() => {
    if (params.q) {
      const q = Array.isArray(params.q) ? params.q[0] : params.q;
      setQuery(q);
      setDebouncedQuery(q);
    }
  }, [params.q]);

  // Debouncing logic with 350ms delay
  useEffect(() => {
    if (query === debouncedQuery) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsTyping(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Search execution when debouncedQuery or location changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setRestaurants([]);
      setDishes([]);
      setError('');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const performSearch = async () => {
      setLoading(true);
      setError('');

      try {
        const [restaurantRes, dishRes] = await Promise.allSettled([
          restaurantService.searchRestaurants(
            trimmed,
            currentLocation?.latitude,
            currentLocation?.longitude
          ),
          restaurantService.searchMenuItems(trimmed),
        ]);

        if (!isMounted) return;

        const fetchedRestaurants = restaurantRes.status === 'fulfilled' ? restaurantRes.value || [] : [];
        const fetchedDishes = dishRes.status === 'fulfilled' ? dishRes.value || [] : [];

        setRestaurants(fetchedRestaurants);
        setDishes(fetchedDishes);

        if (restaurantRes.status === 'rejected' && dishRes.status === 'rejected') {
          setError('Failed to fetch search results. Please try again.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Search failed. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, currentLocation]);

  const handleSelectTag = (tagQuery: string) => {
    setQuery(tagQuery);
    setDebouncedQuery(tagQuery);
    setIsTyping(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setRestaurants([]);
    setDishes([]);
    setIsTyping(false);
    searchInputRef.current?.focus();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    setDebouncedQuery(query);
    setIsTyping(false);
  };

  // Filtered dishes
  const filteredDishes = vegOnly ? dishes.filter((d) => d.isVeg) : dishes;

  const totalResults = restaurants.length + filteredDishes.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={THEME_COLOR} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search restaurants, dishes, cuisines..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            autoFocus={!initialQuery}
            returnKeyType="search"
            clearButtonMode="never"
          />

          {isTyping && (
            <ActivityIndicator size="small" color={THEME_COLOR} style={{ marginRight: 6 }} />
          )}

          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs & Veg Filter bar if query is active */}
      {debouncedQuery.trim().length > 0 && !loading && totalResults > 0 && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, activeTab === 'all' && styles.filterChipActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.filterChipText, activeTab === 'all' && styles.filterChipTextActive]}>
                All ({totalResults})
              </Text>
            </TouchableOpacity>

            {restaurants.length > 0 && (
              <TouchableOpacity
                style={[styles.filterChip, activeTab === 'restaurants' && styles.filterChipActive]}
                onPress={() => setActiveTab('restaurants')}
              >
                <Text style={[styles.filterChipText, activeTab === 'restaurants' && styles.filterChipTextActive]}>
                  Restaurants ({restaurants.length})
                </Text>
              </TouchableOpacity>
            )}

            {dishes.length > 0 && (
              <TouchableOpacity
                style={[styles.filterChip, activeTab === 'dishes' && styles.filterChipActive]}
                onPress={() => setActiveTab('dishes')}
              >
                <Text style={[styles.filterChipText, activeTab === 'dishes' && styles.filterChipTextActive]}>
                  Dishes ({dishes.length})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.vegToggleChip, vegOnly && styles.vegToggleChipActive]}
              onPress={() => setVegOnly(!vegOnly)}
            >
              <View style={[styles.vegDot, { borderColor: '#10B981' }]}>
                <View style={[styles.vegInnerDot, { backgroundColor: '#10B981' }]} />
              </View>
              <Text style={[styles.vegToggleText, vegOnly && styles.vegToggleTextActive]}>
                Veg Only
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Body Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!debouncedQuery.trim() ? (
          <View style={styles.popularSection}>
            <Text style={styles.sectionHeading}>Trending & Popular</Text>
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.query}
                  style={styles.tagBtn}
                  onPress={() => handleSelectTag(tag.query)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagText}>{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchTipBox}>
              <Ionicons name="sparkles" size={20} color={THEME_COLOR} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.searchTipTitle}>Fast Debounced Search</Text>
                <Text style={styles.searchTipDesc}>
                  Type any restaurant name, cuisine, or specific dish to get live instant results.
                </Text>
              </View>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.centerContent}>
            <Loading message={`Searching for "${debouncedQuery}"...`} />
          </View>
        ) : error ? (
          <ErrorState
            title="Search Error"
            message={error}
            onRetry={() => setDebouncedQuery(query)}
          />
        ) : totalResults === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No matches found"
            message={`We couldn't find any restaurants or dishes matching "${debouncedQuery}"`}
          />
        ) : (
          <View style={styles.resultsContainer}>
            {/* RESTAURANTS SECTION */}
            {(activeTab === 'all' || activeTab === 'restaurants') && restaurants.length > 0 && (
              <View style={styles.resultsBlock}>
                <Text style={styles.blockTitle}>
                  Restaurants ({restaurants.length})
                </Text>
                {restaurants.map((r) => (
                  <RestaurantCard
                    key={r._id}
                    name={r.name}
                    imageUri={r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg'}
                    cuisines={r.cuisines?.join(', ') || 'Multi-Cuisine'}
                    rating={r.rating?.average || 4.0}
                    deliveryTime={`${r.estimatedDeliveryTime || 30} min`}
                    distance={formatDistance(r.distance)}
                    onPress={() => router.push(`/restaurant/${r._id}`)}
                  />
                ))}
              </View>
            )}

            {/* DISHES SECTION */}
            {(activeTab === 'all' || activeTab === 'dishes') && filteredDishes.length > 0 && (
              <View style={styles.resultsBlock}>
                <Text style={styles.blockTitle}>
                  Dishes & Items ({filteredDishes.length})
                </Text>
                {filteredDishes.map((item) => {
                  const restaurantObj = typeof item.restaurant === 'object' ? item.restaurant : null;
                  const restId = restaurantObj?._id || (typeof item.restaurant === 'string' ? item.restaurant : '');
                  const restName = restaurantObj?.name || 'Restaurant';

                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.dishCard}
                      onPress={() => {
                        if (restId) {
                          router.push(`/restaurant/${restId}`);
                        }
                      }}
                      activeOpacity={0.9}
                    >
                      <View style={styles.dishInfo}>
                        <View style={styles.dishTopRow}>
                          <View
                            style={[
                              styles.vegIndicator,
                              { borderColor: item.isVeg ? '#10B981' : '#EF4444' },
                            ]}
                          >
                            <View
                              style={[
                                styles.vegIndicatorDot,
                                { backgroundColor: item.isVeg ? '#10B981' : '#EF4444' },
                              ]}
                            />
                          </View>
                          {restaurantObj && (
                            <Text style={styles.dishRestaurantTag} numberOfLines={1}>
                              By {restName}
                            </Text>
                          )}
                        </View>

                        <Text style={styles.dishName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.dishPrice}>{formatPaise(item.price)}</Text>

                        {item.description ? (
                          <Text style={styles.dishDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>

                      {item.images && item.images[0] ? (
                        <Image
                          source={{ uri: item.images[0] }}
                          style={styles.dishImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.dishPlaceholder}>
                          <Ionicons name="fast-food-outline" size={28} color="#D1D5DB" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar if items exist */}
      {cartItemsCount > 0 && cartRestaurant && (
        <View style={styles.bottomCartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCountText}>
              {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'} | {formatPaise(cartTotal)}
            </Text>
            <Text style={styles.cartRestaurantName} numberOfLines={1}>
              From {cartRestaurant.name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: 8,
    marginRight: 6,
    marginLeft: -6,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: STYLISH_FONT,
    color: '#111827',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: THEME_COLOR,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  vegToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  vegToggleChipActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  vegDot: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vegInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegToggleText: {
    fontSize: 12,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
  },
  vegToggleTextActive: {
    color: '#065F46',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  loadingText: {
    marginTop: 14,
    color: '#6B7280',
    fontFamily: STYLISH_FONT,
    fontSize: 14,
  },
  popularSection: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FFF5EB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  tagText: {
    color: '#D94E1B',
    fontFamily: BOLD_FONT,
    fontSize: 13,
  },
  searchTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchTipTitle: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
    marginBottom: 2,
  },
  searchTipDesc: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    lineHeight: 18,
  },
  resultsContainer: {
    paddingBottom: 20,
  },
  resultsBlock: {
    marginBottom: 24,
  },
  blockTitle: {
    fontSize: 16,
    fontFamily: BOLD_FONT,
    color: '#111827',
    marginBottom: 14,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  dishInfo: {
    flex: 1,
    marginRight: 12,
  },
  dishTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vegIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishRestaurantTag: {
    fontSize: 11,
    fontFamily: BOLD_FONT,
    color: '#9CA3AF',
    flex: 1,
  },
  dishName: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#D94E1B',
    marginBottom: 4,
  },
  dishDesc: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    lineHeight: 16,
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  dishPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cartInfo: {
    flex: 1,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontFamily: BOLD_FONT,
    fontSize: 14,
  },
  cartRestaurantName: {
    color: '#9CA3AF',
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    marginTop: 2,
  },
  viewCartBtn: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontFamily: BOLD_FONT,
    fontSize: 13,
  },
});
