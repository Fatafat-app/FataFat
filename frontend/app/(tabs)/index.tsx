import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, useLocationStore, useCartStore } from '../../store';
import { restaurantService } from '../../services/restaurant.service';
import { Restaurant } from '../../types';
import { RestaurantCard } from '../../components/ui/RestaurantCard';
import { Loading } from '../../components/ui/Loading';
import { Typography, BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

const formatDistance = (meters?: number) => {
  if (!meters) return '';
  return `${(meters / 1000).toFixed(1)} km`;
};

// Premium Dummy Restaurants for fallback
const DUMMY_RESTAURANTS: any[] = [
  {
    _id: 'd1',
    name: 'Ftafat Signature Kitchen',
    images: ['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'],
    cuisines: ['North Indian', 'Biryani'],
    rating: { average: 4.8, count: 420 },
    estimatedDeliveryTime: 25,
    distance: 1200,
  },
  {
    _id: 'd2',
    name: 'The Burger Cartel',
    images: ['https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg'],
    cuisines: ['American', 'Fast Food'],
    rating: { average: 4.5, count: 185 },
    estimatedDeliveryTime: 35,
    distance: 2100,
  },
  {
    _id: 'd3',
    name: 'Napoli Pizzeria',
    images: ['https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg'],
    cuisines: ['Italian', 'Pizzas'],
    rating: { average: 4.9, count: 850 },
    estimatedDeliveryTime: 40,
    distance: 3500,
  }
];

const DUMMY_PRODUCTS = [
  { id: 'p1', name: 'Peri Peri Fries', price: 149, restaurant: 'The Burger Cartel', image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg', rating: 4.5 },
  { id: 'p2', name: 'Chicken Biryani', price: 299, restaurant: 'Ftafat Signature Kitchen', image: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg', rating: 4.8 },
  { id: 'p3', name: 'Margherita Pizza', price: 349, restaurant: 'Napoli Pizzeria', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg', rating: 4.7 },
  { id: 'p4', name: 'Cold Coffee', price: 129, restaurant: 'Cafe Ftafat', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg', rating: 4.2 },
];

const TOP_BRANDS = [
  { id: 'b1', name: 'Domino\'s', offer: 'Flat 50% OFF', image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg', time: '25 min' },
  { id: 'b2', name: 'KFC', offer: 'Free Delivery', image: 'https://images.pexels.com/photos/27900698/pexels-photo-27900698.jpeg', time: '20 min' },
  { id: 'b3', name: 'Burger King', offer: 'Buy 1 Get 1', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', time: '30 min' },
  { id: 'b4', name: 'Starbucks', offer: 'Up to ₹100 OFF', image: 'https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg', time: '15 min' },
];

const HEALTHY_OPTIONS = [
  { id: 'h1', name: 'Quinoa Salad Bowl', calories: '250 kcal', restaurant: 'Fit Food Kitchen', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', rating: 4.9 },
  { id: 'h2', name: 'Avocado Toast', calories: '320 kcal', restaurant: 'Fresh & Green', image: 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg', rating: 4.7 },
  { id: 'h3', name: 'Grilled Chicken Breast', calories: '280 kcal', restaurant: 'Protein Hub', image: 'https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg', rating: 4.8 },
];

const POCKET_DEALS = [
  { id: 'd1', title: 'Craving Combo', subtitle: 'Burger + Fries + Coke', price: '₹129', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg' },
  { id: 'd2', title: 'Midnight Snack', subtitle: 'Large Pizza + Garlic Bread', price: '₹249', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
];

const MOODS = [
  { id: 'm1', emoji: '🎉', name: 'Party', query: 'Pizza' },
  { id: 'm2', emoji: '😍', name: 'Sweet Tooth', query: 'Desserts' },
  { id: 'm3', emoji: '😴', name: 'Late Night', query: 'Burger' },
  { id: 'm4', emoji: '💪', name: 'Healthy', query: 'Salad' },
  { id: 'm5', emoji: '🔥', name: 'Spicy', query: 'Biryani' },
];

export default function HomeScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { locationTitle, locationSubtitle, isDetectingLocation, detectCurrentLocation, currentLocation } = useLocationStore();
  const { addItem, clearCart } = useCartStore();
  const insets = useSafeAreaInsets();
  
  const [activeBanner, setActiveBanner] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);
  const isScrolled = scrollY > 80; // Header collapses after 80px scroll
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingDummyData, setUsingDummyData] = useState(false);

  useEffect(() => {
    if (!currentLocation && !isDetectingLocation) {
      detectCurrentLocation();
    }
  }, []);

  const fetchRestaurants = async () => {
    if (!currentLocation) return;
    try {
      if (!refreshing) setLoading(true);
      const data = await restaurantService.getNearbyRestaurants({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radius: 5000,
      });
      
      if (data && data.length > 0) {
        setRestaurants(data);
        setUsingDummyData(false);
      } else {
        setRestaurants(DUMMY_RESTAURANTS);
        setUsingDummyData(true);
      }
    } catch (err: any) {
      setRestaurants(DUMMY_RESTAURANTS);
      setUsingDummyData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddDummyProduct = (product: typeof DUMMY_PRODUCTS[0]) => {
    const fakeRestaurant = {
      _id: `res_${product.id}`,
      name: product.restaurant,
      pricing: { deliveryCharge: 3000 }, // 30 rs
    } as any;

    const fakeMenuItem = {
      _id: product.id,
      name: product.name,
      price: product.price * 100, // paise
      description: 'A delicious Ftafat choice.',
      category: 'Recommended',
      isVeg: true,
      isAvailable: true,
    } as any;

    const success = addItem(fakeMenuItem, fakeRestaurant);
    if (!success) {
      Alert.alert('Different Restaurant', 'Your cart contains items from another restaurant. Do you want to clear the cart and add this item?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear & Add', 
          style: 'destructive', 
          onPress: () => {
            clearCart();
            addItem(fakeMenuItem, fakeRestaurant);
            Alert.alert('Added', `${product.name} has been added to your cart.`);
          }
        }
      ]);
    } else {
      Alert.alert('Added', `${product.name} has been added to your cart.`);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      fetchRestaurants();
    }
  }, [currentLocation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRestaurants();
  }, [currentLocation]);

  const banners = [
    { id: 1, title: 'Cravings?', subtitle: 'Ftafat!', desc: 'Delicious food delivered\nto your doorstep.', image: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg', bgColor: '#FFF0E6', textColor: '#D94E1B' },
    { id: 2, title: 'Midnight', subtitle: 'Hunger?', desc: 'Hot meals delivered\nin just 15 minutes!', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg', bgColor: '#EEF2FF', textColor: '#4F46E5' },
    { id: 3, title: 'Party', subtitle: 'Time!', desc: 'Flat 50% Off on\nlarge group orders.', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', bgColor: '#FDF7EC', textColor: '#D97706' },
    { id: 4, title: 'Healthy', subtitle: 'Eats', desc: 'Fresh salads &\njuices for you.', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', bgColor: '#ECFDF5', textColor: '#059669' },
    { id: 5, title: 'Sweet', subtitle: 'Tooth?', desc: 'Desserts to make\nyour day brighter.', image: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg', bgColor: '#FCE7F3', textColor: '#DB2777' },
    { id: 6, title: 'Spicy', subtitle: 'Delights', desc: 'Taste the fire\nwith our specials.', image: 'https://images.pexels.com/photos/2611477/pexels-photo-2611477.jpeg', bgColor: '#FEF2F2', textColor: '#DC2626' }
  ];

  useEffect(() => {
    const scrollTimer = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(scrollTimer);
  }, [banners.length]);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeBanner && index >= 0 && index < banners.length) {
      setActiveBanner(index);
    }
  };

  const categories = [
    { id: 1, name: 'Pizza', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
    { id: 2, name: 'Burger', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
    { id: 3, name: 'Paratha', image: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' },
    { id: 4, name: 'Biryani', image: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' },
    { id: 5, name: 'Noodles', image: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  ];

  return (
    <View style={styles.container}>
      {/* STICKY COMPACT SEARCH BAR - only visible when scrolled */}
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
        {/* FULL HEADER — scrolls away */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          {/* HEADER MAIN ROW — Location Left, Profile Right */}
          <View style={styles.headerMainRow}>

            {/* LOCATION (LEFT) */}
            <TouchableOpacity style={styles.locationContainer} onPress={detectCurrentLocation} activeOpacity={0.7}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location" size={18} color="#FFF" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationDeliveryLabel}>DELIVERING TO</Text>
                <View style={styles.locationRowInner}>
                  <Text style={styles.locationTitle} numberOfLines={1}>{locationTitle || 'Home'}</Text>
                  {isDetectingLocation ? (
                    <View style={{ marginLeft: 6 }}><Loading size="small" color="#3E2723" /></View>
                  ) : (
                    <Ionicons name="chevron-down" size={14} color="#3E2723" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.locationSubtitle} numberOfLines={1}>{locationSubtitle || 'Detecting location...'}</Text>
              </View>
            </TouchableOpacity>

            {/* PROFILE AVATAR (RIGHT) */}
            <TouchableOpacity style={styles.profileAvatar} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'F'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <TouchableOpacity style={styles.searchRow} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.9}>
            <View style={styles.searchContainer} pointerEvents="none">
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <Text style={styles.searchText}>Search for restaurants, cuisines...</Text>
              <View style={styles.micCircle}>
                <Ionicons name="mic" size={16} color={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.diwaliPoster} onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'Sweets' } })} activeOpacity={0.9}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/13401111/pexels-photo-13401111.jpeg' }} 
            style={styles.diwaliBgImage} 
          />
          <View style={styles.diwaliOverlay}>
            <View style={styles.diwaliBadge}>
              <Text style={styles.diwaliBadgeText}>FESTIVE SPECIAL 🪔</Text>
            </View>
            <Text style={styles.diwaliTitle}>Diwali Dhamaka Sale!</Text>
            <Text style={styles.diwaliSubtitle}>Flat 50% OFF on Sweets, Desserts & Premium Biryanis. Treat your family today!</Text>
            
            <View style={styles.diwaliBtn}>
              <Text style={styles.diwaliBtnText}>CLAIM OFFER NOW</Text>
              <Ionicons name="arrow-forward" size={16} color="#B45309" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </TouchableOpacity>

        {/* BANNERS */}
        <View style={styles.bannerWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleBannerScroll}
            scrollEventThrottle={16}
            pagingEnabled
            snapToInterval={width}
            decelerationRate="fast"
            snapToAlignment="center"
          >
            {banners.map((banner) => (
              <View key={banner.id} style={[styles.bannerContainer, { backgroundColor: banner.bgColor }]}>
                <View style={styles.bannerTextContent}>
                  <Text style={styles.bannerCravings}>{banner.title}</Text>
                  <Text style={[styles.bannerFtafat, { color: banner.textColor }]}>{banner.subtitle}</Text>
                  <Text style={styles.bannerDesc}>{banner.desc}</Text>
                </View>
                <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
          <View style={styles.dotsContainer}>
            {banners.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeBanner && { backgroundColor: Colors.primary, width: 14 }]} />
            ))}
          </View>
        </View>

        {/* CATEGORIES */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: cat.name }})}>
                <View style={styles.categoryImageContainer}>
                  <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TOP BRANDS / SPONSORED */}
        <View style={styles.horizontalSection}>
          <Text style={styles.sectionTitle}>Top Brands for you</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {TOP_BRANDS.map((brand) => (
              <TouchableOpacity key={brand.id} style={styles.brandCard} onPress={() => {}}>
                <View style={styles.brandImageWrapper}>
                  <Image source={{ uri: brand.image }} style={styles.brandImage} />
                  <View style={styles.brandOfferBadge}>
                    <Text style={styles.brandOfferText}>{brand.offer}</Text>
                  </View>
                </View>
                <Text style={styles.brandName}>{brand.name}</Text>
                <View style={styles.brandMetaRow}>
                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                  <Text style={styles.brandMetaText}>{brand.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FEATURED PRODUCTS */}
        <View style={styles.horizontalSection}>
          <Text style={styles.sectionTitle}>Recommended Dishes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {DUMMY_PRODUCTS.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard} onPress={() => {}}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.ratingBadgeSm}>
                      <Text style={styles.ratingTextSm}>{product.rating}</Text>
                      <Ionicons name="star" size={8} color="#FFF" />
                    </View>
                  </View>
                  <Text style={styles.productRestaurant}>{product.restaurant}</Text>
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                    <TouchableOpacity style={styles.addBtnSm} onPress={() => handleAddDummyProduct(product)}>
                      <Text style={styles.addBtnTextSm}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* RESTAURANTS LIST */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Restaurants Near You</Text>
            {usingDummyData && (
              <View style={styles.dummyBadge}>
                <Text style={styles.dummyBadgeText}>DEMO MODE</Text>
              </View>
            )}
          </View>
          
          {loading ? (
            <View style={{ padding: 40 }}><Loading size="large" color={Colors.primary} /></View>
          ) : (
            <View style={styles.premiumRestaurantsList}>
              {restaurants.map(r => (
                <TouchableOpacity 
                  key={r._id} 
                  style={styles.premiumRestaurantCard}
                  onPress={() => router.push(`/restaurant/${r._id}`)}
                  activeOpacity={0.95}
                >
                  <View style={styles.prImageContainer}>
                    <Image 
                      source={{ uri: r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg' }} 
                      style={styles.prImage} 
                    />
                    <View style={styles.prDeliveryBadge}>
                      <Ionicons name="time" size={12} color="#FFF" />
                      <Text style={styles.prDeliveryText}>{r.estimatedDeliveryTime || 30} min</Text>
                    </View>
                  </View>
                  <View style={styles.prDetails}>
                    <View style={styles.prHeaderRow}>
                      <Text style={styles.prName} numberOfLines={1}>{r.name}</Text>
                      <View style={styles.prRatingBox}>
                        <Text style={styles.prRatingText}>{r.rating?.average || 4.2}</Text>
                        <Ionicons name="star" size={10} color="#FFF" />
                      </View>
                    </View>
                    <View style={styles.prSubRow}>
                      <Text style={styles.prCuisines} numberOfLines={1}>{r.cuisines?.join(', ') || 'Various Cuisines'}</Text>
                      <Text style={styles.prDistance}>{formatDistance(r.distance) || 'Nearby'}</Text>
                    </View>
                    <View style={styles.prPromoRow}>
                      <Ionicons name="flame" size={14} color="#D94E1B" />
                      <Text style={styles.prPromoText}>Free delivery on orders above ₹199</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* HEALTHY EATING SECTION */}
        <View style={styles.horizontalSection}>
          <Text style={styles.sectionTitle}>Guilt-Free Options 🌱</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {HEALTHY_OPTIONS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.healthyCard} activeOpacity={0.9}>
                <Image source={{ uri: item.image }} style={styles.healthyImage} />
                <View style={styles.healthyDetails}>
                  <Text style={styles.healthyName}>{item.name}</Text>
                  <Text style={styles.healthyRestaurant}>{item.restaurant}</Text>
                  <View style={styles.healthyFooter}>
                    <View style={styles.caloriesBadge}>
                      <Ionicons name="flame-outline" size={12} color="#059669" />
                      <Text style={styles.caloriesText}>{item.calories}</Text>
                    </View>
                    <View style={styles.ratingBadgeSm}>
                      <Text style={styles.ratingTextSm}>{item.rating}</Text>
                      <Ionicons name="star" size={8} color="#FFF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* POCKET FRIENDLY DEALS */}
        <View style={[styles.horizontalSection, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Pocket Friendly Combos 💰</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {POCKET_DEALS.map((deal) => (
              <TouchableOpacity key={deal.id} style={styles.dealCard} activeOpacity={0.9}>
                <Image source={{ uri: deal.image }} style={styles.dealImage} />
                <View style={styles.dealOverlay}>
                  <Text style={styles.dealTitle}>{deal.title}</Text>
                  <Text style={styles.dealSubtitle}>{deal.subtitle}</Text>
                  <View style={styles.dealPriceBox}>
                    <Text style={styles.dealPrice}>{deal.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  stickySearchBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FDF2E3',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDDCB5',
    shadowColor: '#D94E1B',
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
  stickySearchText: {
    fontFamily: STYLISH_FONT,
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
  },

  headerContainer: { 
    backgroundColor: '#FDF2E3', // Warm cream — exact same as login screen
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FDDCB5',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  locationDeliveryLabel: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#FF6000',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  locationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6000', // Orange circle pops on cream
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: { marginLeft: 10, flex: 1 },
  locationRowInner: { flexDirection: 'row', alignItems: 'center' },
  locationTitle: { fontFamily: BOLD_FONT, fontSize: 16, color: '#3E2723' },
  locationSubtitle: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#8D6E63', marginTop: 2 },
  
  profileAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#FF6000', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDDCB5'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 22 },
  profileAvatarText: { fontFamily: BOLD_FONT, fontSize: 18, color: '#FFF' },
  
  searchRow: { paddingHorizontal: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchText: { fontFamily: STYLISH_FONT, color: '#9CA3AF', flex: 1, fontSize: 14 },
  micCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  diwaliPoster: {
    marginHorizontal: 16,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#FDE68A', // Gold border
  },
  diwaliBgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  diwaliOverlay: {
    flex: 1,
    backgroundColor: 'rgba(120, 20, 10, 0.65)', // Festive red/dark overlay
    padding: 20,
    justifyContent: 'center',
  },
  diwaliBadge: {
    backgroundColor: '#F59E0B',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  diwaliBadgeText: {
    fontFamily: BOLD_FONT,
    color: '#FFF',
    fontSize: 10,
    letterSpacing: 1,
  },
  diwaliTitle: {
    fontFamily: BOLD_FONT,
    color: '#FEF3C7', // Light gold
    fontSize: 26,
    marginBottom: 4,
  },
  diwaliSubtitle: {
    fontFamily: STYLISH_FONT,
    color: '#FFF',
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 16,
  },
  diwaliBtn: {
    backgroundColor: '#FEF3C7', // Gold button
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  diwaliBtnText: {
    fontFamily: BOLD_FONT,
    color: '#B45309',
    fontSize: 12,
  },

  bannerWrapper: { marginBottom: 24 },
  bannerContainer: { width: BANNER_WIDTH, marginHorizontal: 16, borderRadius: 20, height: 170, flexDirection: 'row', overflow: 'hidden' },
  bannerTextContent: { flex: 1.2, padding: 20, justifyContent: 'center' },
  bannerCravings: { fontFamily: BOLD_FONT, fontSize: 18, color: '#1F2937' },
  bannerFtafat: { fontFamily: BOLD_FONT, fontSize: 32, marginTop: -4, letterSpacing: -1 },
  bannerDesc: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#6B7280', marginTop: 8, lineHeight: 18 },
  bannerImage: { flex: 1, height: '100%' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: { 
    fontFamily: BOLD_FONT, 
    fontSize: 18, 
    color: '#1F2937', 
    paddingHorizontal: 20,
    marginBottom: 16
  },
  dummyBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginRight: 20,
  },
  dummyBadgeText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#EF4444',
  },
  
  categoriesScroll: {},
  categoriesContent: { paddingHorizontal: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImageContainer: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    overflow: 'hidden', 
    marginBottom: 8, 
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  categoryImage: { width: '100%', height: '100%' },
  categoryName: { fontFamily: BOLD_FONT, fontSize: 12, color: '#4B5563' },
  
  horizontalSection: { marginBottom: 32 },
  brandCard: { marginRight: 16, width: 100 },
  brandImageWrapper: { width: 100, height: 100, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 8 },
  brandImage: { width: '100%', height: '100%' },
  brandOfferBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(217,78,27,0.9)', paddingVertical: 4, alignItems: 'center' },
  brandOfferText: { fontFamily: BOLD_FONT, color: '#FFF', fontSize: 9, letterSpacing: 0.5 },
  brandName: { fontFamily: BOLD_FONT, fontSize: 13, color: '#1F2937', textAlign: 'center' },
  brandMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  brandMetaText: { fontFamily: STYLISH_FONT, fontSize: 11, color: '#6B7280', marginLeft: 4 },
  
  productCard: { width: 240, marginRight: 16, backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, overflow: 'hidden', marginBottom: 10 },
  productImage: { width: '100%', height: 130 },
  productDetails: { padding: 12 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontFamily: BOLD_FONT, fontSize: 15, color: '#1F2937', flex: 1, marginRight: 8 },
  ratingBadgeSm: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingTextSm: { fontFamily: BOLD_FONT, color: '#FFF', fontSize: 10, marginRight: 2 },
  productRestaurant: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 12 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontFamily: BOLD_FONT, fontSize: 16, color: '#1F2937' },
  addBtnSm: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  addBtnTextSm: { fontFamily: BOLD_FONT, color: '#EF4444', fontSize: 12 },

  sectionContainer: { paddingBottom: 40 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumRestaurantsList: { paddingHorizontal: 20 },
  premiumRestaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden'
  },
  prImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    position: 'relative'
  },
  prImage: {
    width: '100%',
    height: '100%',
  },
  prDeliveryBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  prDeliveryText: {
    fontFamily: BOLD_FONT,
    color: '#FFF',
    fontSize: 11,
    marginLeft: 4,
  },
  prDetails: {
    padding: 16,
  },
  prHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  prName: {
    fontFamily: BOLD_FONT,
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  prRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prRatingText: {
    fontFamily: BOLD_FONT,
    color: '#FFF',
    fontSize: 12,
    marginRight: 4,
  },
  prSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prCuisines: {
    fontFamily: STYLISH_FONT,
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  prDistance: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#9CA3AF',
  },
  prPromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
  },
  prPromoText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#D94E1B',
    marginLeft: 6,
  },
  
  healthyCard: { width: 220, marginRight: 16, backgroundColor: '#ECFDF5', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#D1FAE5', marginBottom: 10 },
  healthyImage: { width: '100%', height: 120 },
  healthyDetails: { padding: 12 },
  healthyName: { fontFamily: BOLD_FONT, fontSize: 14, color: '#065F46', marginBottom: 2 },
  healthyRestaurant: { fontFamily: STYLISH_FONT, fontSize: 12, color: '#047857', opacity: 0.8 },
  healthyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  caloriesBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  caloriesText: { fontFamily: BOLD_FONT, fontSize: 10, color: '#059669', marginLeft: 4 },
  
  dealCard: { width: 280, height: 160, marginRight: 16, borderRadius: 24, overflow: 'hidden' },
  dealImage: { width: '100%', height: '100%' },
  dealOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', padding: 16, justifyContent: 'flex-end' },
  dealTitle: { fontFamily: BOLD_FONT, fontSize: 22, color: '#FFF' },
  dealSubtitle: { fontFamily: STYLISH_FONT, fontSize: 14, color: '#E5E7EB', marginBottom: 12 },
  dealPriceBox: { alignSelf: 'flex-start', backgroundColor: '#FF6000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dealPrice: { fontFamily: BOLD_FONT, fontSize: 14, color: '#FFF' },
});
