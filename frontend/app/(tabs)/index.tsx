import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, ImageBackground, Animated, Easing, ActivityIndicator } from 'react-native';
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
import { AutoScrollHeroBanners } from '../../components/AutoScrollHeroBanners';
import AutoScrollWhyChoose from '../../components/AutoScrollWhyChoose';
import { GrocerySearch } from '../../components/grocery/GrocerySearch';
import { GroceryHome } from '../../components/grocery/GroceryHome';
import { GroceryTabBar } from '../../components/grocery/GroceryTabBar';
import { useGroceryStore } from '../../store/grocery.store';
import { useConfigStore } from '../../store/config.store';
import { useNotificationStore } from '../../store/notification.store';

const { width } = Dimensions.get('window');

// --- Typewriter Component for Search Boxes ---
const TypewriterText = ({ texts, style }: { texts: string[], style: any }) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = texts[index];

    const handleTyping = () => {
      if (isDeleting) {
        setText(currentWord.substring(0, text.length - 1));
        setTypingSpeed(30); // Faster delete
      } else {
        setText(currentWord.substring(0, text.length + 1));
        setTypingSpeed(80); // Normal typing
      }

      if (!isDeleting && text === currentWord) {
        timer = setTimeout(() => setIsDeleting(true), 2000); // Pause at end of word
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
        setTypingSpeed(400); // Pause before new word
      } else {
        timer = setTimeout(handleTyping, typingSpeed);
      }
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, index, texts, typingSpeed]);

  return <Text style={style} numberOfLines={1}>{text}</Text>;
};

const formatDistance = (meters?: number) => {
  if (!meters) return '';
  return `${(meters / 1000).toFixed(1)} km`;
};

const getFallbackCategoryImage = (name: string) => {
  if (!name) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80';
  const lower = name.toLowerCase();
  if (lower.includes('pizza')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80';
  if (lower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80';
  if (lower.includes('biryani')) return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=300&q=80';
  if (lower.includes('chinese') || lower.includes('noodles')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80';
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sweet')) return 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&q=80';
  if (lower.includes('healthy') || lower.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80';
  if (lower.includes('roll') || lower.includes('wrap')) return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&q=80';
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80';
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
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const { locationTitle, locationSubtitle, isDetectingLocation, detectCurrentLocation, currentLocation, selectedAddress } = useLocationStore();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // Section switcher — food is default on app open
  const { activeSection, setSection } = useGroceryStore();
  const isFoodAvailable = useConfigStore((state) => state.isVerticalAvailable('food'));
  const foodMode = useConfigStore((state) => state.config?.verticals?.food?.mode || 'ON');
  const isFoodEnabled = isFoodAvailable && foodMode !== 'OFF';

  const isGroceryAvailable = useConfigStore((state) => state.isVerticalAvailable('grocery'));
  const groceryMode = useConfigStore((state) => state.config?.verticals?.grocery?.mode || 'ON');
  const isGroceryEnabled = isGroceryAvailable && groceryMode !== 'OFF';

  const showSwitcher = isFoodEnabled && isGroceryEnabled;

  useEffect(() => {
    if (isFoodEnabled && !isGroceryEnabled && activeSection !== 'food') {
      setSection('food');
    } else if (!isFoodEnabled && isGroceryEnabled && activeSection !== 'grocery') {
      setSection('grocery');
    }
  }, [isFoodEnabled, isGroceryEnabled, activeSection]);

  const foodTranslate = useRef(new Animated.Value(0)).current;
  const groceryTranslate = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleSectionSwitch = (section: 'food' | 'grocery') => {
    if (!isGroceryEnabled && section === 'grocery') return;
    if (!isFoodEnabled && section === 'food') return;
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
    detectCurrentLocation();
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
      {/* 0. BOTH SERVICES OFFLINE (When both Food and Grocery are turned OFF) */}
      {!isFoodEnabled && !isGroceryEnabled && (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="cloud-offline" size={40} color="#DC2626" />
          </View>
          <Text style={{ fontFamily: BOLD_FONT, fontSize: 22, color: '#1E293B', textAlign: 'center' }}>
            We're Currently Closed
          </Text>
          <Text style={{ fontFamily: STYLISH_FONT, fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Both Food and Grocery deliveries are currently offline. We'll be back online shortly!
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{ marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: BOLD_FONT, color: '#FFFFFF', fontSize: 13 }}>Check Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================ */}
      {/* 1. FOOD DELIVERY SECTION                                      */}
      {/* ============================================================ */}
      {isFoodEnabled && (activeSection === 'food' || !isGroceryEnabled) && (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

          {/* Top Peach-Orange Gradient matching Grocery design */}
          <LinearGradient
            colors={['#FFDBC7', '#FFE4D6', '#FFF5F0', '#FFFFFF']}
            locations={[0, 0.3, 0.65, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 280 }}
          />

          {/* Fixed Navbar (Like Grocery) */}
          <View style={{ paddingTop: insets.top + 6, paddingBottom: 12 }}>
            {/* Main Top Header (Logo + Bell) */}
            <View style={[styles.mainHeaderRow, { paddingBottom: 12, alignItems: 'center' }]}>
              {/* Logo Left */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Image source={require('../../assets/images/logo_transparent.png')} style={styles.brandLogo} resizeMode="contain" />
                <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: '#D94E1B', marginLeft: 6, marginTop: -4 }}>
                  Good Food. Fast Delivery.
                </Text>
              </View>

              {/* Bell Icon */}
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#111827" />
                {unreadNotifications > 0 && <View style={styles.bellBadge} />}
              </TouchableOpacity>
            </View>

            {/* Premium Search Bar with Integrated Location (Grocery Style Shadow) */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                paddingHorizontal: 16,
                height: 56,
                marginHorizontal: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(217, 78, 27, 0.15)'
              }}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.9}
            >
              {/* Search Side */}
              <Ionicons name="search" size={24} color="#D94E1B" style={{ marginRight: 12 }} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <TypewriterText
                  texts={['Search "Biryani"']}
                  style={{ fontFamily: BOLD_FONT, fontSize: 14, color: '#1F2937' }}
                />
              </View>

              {/* Vertical Divider */}
              <View style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', marginHorizontal: 8 }} />

              {/* Location Side */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 4, paddingVertical: 4, maxWidth: 140 }}
                onPress={() => router.push('/address')}
                activeOpacity={0.8}
              >
                <View style={{ alignItems: 'flex-end', marginRight: 6, flexShrink: 1 }}>
                  <Text
                    style={{ fontFamily: BOLD_FONT, fontSize: 11, color: '#D94E1B', marginBottom: 1 }}
                    numberOfLines={1}
                  >
                    {(locationTitle || selectedAddress?.label || activeCity || 'Location').toUpperCase()}{' '}
                    <Ionicons name="chevron-down" size={10} color="#D94E1B" />
                  </Text>
                  <Text
                    style={{ fontFamily: STYLISH_FONT, fontSize: 9, color: '#6B7280', maxWidth: 90 }}
                    numberOfLines={1}
                  >
                    {locationSubtitle ? locationSubtitle.split(',')[0] : (activeCity || 'New Delhi')}
                  </Text>
                </View>
                <View style={styles.locationIconBg}>
                  <Ionicons name="location" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Mode Switcher - only visible when Grocery is enabled */}
            {isGroceryEnabled && (
              <SectionSwitcher activeSection={activeSection} onSwitch={handleSectionSwitch} style={{ marginBottom: 12 }} />
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
            bounces={false}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >

            {/* Main Hero Banners (Auto Scrolling) */}
            <AutoScrollHeroBanners />

            {/* WHAT'S ON YOUR MIND? */}
            {categories.length > 0 && (
              <View style={styles.categoriesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>What's on your mind?</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.seeAllText}>See All <Ionicons name="arrow-forward" size={12} /></Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                  {categories.map((cat, idx) => {
                    const fallbackImage = getFallbackCategoryImage(cat.name);
                    const imageSource = cat.image && cat.image.startsWith('http') ? { uri: cat.image } : { uri: fallbackImage };

                    return (
                      <TouchableOpacity
                        key={cat._id || cat.id || idx}
                        style={styles.foodItemWrapper}
                        onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: cat.name } })}
                        activeOpacity={0.8}
                      >
                        <Image source={imageSource} style={styles.foodItemImage} />
                        <Text style={styles.foodItemName} numberOfLines={1}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* TOP RESTAURANTS NEAR YOU (HORIZONTAL SCROLL) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Restaurants Near You</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>See All <Ionicons name="arrow-forward" size={12} /></Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Loading />
                </View>
              ) : fetchError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Could not load restaurants</Text>
                </View>
              ) : restaurants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Restaurants Nearby</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 16 }}>
                  {restaurants.map((r) => (
                    <TouchableOpacity
                      key={r._id}
                      style={styles.horizontalRestaurantCard}
                      onPress={() => router.push(`/restaurant/${r._id}`)}
                      activeOpacity={0.95}
                    >
                      <View style={styles.hCardImageContainer}>
                        <Image
                          source={{ uri: r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg' }}
                          style={styles.hCardImage}
                        />
                        <TouchableOpacity style={styles.hCardFav}>
                          <Ionicons name="heart-outline" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.hCardDetails}>
                        <Text style={styles.hCardName} numberOfLines={1}>{r.name}</Text>
                        <View style={styles.hCardRatingRow}>
                          <Ionicons name="star" size={12} color="#D94E1B" />
                          <Text style={styles.hCardRatingText}>{r.rating?.average?.toFixed(1) || '4.0'} <Text style={{ color: '#9CA3AF' }}>(1k+)</Text></Text>
                          <Text style={styles.hCardDot}>•</Text>
                          <Text style={styles.hCardCuisines} numberOfLines={1}>{r.cuisines?.slice(0, 2).join(', ') || 'Fast Food'}</Text>
                        </View>
                        <Text style={styles.hCardTags} numberOfLines={1}>{r.cuisines?.join(' • ') || 'Burger • Fries'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* OFFERS FOR YOU */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Offers for You</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>See All <Ionicons name="arrow-forward" size={12} /></Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 12 }}>
                <View style={[styles.offerCard, { backgroundColor: '#FFEDD5' }]}>
                  <View style={{ flex: 1, padding: 12, paddingRight: 0 }}>
                    <Text style={styles.offerTag}>FLAT</Text>
                    <Text style={styles.offerTitle}>50% OFF</Text>
                    <Text style={styles.offerSub}>on your favourite food!</Text>
                    <View style={styles.offerArrowBtn}><Ionicons name="arrow-forward" size={14} color="#FFF" /></View>
                  </View>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' }} style={styles.offerImage} />
                </View>
                <View style={[styles.offerCard, { backgroundColor: '#FEE2E2' }]}>
                  <View style={{ flex: 1, padding: 12, paddingRight: 0 }}>
                    <Text style={styles.offerTitle}>Free{"\n"}Delivery</Text>
                    <Text style={styles.offerSub}>on orders above ₹199</Text>
                    <View style={[styles.offerArrowBtn, { backgroundColor: '#DC2626' }]}><Ionicons name="arrow-forward" size={14} color="#FFF" /></View>
                  </View>
                  <Image source={{ uri: 'https://cdn3d.iconscout.com/3d/premium/thumb/delivery-boy-riding-scooter-5727926-4800366.png' }} style={styles.offerImageFull} resizeMode="contain" />
                </View>
                <View style={[styles.offerCard, { backgroundColor: '#E0E7FF' }]}>
                  <View style={{ flex: 1, padding: 12, paddingRight: 0 }}>
                    <Text style={styles.offerTag}>MEGA</Text>
                    <Text style={styles.offerTitle}>Buy 1{"\n"}Get 1</Text>
                    <Text style={styles.offerSub}>on selected desserts</Text>
                    <View style={[styles.offerArrowBtn, { backgroundColor: '#4F46E5' }]}><Ionicons name="arrow-forward" size={14} color="#FFF" /></View>
                  </View>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' }} style={styles.offerImage} />
                </View>
                <View style={[styles.offerCard, { backgroundColor: '#DCFCE7' }]}>
                  <View style={{ flex: 1, padding: 12, paddingRight: 0 }}>
                    <Text style={styles.offerTitle}>Healthy{"\n"}Salads</Text>
                    <Text style={styles.offerSub}>Up to 30% OFF</Text>
                    <View style={[styles.offerArrowBtn, { backgroundColor: '#16A34A' }]}><Ionicons name="arrow-forward" size={14} color="#FFF" /></View>
                  </View>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' }} style={styles.offerImage} />
                </View>
                <View style={[styles.offerCard, { backgroundColor: '#FCE7F3' }]}>
                  <View style={{ flex: 1, padding: 12, paddingRight: 0 }}>
                    <Text style={styles.offerTitle}>₹100{"\n"}Cashback</Text>
                    <Text style={styles.offerSub}>on 3 orders</Text>
                    <View style={[styles.offerArrowBtn, { backgroundColor: '#DB2777' }]}><Ionicons name="arrow-forward" size={14} color="#FFF" /></View>
                  </View>
                  <Image source={{ uri: 'https://cdn3d.iconscout.com/3d/premium/thumb/gift-box-4993510-4160032.png' }} style={styles.offerImageFull} resizeMode="contain" />
                </View>
              </ScrollView>
            </View>

            {/* SPOTLIGHT DEALS */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Spotlight Deals</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>Explore <Ionicons name="arrow-forward" size={12} /></Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 16 }}>
                {[
                  { img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', title: 'Gourmet Burgers' },
                  { img: 'https://images.unsplash.com/photo-1560801619-01d6973e87fb?w=400&q=80', title: 'Cheesy Pizzas' },
                  { img: 'https://images.unsplash.com/photo-1615719413546-198b25453f85?w=400&q=80', title: 'Asian Noodles' },
                  { img: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80', title: 'Pasta Bowls' },
                ].map((item, idx) => (
                  <TouchableOpacity key={idx} style={{ width: 140, height: 180, borderRadius: 16, overflow: 'hidden' }} activeOpacity={0.9}>
                    <ImageBackground source={{ uri: item.img }} style={{ width: '100%', height: '100%' }}>
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={{ flex: 1, justifyContent: 'flex-end', padding: 12 }}
                      >
                        <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 14 }}>{item.title}</Text>
                        <Text style={{ fontFamily: STYLISH_FONT, color: '#D1D5DB', fontSize: 11, marginTop: 4 }}>Up to 40% OFF</Text>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* WHY CHOOSE FTAFAT */}
            <AutoScrollWhyChoose />

          </ScrollView>
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. GROCERY SECTION (Light / White Design from Reference)     */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* 2. GROCERY SECTION (Yellowish-Greenish Gradient Top Design)  */}
      {/* ============================================================ */}
      {isGroceryEnabled && (activeSection === 'grocery' || !isFoodEnabled) && (
        <View style={styles.groceryMainWrapper}>
          {/* Top Yellowish-Greenish Gradient matching reference image */}
          <LinearGradient
            colors={['#DCF57C', '#EAF9AD', '#F5FCDE', '#FFFFFF']}
            locations={[0, 0.3, 0.65, 1]}
            style={[styles.groceryTopGradient, { height: insets.top + 280 }]}
          />

          <View style={[styles.groceryHeaderContainer, { paddingTop: insets.top + 6 }]}>
            {/* Main Top Header (Logo + Bag) */}
            <View style={[styles.mainHeaderRow, { paddingBottom: 12, alignItems: 'center' }]}>
              {/* Logo Left */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Image source={require('../../assets/images/logo_transparent.png')} style={styles.brandLogo} resizeMode="contain" />
                <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: '#16A34A', marginLeft: 6, marginTop: -4 }}>
                  Fresh Groceries. Fast Delivery.
                </Text>
              </View>

              {/* Notifications Icon */}
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#111827" />
                {unreadNotifications > 0 && (
                  <View style={[styles.bellBadge, { backgroundColor: '#22C55E' }]} />
                )}
              </TouchableOpacity>
            </View>

            {/* Premium Stylish Grocery Search Box */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                paddingHorizontal: 16,
                height: 56,
                marginHorizontal: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(220, 245, 124, 0.4)'
              }}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={24} color="#4ADE80" style={{ marginRight: 12 }} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <TypewriterText
                  texts={['Search "Milk"', 'Search "Bread"', 'Search "Eggs"', 'Search "Chips"', 'Search "Cold Drink"', 'Search "Atta"']}
                  style={{ fontFamily: BOLD_FONT, fontSize: 14, color: '#1F2937' }}
                />
              </View>
              <View style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', marginHorizontal: 10 }} />
              <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mic" size={20} color="#22C55E" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* 1. Mode Switcher - only visible when Grocery is enabled */}
            {isGroceryEnabled && (
              <SectionSwitcher
                activeSection={activeSection}
                onSwitch={handleSectionSwitch}
                style={{ marginBottom: 12 }}
              />
            )}
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

  mainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  brandLogo: {
    width: 110,
    height: 40,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  locationIconBg: {
    backgroundColor: '#D94E1B',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCity: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#111827',
  },
  locationArea: {
    fontFamily: STYLISH_FONT,
    fontSize: 9,
    color: '#6B7280',
    maxWidth: 70,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAllText: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    color: '#D94E1B',
  },
  heroBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    backgroundColor: '#FFE4D6',
  },
  heroBannerImg: {
    width: '100%',
    height: '100%',
  },
  heroBannerGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  heroBannerContent: {
    width: '60%',
  },
  heroTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 22,
    color: '#5E2B16',
    lineHeight: 26,
  },
  heroTitleBrand: {
    fontFamily: BOLD_FONT,
    fontSize: 32,
    color: '#D94E1B',
    lineHeight: 36,
  },
  heroSub: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#5E2B16',
    marginTop: 6,
    lineHeight: 16,
  },
  orderNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D94E1B',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  orderNowText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#FFFFFF',
  },
  foodItemWrapper: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  foodItemImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE4D6',
    marginBottom: 8,
  },
  foodItemName: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#111827',
    textAlign: 'center',
  },
  horizontalRestaurantCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  hCardImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  hCardImage: {
    width: '100%',
    height: '100%',
  },
  hCardFav: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hCardTimeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hCardTimeText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#111827',
    marginLeft: 4,
  },
  hCardDetails: {
    padding: 14,
  },
  hCardName: {
    fontFamily: BOLD_FONT,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  hCardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hCardRatingText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#111827',
    marginLeft: 4,
  },
  hCardDot: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  hCardCuisines: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  hCardTags: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  hCardPromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hCardPromoPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hCardPromoTextGreen: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#16A34A',
    marginLeft: 4,
  },
  hCardPromoPillOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hCardPromoTextOrange: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#D94E1B',
    marginLeft: 4,
  },
  offerCard: {
    width: 240,
    height: 120,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  offerTag: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#4B5563',
  },
  offerTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 22,
    color: '#D94E1B',
    lineHeight: 24,
  },
  offerSub: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#5E2B16',
    marginTop: 2,
    lineHeight: 12,
  },
  offerArrowBtn: {
    backgroundColor: '#D94E1B',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  offerImage: {
    width: 100,
    height: 120,
    borderRadius: 16,
  },
  offerImageFull: {
    width: 100,
    height: 100,
    marginTop: 20,
  },
  cuisineItemWrapper: {
    alignItems: 'center',
    marginRight: 16,
    width: 65,
  },
  cuisineImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  cuisineName: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#111827',
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  featureCol: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#4B5563',
    textAlign: 'center',
  },
  filterBtn: {
    backgroundColor: '#FFF0E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: 20,
    overflow: 'hidden',
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
  stylishLocationWrapper: {
    alignItems: 'flex-start',
    width: '100%',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 6,
  },
  pillIconBg: {
    backgroundColor: '#D94E1B',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pillLabelText: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  pillTitleText: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: '#D94E1B',
    maxWidth: 140,
  },
  stylishSubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerWatermark: { position: 'absolute', top: -10, right: -15, width: 120, height: 120 },
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

  searchRow: { paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16,
    paddingHorizontal: 16, height: 48,
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

  categoriesSection: { marginBottom: 30, marginTop: 4 },
  sectionTitle: { fontFamily: BOLD_FONT, fontSize: 18, color: '#1F2937' },
  categoriesScroll: { paddingBottom: 16 },
  categoriesContent: { paddingHorizontal: 20 },

  categoryItemWrapper: {
    marginRight: 16,
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  categoryItemInner: {
    width: 105,
    height: 140, // Much larger and taller size!
    borderRadius: 24, // Unique ultra-rounded corners
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  categoryImage: { width: '100%', height: '100%', position: 'absolute' },
  categoryGradientOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '65%',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 14,
  },
  categoryName: {
    fontFamily: BOLD_FONT,
    fontSize: 14.5,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },

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
