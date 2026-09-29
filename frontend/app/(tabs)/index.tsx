import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, ImageBackground, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, useLocationStore } from '../../store';
import { useCartStore } from '../../store/cart.store';
import { restaurantService } from '../../services/restaurant.service';
import { Restaurant } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { Typography, BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';

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

  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);
  const isScrolled = scrollY > 80;

  // Watermark Animation
  const watermarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(watermarkAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(watermarkAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ])
    ).start();
  }, []);

  const watermarkScale = watermarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });
  const watermarkOpacity = watermarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.16],
  });

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
      {isScrolled && (
        <View style={[styles.stickySearchBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.stickySearchInner} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.9}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <Text style={styles.stickySearchText}>Search restaurants, cuisines...</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
        bounces={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* HEADER */}
        <ImageBackground source={require('../../assets/images/top image.jpeg')} style={[styles.headerContainer, { paddingTop: insets.top + 10 }]} imageStyle={{ resizeMode: 'cover' }}>
          <View style={styles.headerMainRow}>
            <TouchableOpacity style={styles.locationContainer} onPress={detectCurrentLocation} activeOpacity={0.7}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location" size={18} color="#D97706" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationDeliveryLabel}>DELIVERING TO</Text>
                <View style={styles.locationRowInner}>
                  <Text style={styles.locationTitle} numberOfLines={1}>{locationTitle || 'Home'}</Text>
                  {isDetectingLocation ? (
                    <View style={{ marginLeft: 6 }}><Loading size="small" color="#4B5563" /></View>
                  ) : (
                    <Ionicons name="chevron-down" size={14} color="#4B5563" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.locationSubtitle} numberOfLines={1}>{locationSubtitle || 'Detecting location...'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.searchRow} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.9}>
            <View style={styles.searchContainer} pointerEvents="none">
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <Text style={styles.searchText}>Search for restaurants, cuisines...</Text>
            </View>
          </TouchableOpacity>
        </ImageBackground>

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
        <View style={[styles.sectionContainer, { paddingBottom: 100 }]}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  stickySearchBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  stickySearchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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

  headerContainer: {
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  locationIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center', justifyContent: 'center',
  },
  locationTextContainer: { marginLeft: 10, flex: 1 },
  locationDeliveryLabel: { fontFamily: BOLD_FONT, fontSize: 10, color: '#6B7280', letterSpacing: 1.2, marginBottom: 2 },
  locationRowInner: { flexDirection: 'row', alignItems: 'center' },
  locationTitle: { fontFamily: BOLD_FONT, fontSize: 16, color: '#1F2937' },
  locationSubtitle: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#4B5563', marginTop: 2 },
  headerWatermark: { position: 'absolute', top: -10, right: -15, width: 120, height: 120 },

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
