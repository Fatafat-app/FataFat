import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, Animated, Easing, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore, useLocationStore } from '../../store';
import { useCartStore } from '../../store/cart.store';
import { restaurantService } from '../../services/restaurant.service';
import { Restaurant } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { Typography, BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';
import { SectionSwitcher } from '../../components/SectionSwitcher';
import { GrocerySearch } from '../../components/grocery/GrocerySearch';
import { GroceryHome } from '../../components/grocery/GroceryHome';
import { GroceryTabBar } from '../../components/grocery/GroceryTabBar';
import { useGroceryStore } from '../../store/grocery.store';

const { width } = Dimensions.get('window');

const formatDistance = (meters?: number) => {
  if (!meters) return '';
  return `${(meters / 1000).toFixed(1)} km`;
};

const BANNERS = [
  { id: 1, title: 'Cravings?', subtitle: 'Ftafat!', desc: 'Delicious food delivered\nto your doorstep.', image: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg', bgColor: '#FFF0E6', textColor: '#D94E1B' },
  { id: 2, title: 'Midnight', subtitle: 'Hunger?', desc: 'Hot meals delivered\nin just 15 minutes!', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg', bgColor: '#EEF2FF', textColor: '#4F46E5' },
  { id: 3, title: 'Party', subtitle: 'Time!', desc: 'Flat 50% Off on\nlarge group orders.', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', bgColor: '#FDF7EC', textColor: '#D97706' },
  { id: 4, title: 'Healthy', subtitle: 'Eats', desc: 'Fresh salads &\njuices for you.', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', bgColor: '#ECFDF5', textColor: '#059669' },
  { id: 5, title: 'Spicy', subtitle: 'Desires!', desc: 'Sizzling hot dishes\nstraight from the tandoor.', image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg', bgColor: '#FEF2F2', textColor: '#DC2626' },
  { id: 6, title: 'Sweet', subtitle: 'Tooth?', desc: 'Indulge in desserts\nand fresh pastries.', image: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg', bgColor: '#FDF4FF', textColor: '#C026D3' },
];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.items.reduce((s, i) => s + i.quantity, 0));
  const { locationTitle, locationSubtitle, isDetectingLocation, detectCurrentLocation, currentLocation } = useLocationStore();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // Section switcher — food is default on app open
  const { activeSection, setSection } = useGroceryStore();
  const foodTranslate    = useRef(new Animated.Value(0)).current;
  const groceryTranslate = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleSectionSwitch = (section: 'food' | 'grocery') => {
    if (section === activeSection) return;
    setSection(section);
    Animated.parallel([
      Animated.timing(foodTranslate, {
        toValue: section === 'grocery' ? -SCREEN_WIDTH : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(groceryTranslate, {
        toValue: section === 'grocery' ? 0 : SCREEN_WIDTH,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);
  const isScrolled = scrollY > 80;

  const [categories, setCategories] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchCategories = async () => {
    try {
      const { api } = require('../../services/api');
      const resp = await api.get('/categories');
      const list = resp.data?.data?.categories || [];
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list);
      }
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  };

  const fetchRestaurants = async () => {
    try {
      if (!refreshing) setLoading(true);
      setFetchError(false);
      const lat = currentLocation?.latitude || 28.6139;
      const lng = currentLocation?.longitude || 77.2090;
      const data = await restaurantService.getNearbyRestaurants({
        lat,
        lng,
        radius: 50,
      });
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFetchError(true);
      setRestaurants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchRestaurants();
    if (!currentLocation && !isDetectingLocation) {
      detectCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchRestaurants();
    }
  }, [currentLocation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
    fetchRestaurants();
  }, [currentLocation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerScrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeBanner && index >= 0 && index < BANNERS.length) {
      setActiveBanner(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* ============================================================ */}
      {/* 1. FOOD DELIVERY SECTION                                      */}
      {/* ============================================================ */}
      {activeSection === 'food' && (
        <View style={styles.foodViewWrapper}>
          {/* Top Warm Coral/Peach Gradient matching Grocery gradient style */}
          <LinearGradient
            colors={['#FFDEBF', '#FFEBD9', '#FFF6EF', '#FFFFFF']}
            locations={[0, 0.3, 0.65, 1]}
            style={[styles.foodTopGradient, { height: insets.top + 280 }]}
          />

          {/* Top Food Header — Same structure as Grocery */}
          <View style={[styles.foodHeaderContainer, { paddingTop: insets.top + 6 }]}>
            {/* 1. Mode Switcher on Top */}
            <SectionSwitcher
              activeSection={activeSection}
              onSwitch={handleSectionSwitch}
              style={{ marginBottom: 12 }}
            />

            {/* 2. Location Row + User Profile Avatar */}
            <View style={styles.foodHeaderLocationRow}>
              <TouchableOpacity
                style={styles.foodLocationCol}
                onPress={() => router.push('/address')}
                activeOpacity={0.7}
              >
                <Text style={styles.foodDeliveringToLabel}>DELIVERING TO</Text>
                <View style={styles.foodLocationInner}>
                  <Ionicons name="location" size={17} color="#D94E1B" style={{ marginRight: 4 }} />
                  <Text style={styles.foodLocationTitle} numberOfLines={1}>
                    {locationTitle || selectedAddress?.type || selectedAddress?.label || 'Home'}
                  </Text>
                  {isDetectingLocation ? (
                    <View style={{ marginLeft: 6 }}><ActivityIndicator size="small" color="#D94E1B" /></View>
                  ) : (
                    <Ionicons name="chevron-down" size={15} color="#D94E1B" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.foodLocationSubtitle} numberOfLines={1}>
                  {locationSubtitle || (selectedAddress ? `${selectedAddress.city}` : 'Detecting GPS...')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.foodAvatarBtn}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.foodAvatarImage} />
                ) : (
                  <Text style={styles.foodAvatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 3. Pill Search Bar (Same UI as Grocery Search) */}
            <TouchableOpacity
              style={styles.foodSearchPill}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
              <Text style={styles.foodSearchPlaceholder}>Search restaurants, cuisines or dishes...</Text>
              <Ionicons name="mic-outline" size={19} color="#D94E1B" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
            bounces={false}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >

            {/* BANNERS CAROUSEL */}
            <View style={styles.bannerWrapper}>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                pagingEnabled
                snapToInterval={width}
                decelerationRate="fast"
                snapToAlignment="center"
              >
                {BANNERS.map((banner) => (
                  <View key={banner.id} style={[styles.bannerContainer, { backgroundColor: banner.bgColor }]}>
                    <View style={styles.bannerTextContent}>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={[styles.bannerSubtitle, { color: banner.textColor }]}>{banner.subtitle}</Text>
                      <Text style={styles.bannerDesc}>{banner.desc}</Text>
                    </View>
                    <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.dotsContainer}>
                {BANNERS.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeBanner && { backgroundColor: Colors.primary, width: 14 }]} />
                ))}
              </View>
            </View>

            {/* FOOD CATEGORIES */}
            {categories.length > 0 && (
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>What's on your mind?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
                  {categories.map((cat, idx) => (
                    <TouchableOpacity
                      key={cat._id || cat.id || idx}
                      style={styles.categoryItem}
                      onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: cat.name } })}
                    >
                      <View style={styles.categoryImageContainer}>
                        <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                      </View>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* RESTAURANTS NEAR YOU */}
            <View style={[styles.sectionContainer, { paddingBottom: 110 }]}>
              <Text style={styles.sectionTitle}>Restaurants Near You</Text>

              {loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Loading size="large" color={Colors.primary} />
                </View>
              ) : fetchError ? (
                <View style={styles.emptyState}>
                  <Ionicons name="wifi-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>Could not load restaurants</Text>
                  <Text style={styles.emptySubtitle}>Check your internet connection and pull down to refresh.</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchRestaurants}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : restaurants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No Restaurants Nearby</Text>
                  <Text style={styles.emptySubtitle}>We're expanding to your area soon! Try changing your location.</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={detectCurrentLocation}>
                    <Text style={styles.retryBtnText}>Change Location</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.restaurantsList}>
                  {restaurants.map((r) => (
                    <TouchableOpacity
                      key={r._id}
                      style={styles.restaurantCard}
                      onPress={() => router.push(`/restaurant/${r._id}`)}
                      activeOpacity={0.95}
                    >
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{ uri: r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg' }}
                          style={styles.cardImage}
                        />
                        <View style={styles.deliveryBadge}>
                          <Ionicons name="time" size={12} color="#FFF" />
                          <Text style={styles.deliveryBadgeText}>{r.estimatedDeliveryTime || 30} min</Text>
                        </View>
                        {!r.isOpen && (
                          <View style={styles.closedOverlay}>
                            <Text style={styles.closedText}>CLOSED</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardDetails}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
                          <View style={styles.ratingBox}>
                            <Text style={styles.ratingText}>{r.rating?.average?.toFixed(1) || '4.0'}</Text>
                            <Ionicons name="star" size={10} color="#FFF" />
                          </View>
                        </View>
                        <View style={styles.cardSubRow}>
                          <Text style={styles.cardCuisines} numberOfLines={1}>{r.cuisines?.join(', ') || 'Various Cuisines'}</Text>
                          {!!formatDistance(r.distance) && (
                            <Text style={styles.cardDistance}>{formatDistance(r.distance)}</Text>
                          )}
                        </View>
                        {r.pricing?.deliveryCharge === 0 ? (
                          <View style={styles.promoRow}>
                            <Ionicons name="flame" size={14} color="#D94E1B" />
                            <Text style={styles.promoText}>Free Delivery</Text>
                          </View>
                        ) : (
                          <View style={styles.promoRow}>
                            <Ionicons name="bicycle-outline" size={14} color="#6B7280" />
                            <Text style={[styles.promoText, { color: '#6B7280' }]}>
                              Delivery ₹{r.pricing?.deliveryCharge ? Math.round(r.pricing.deliveryCharge / 100) : 0}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. GROCERY SECTION (Light / White Design from Reference)     */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* 2. GROCERY SECTION (Yellowish-Greenish Gradient Top Design)  */}
      {/* ============================================================ */}
      {activeSection === 'grocery' && (
        <View style={styles.groceryMainWrapper}>
          {/* Top Yellowish-Greenish Gradient matching reference image */}
          <LinearGradient
            colors={['#DCF57C', '#EAF9AD', '#F5FCDE', '#FFFFFF']}
            locations={[0, 0.3, 0.65, 1]}
            style={[styles.groceryTopGradient, { height: insets.top + 280 }]}
          />

          {/* Top Grocery Header */}
          <View style={[styles.groceryHeaderContainer, { paddingTop: insets.top + 6 }]}>
            {/* 1. Mode Switcher */}
            <SectionSwitcher
              activeSection={activeSection}
              onSwitch={handleSectionSwitch}
              style={{ marginBottom: 12 }}
            />

            {/* 2. Location Row + User Profile Avatar */}
            <View style={styles.groceryHeaderLocationRow}>
              <TouchableOpacity
                style={styles.groceryLocationCol}
                onPress={() => router.push('/address')}
                activeOpacity={0.7}
              >
                <Text style={styles.groceryDeliveringToLabel}>DELIVERING TO</Text>
                <View style={styles.groceryLocationInner}>
                  <Ionicons name="location" size={17} color="#1E3D34" style={{ marginRight: 4 }} />
                  <Text style={styles.groceryLocationTitle} numberOfLines={1}>
                    {locationTitle || selectedAddress?.type || selectedAddress?.label || 'Home'}
                  </Text>
                  {isDetectingLocation ? (
                    <View style={{ marginLeft: 6 }}><ActivityIndicator size="small" color="#1E3D34" /></View>
                  ) : (
                    <Ionicons name="chevron-down" size={15} color="#1E3D34" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.groceryLocationSubtitle} numberOfLines={1}>
                  {locationSubtitle || (selectedAddress ? `${selectedAddress.city}` : 'Detecting GPS...')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.groceryAvatarBtn}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.groceryAvatarImage} />
                ) : (
                  <Text style={styles.groceryAvatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 3. Pill Search Bar */}
            <GrocerySearch onPress={() => router.push('/(tabs)/search')} />
          </View>

          {/* Grocery Scrollable Content */}
          <Animated.View style={styles.groceryFeedWrapper}>
            <GroceryHome />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  foodViewWrapper: { flex: 1 },
  groceryMainWrapper: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative' },
  groceryTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  groceryFeedWrapper: { flex: 1, zIndex: 1 },

  // Grocery Top Header — Matching screenshot
  groceryHeaderContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 4,
    zIndex: 10,
  },
  groceryHeaderLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  groceryLocationCol: {
    flex: 1,
    marginRight: 12,
  },
  groceryDeliveringToLabel: {
    fontSize: 11.5,
    color: '#6C7D76',
    fontWeight: '500',
    marginBottom: 2,
  },
  groceryLocationInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groceryLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3D34',
    letterSpacing: -0.2,
  },
  groceryLocationSubtitle: {
    fontSize: 11.5,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 1,
  },
  groceryAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4F468',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  groceryAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  groceryAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3D34',
  },


  stickySearchBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    backgroundColor: '#FF6000',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E05500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  stickySearchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stickySearchText: { fontFamily: STYLISH_FONT, color: '#9CA3AF', fontSize: 14, flex: 1 },

  foodViewWrapper: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative' },
  foodTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  foodHeaderContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 4,
    zIndex: 10,
  },
  foodHeaderLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  foodLocationCol: {
    flex: 1,
    marginRight: 12,
  },
  foodDeliveringToLabel: {
    fontSize: 11.5,
    color: '#8C502E',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  foodLocationInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1808',
    letterSpacing: -0.2,
  },
  foodLocationSubtitle: {
    fontSize: 11.5,
    color: '#6B4226',
    fontWeight: '500',
    marginTop: 1,
  },
  foodAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFB98A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  foodAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  foodAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D94E1B',
  },
  foodSearchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3DEC8',
    height: 44,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodSearchPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: '#8C502E',
    fontWeight: '400',
  },
  profileAvatarText: { fontFamily: BOLD_FONT, fontSize: 18, color: '#FF6000' },
  headerCartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    position: 'relative',
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  searchRow: { paddingHorizontal: 20 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16,
    paddingHorizontal: 16, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchText: { fontFamily: STYLISH_FONT, color: '#9CA3AF', flex: 1, fontSize: 14 },
  micCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  bannerWrapper: { marginBottom: 24 },
  bannerContainer: {
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 20,
    height: 170,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerTextContent: { flex: 1.2, padding: 20, justifyContent: 'center' },
  bannerTitle: { fontFamily: BOLD_FONT, fontSize: 18, color: '#1F2937' },
  bannerSubtitle: { fontFamily: BOLD_FONT, fontSize: 32, marginTop: -4, letterSpacing: -1 },
  bannerDesc: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#6B7280', marginTop: 8, lineHeight: 18 },
  bannerImage: { flex: 1, height: '100%' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4 },

  categoriesSection: { marginBottom: 24 },
  sectionTitle: { fontFamily: BOLD_FONT, fontSize: 18, color: '#1F2937', paddingHorizontal: 20, marginBottom: 16 },
  categoriesScroll: {},
  categoriesContent: { paddingHorizontal: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImageContainer: {
    width: 72, height: 72, borderRadius: 36,
    overflow: 'hidden', marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  categoryImage: { width: '100%', height: '100%' },
  categoryName: { fontFamily: BOLD_FONT, fontSize: 12, color: '#4B5563' },

  sectionContainer: {},
  restaurantsList: { paddingHorizontal: 20 },

  restaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImageContainer: { width: '100%', height: 180, backgroundColor: '#F3F4F6', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  deliveryBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  deliveryBadgeText: { fontFamily: BOLD_FONT, color: '#FFF', fontSize: 11, marginLeft: 4 },
  closedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closedText: { fontFamily: BOLD_FONT, color: '#FFF', fontSize: 20, letterSpacing: 2 },

  cardDetails: { padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontFamily: BOLD_FONT, fontSize: 18, color: '#1F2937', flex: 1, marginRight: 10 },
  ratingBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  ratingText: { fontFamily: BOLD_FONT, color: '#FFF', fontSize: 12, marginRight: 4 },
  cardSubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardCuisines: { fontFamily: STYLISH_FONT, fontSize: 13, color: '#6B7280', flex: 1 },
  cardDistance: { fontFamily: BOLD_FONT, fontSize: 12, color: '#9CA3AF' },
  promoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10 },
  promoText: { fontFamily: BOLD_FONT, fontSize: 11, color: '#D94E1B', marginLeft: 6 },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 48, paddingHorizontal: 32,
  },
  emptyTitle: { fontFamily: BOLD_FONT, fontSize: 18, color: '#374151', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontFamily: STYLISH_FONT, fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: { fontFamily: BOLD_FONT, color: '#FFF', fontSize: 14 },
});
