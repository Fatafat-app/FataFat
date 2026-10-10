import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, ImageBackground, Animated, Easing, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore, useLocationStore } from '../../store';
import { useCartStore } from '../../store/cart.store';
import { restaurantService } from '../../services/restaurant.service';
import { Restaurant, MenuItem } from '../../types';
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
import { useFavoritesStore } from '../../store/favorites.store';

const { width } = Dimensions.get('window');

// --- Typewriter Component for Search Boxes ---
const TypewriterText = ({ texts, style }: { texts: string[], style: any }) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
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
  { id: 1, title: 'Cravings?', subtitle: 'Ftafat!', desc: 'Delicious food delivered\nto your doorstep.', image: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg', bgColor: Colors.primaryLight, textColor: Colors.primary },
  { id: 2, title: 'Midnight', subtitle: 'Hunger?', desc: 'Hot meals delivered\nin just 15 minutes!', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg', bgColor: '#EEF2FF', textColor: '#4F46E5' },
  { id: 3, title: 'Party', subtitle: 'Time!', desc: 'Flat 50% Off on\nlarge group orders.', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', bgColor: '#FDF7EC', textColor: '#D97706' },
  { id: 4, title: 'Healthy', subtitle: 'Eats', desc: 'Fresh salads &\njuices for you.', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', bgColor: '#ECFDF5', textColor: '#059669' },
  { id: 5, title: 'Spicy', subtitle: 'Desires!', desc: 'Sizzling hot dishes\nstraight from the tandoor.', image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg', bgColor: '#FEF2F2', textColor: '#DC2626' },
  { id: 6, title: 'Sweet', subtitle: 'Tooth?', desc: 'Indulge in desserts\nand fresh pastries.', image: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg', bgColor: '#FDF4FF', textColor: '#C026D3' },
];

// ── Feature Accordion Card (standalone component so useState is valid) ──
function FeatureAccordionCard({ item, onPress }: { item: any; onPress: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => setExpanded(!expanded)}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: item.bg,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: item.border,
        overflow: 'hidden',
        shadowColor: item.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: item.color, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
          <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: BOLD_FONT, fontSize: 16, color: Colors.text }}>{item.title}</Text>
          <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{item.tagline}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ backgroundColor: item.color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 6 }}>
            <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }}>{item.highlight}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={item.color} />
        </View>
      </View>
      {expanded && (
        <View style={{ paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderTopColor: item.border }}>
          <Text style={{ fontFamily: STYLISH_FONT, fontSize: 14, color: Colors.text, lineHeight: 22, marginTop: 14 }}>{item.detail}</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, alignSelf: 'flex-start', backgroundColor: item.color, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: '#FFFFFF', marginRight: 4 }}>Order Now</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.items.reduce((s, i) => s + i.quantity, 0));
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { locationTitle, locationSubtitle, isDetectingLocation, detectCurrentLocation, currentLocation, selectedAddress, activeCity } = useLocationStore();
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
  const [vegOnly, setVegOnly] = useState(false);
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
  const [mustTryProducts, setMustTryProducts] = useState<MenuItem[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const { addItem, restaurant: cartRestaurant, clearCart } = useCartStore();

  const handleAddMustTryProduct = (prod: any) => {
    const mockRestaurant = prod.restaurant || {
      _id: 'ftft-kitchen-must-try',
      name: 'FataFat Must-Try Kitchen',
      image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80',
      address: { street: 'Local Kitchen' }
    };
    
    const formattedItem = {
      _id: prod._id || `mt-${prod.name.replace(/\s+/g, '-')}`,
      name: prod.name,
      price: parseInt(prod.price),
      description: prod.description || 'A must try signature dish!',
      images: prod.images || (prod.image ? [prod.image] : []),
      isVeg: prod.isVeg !== false
    };

    const success = addItem(formattedItem as any, mockRestaurant as any, []);
    
    if (!success) {
      Alert.alert(
        'Replace cart items?',
        `Your cart contains dishes from ${cartRestaurant?.name || 'another restaurant'}. Do you want to discard your previous selection and start a new order?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Replace',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(formattedItem as any, mockRestaurant as any, []);
            },
          },
        ]
      );
    }
  };

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
      
      const [restData, ...prodResults] = await Promise.all([
        restaurantService.getNearbyRestaurants({ lat, lng, radius: 50 }),
        restaurantService.searchMenuItems('chicken').catch(() => []),
        restaurantService.searchMenuItems('pizza').catch(() => []),
        restaurantService.searchMenuItems('biryani').catch(() => []),
        restaurantService.searchMenuItems('dessert').catch(() => []),
        restaurantService.searchMenuItems('margherita').catch(() => []),
        restaurantService.searchMenuItems('burger').catch(() => []),
        restaurantService.searchMenuItems('pasta').catch(() => []),
      ]);
      
      // Merge all product results and deduplicate by _id
      const merged = prodResults.flat();
      const seen = new Set<string>();
      const unique = merged.filter((p: any) => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      
      setRestaurants(Array.isArray(restData) ? restData : []);
      setMustTryProducts(unique.slice(0, 14));
    } catch (err: any) {
      setFetchError(true);
      setRestaurants([]);
      setMustTryProducts([]);
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

          {/* Top Mint Gradient matching Snitch design */}
          <LinearGradient
            colors={[Colors.primaryLight, '#F9FAFB', '#FFFFFF']}
            locations={[0, 0.5, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 200 }}
          />

          {/* Fixed Navbar (Snitch Style) */}
          <View style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}>
            {/* Main Top Header (Location Left, Profile/Bell Right) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 }}>
              {/* Location Left */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={() => router.push('/address')}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={24} color={Colors.primary} style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 16, color: Colors.text, display: 'flex', alignItems: 'center' }}>
                    {(locationTitle || selectedAddress?.label || activeCity || 'Home').toUpperCase()}{' '}
                    <Ionicons name="chevron-down" size={14} color={Colors.text} />
                  </Text>
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 12, color: Colors.textSecondary, marginTop: -2 }} numberOfLines={1}>
                    {locationSubtitle ? Array.from(new Set(locationSubtitle.split(',').map(s => s.trim()))).join(', ') : (activeCity || 'Tap to select location')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Icons Right */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Favorites Heart Icon */}
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/saved')}
                >
                  <Ionicons name={favoritesCount > 0 ? 'heart' : 'heart-outline'} size={20} color={favoritesCount > 0 ? '#EF4444' : Colors.text} />
                  {favoritesCount > 0 && (
                    <View style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 8, color: '#FFFFFF', fontWeight: '800' }}>{favoritesCount > 9 ? '9+' : favoritesCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Notifications Bell Icon */}
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  activeOpacity={0.7}
                  onPress={() => router.push('/notifications')}
                >
                  <Ionicons name="notifications-outline" size={20} color={Colors.text} />
                  {unreadNotifications > 0 && <View style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error }} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Premium Search Bar (Snitch Style: Grey pill) */}
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
                borderRadius: 12, paddingHorizontal: 16, height: 50, marginHorizontal: 16, marginBottom: 12
              }}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={20} color="#4B5563" style={{ marginRight: 10 }} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <TypewriterText
                  texts={['Search "Biryani"', 'Search "Pizza"', 'Search "Burger"']}
                  style={{ fontFamily: STYLISH_FONT, fontSize: 14, color: '#4B5563' }}
                />
              </View>
              <View style={{ width: 1, height: 24, backgroundColor: '#E5E7EB', marginHorizontal: 10 }} />
              <Ionicons name="mic" size={20} color={Colors.primary} />
            </TouchableOpacity>

            {/* Mode Switcher - only visible when Grocery is enabled */}
            {isGroceryEnabled && (
              <SectionSwitcher activeSection={activeSection} onSwitch={handleSectionSwitch} style={{ marginBottom: 12 }} />
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
            bounces={false}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >

            {/* Main Hero Banners (Auto Scrolling) */}
            <AutoScrollHeroBanners />

            {/* Quick Filters — Unified Style with Veg Toggle */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
              
              {/* Veg Toggle Chip */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setVegOnly(!vegOnly)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderRadius: 24,
                  backgroundColor: vegOnly ? Colors.primary : '#FFF',
                  borderWidth: 1,
                  borderColor: vegOnly ? Colors.primary : '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View style={{ width: 12, height: 12, borderWidth: 1.5, borderColor: vegOnly ? '#FFF' : '#16A34A', alignItems: 'center', justifyContent: 'center', borderRadius: 2, marginRight: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: vegOnly ? '#FFF' : '#16A34A' }} />
                </View>
                <Text style={{ fontFamily: BOLD_FONT, fontSize: 13, color: vegOnly ? '#FFF' : '#374151', letterSpacing: 0.2 }}>Veg</Text>
              </TouchableOpacity>

              {/* Standard Filter Chips */}
              {[
                { label: 'Trending',      icon: 'fire-circle' },
                { label: 'Fast Delivery', icon: 'moped-electric-outline' },
                { label: 'Top Rated',     icon: 'crown-outline' },
                { label: 'Healthy',       icon: 'leaf-circle-outline' },
              ].map((f, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: f.label } })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    borderRadius: 24,
                    backgroundColor: '#FFF',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <MaterialCommunityIcons name={f.icon as any} size={15} color="#4B5563" style={{ marginRight: 7 }} />
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 13, color: '#374151', letterSpacing: 0.2 }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* WHAT'S ON YOUR MIND? (Circular Icons) */}
            {categories.length > 0 && (
              <View style={{ marginTop: 12, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>What's on your mind?</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
                  {categories.map((cat, idx) => {
                    const fallbackImage = getFallbackCategoryImage(cat.name);
                    const imageSource = cat.image && cat.image.startsWith('http') ? { uri: cat.image } : { uri: fallbackImage };
                    return (
                      <TouchableOpacity key={cat._id || cat.id || idx} style={{ alignItems: 'center', width: 75 }} onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: cat.name } })} activeOpacity={0.8}>
                        <View style={{ width: 75, height: 75, borderRadius: 37.5, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 8 }}>
                          <Image source={imageSource} style={{ width: '100%', height: '100%' }} />
                        </View>
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.text, textAlign: 'center' }} numberOfLines={1}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Grey Divider */}
            <View style={{ height: 8, backgroundColor: '#F3F4F6', marginVertical: 16 }} />

            {/* TOP RESTAURANTS NEAR YOU (VERTICAL FULL WIDTH) */}
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5, marginBottom: 16 }}>Restaurants Near You</Text>

              {loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}><Loading /></View>
              ) : fetchError ? (
                <View style={styles.emptyState}><Text style={styles.emptyTitle}>Could not load restaurants</Text></View>
              ) : restaurants.length === 0 ? (
                <View style={styles.emptyState}><Text style={styles.emptyTitle}>No Restaurants Nearby</Text></View>
              ) : (
                <View style={{ gap: 24, paddingBottom: 16 }}>
                  {restaurants.map((r) => {
                    const isFavorite = favorites[r._id];
                    return (
                    <TouchableOpacity
                      key={r._id}
                      style={{ backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' }}
                      onPress={() => router.push(`/restaurant/${r._id}`)}
                      activeOpacity={0.95}
                    >
                      <View style={{ width: '100%', height: 190, backgroundColor: '#F3F4F6', position: 'relative' }}>
                        <Image source={{ uri: r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg' }} style={{ width: '100%', height: '100%' }} />

                        <TouchableOpacity 
                          style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => setFavorites(prev => ({ ...prev, [r._id]: !prev[r._id] }))}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={Colors.error} />
                        </TouchableOpacity>

                        {/* Teal Discount Badge */}
                        <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 13 }}>60% OFF / UPTO ₹120</Text>
                        </View>
                      </View>

                      <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>{r.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 12, marginRight: 2 }}>{r.rating?.average?.toFixed(1) || '4.0'}</Text>
                            <Ionicons name="star" size={10} color="#FFF" />
                          </View>
                        </View>

                        <Text style={{ fontFamily: STYLISH_FONT, fontSize: 14, color: Colors.textSecondary, marginBottom: 8 }} numberOfLines={1}>
                          {r.cuisines?.join(', ') || 'North Indian, Chinese'}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.textSecondary, marginLeft: 4, marginRight: 12 }}>30-35 min</Text>
                          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.textSecondary, marginLeft: 4 }}>{formatDistance(r.distance) || '2.5 km'}</Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="pricetag-outline" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                          <Text style={{ fontFamily: STYLISH_FONT, fontSize: 12, color: Colors.textSecondary }}>Free delivery on orders above ₹199</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )})}
                </View>
              )}
            </View>

            {/* OFFERS FOR YOU (Premium Swiggy/Cred Style) */}
            <View style={{ marginTop: 24, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>Offers for You</Text>
                <TouchableOpacity activeOpacity={0.7} style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.text }}>See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 14 }}>
                {/* Card 1 */}
                <TouchableOpacity activeOpacity={0.9} style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#0D9488', overflow: 'hidden' }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' }} style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, opacity: 0.9 }} />
                  <LinearGradient colors={['rgba(13,148,136,0.9)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                  <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 }}>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }}>FLAT DEAL</Text>
                    </View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 24, color: '#FFF', lineHeight: 28 }}>50% OFF</Text>
                    <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>on your favourite food</Text>
                  </View>
                </TouchableOpacity>

                {/* Card 2 */}
                <TouchableOpacity activeOpacity={0.9} style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#F59E0B', overflow: 'hidden' }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' }} style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, opacity: 0.9 }} />
                  <LinearGradient colors={['rgba(245,158,11,0.9)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                  <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 }}>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }}>MEGA OFFER</Text>
                    </View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 24, color: '#FFF', lineHeight: 28 }}>Buy 1 Get 1</Text>
                    <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>on selected desserts</Text>
                  </View>
                </TouchableOpacity>

                {/* Card 3 */}
                <TouchableOpacity activeOpacity={0.9} style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#E11D48', overflow: 'hidden' }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' }} style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, opacity: 0.9 }} />
                  <LinearGradient colors={['rgba(225,29,72,0.9)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                  <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 }}>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }}>HEALTHY</Text>
                    </View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 24, color: '#FFF', lineHeight: 28 }}>30% OFF</Text>
                    <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>on fresh salads</Text>
                  </View>
                </TouchableOpacity>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
                {restaurants.slice(0, 4).map((item, idx) => (
                  <TouchableOpacity key={idx} onPress={() => router.push(`/restaurant/${item._id}`)} style={{ width: 220, height: 260, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 }} activeOpacity={0.9}>
                    <Image source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80' }} style={{ width: '100%', height: '100%', position: 'absolute' }} />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                      style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                    >
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8, backdropFilter: 'blur(10px)' }}>
                        <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{idx === 0 ? 'Bestseller' : idx === 1 ? 'Trending' : 'Must Try'}</Text>
                      </View>
                      <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 20, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="flame" size={14} color="#F59E0B" />
                        <Text style={{ fontFamily: STYLISH_FONT, color: '#FCD34D', fontSize: 12, marginLeft: 4 }}>Up to 40% OFF</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 🏆 THIS WEEK'S BESTSELLERS */}
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="trophy-outline" size={18} color="#D97706" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>This Week's Bestsellers</Text>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: Colors.textSecondary }}>Most ordered by your neighbors</Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/search')} style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: '#D97706' }}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Ranked List */}
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
                {restaurants.slice(0, 5).map((r, idx) => {
                  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                  const rankColors = ['#F59E0B', '#94A3B8', '#CD7F32', '#6B7280', '#6B7280'];
                  return (
                    <TouchableOpacity
                      key={r._id}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/restaurant/${r._id}`)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: idx === 0 ? '#FFFBEB' : '#FFF',
                        borderRadius: 18,
                        padding: 12,
                        borderWidth: 1.5,
                        borderColor: idx === 0 ? '#FDE68A' : '#F3F4F6',
                        shadowColor: idx === 0 ? '#F59E0B' : '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: idx === 0 ? 0.15 : 0.04,
                        shadowRadius: 8,
                        elevation: idx === 0 ? 4 : 2,
                      }}
                    >
                      {/* Rank */}
                      <View style={{ width: 36, alignItems: 'center' }}>
                        <Text style={{ fontSize: 22 }}>{medals[idx]}</Text>
                      </View>

                      {/* Image */}
                      <View style={{ width: 58, height: 58, borderRadius: 14, overflow: 'hidden', marginRight: 12 }}>
                        <Image
                          source={{ uri: r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg' }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 15, color: Colors.text }} numberOfLines={1}>{r.name}</Text>
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {r.cuisines?.join(', ') || 'Multi-Cuisine'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
                            <Ionicons name="star" size={10} color="#16A34A" />
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: '#16A34A', marginLeft: 3 }}>{r.rating?.average?.toFixed(1) || '4.5'}</Text>
                          </View>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: Colors.textSecondary }}>
                            <Ionicons name="time-outline" size={11} color={Colors.textSecondary} /> {r.estimatedDeliveryTime || 30} min
                          </Text>
                        </View>
                      </View>

                      {/* Rank number badge */}
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: rankColors[idx] + '20', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: rankColors[idx] }}>#{idx + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Grey Divider */}
            <View style={{ height: 8, backgroundColor: '#F3F4F6', marginVertical: 16 }} />

            {/* ── FTAFAT LIVE STATS + INTERACTIVE FEATURES ── */}
            <View style={{ paddingBottom: 32 }}>

              {/* LIVE STATS TICKER */}
              <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: '#0D9488', borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 22, color: '#FFFFFF' }}>4.9 ⭐</Text>
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Avg Rating</Text>
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 22, color: '#FFFFFF' }}>18 min</Text>
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Avg Delivery</Text>
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 22, color: '#FFFFFF' }}>50k+</Text>
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Happy Users</Text>
                </View>
              </View>

              {/* FEATURED PRODUCTS (NEW) */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                  <View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>Must-Try Products</Text>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: Colors.textSecondary }}>Handpicked just for you</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/search')} style={{ backgroundColor: '#F0FDFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#99F6E4' }}>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.primary }}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
                  {(mustTryProducts.length > 0 ? mustTryProducts : [
                    { name: 'Peri Peri Fries', price: '120', images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80'], tag: '🍟 Snacks' },
                    { name: 'Cold Coffee', price: '150', images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80'], tag: '☕ Beverages' },
                    { name: 'Chicken Wrap', price: '180', images: ['https://images.unsplash.com/photo-1626804475297-41609ae0f4dc?w=400&q=80'], tag: '🌯 Wraps', isVeg: false },
                    { name: 'Choco Lava Cake', price: '140', images: ['https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80'], tag: '🍫 Desserts' },
                    { name: 'Veg Biryani', price: '160', images: ['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80'], tag: '🍛 Rice' },
                    { name: 'Margherita Pizza', price: '220', images: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80'], tag: '🍕 Pizza' },
                    { name: 'Mango Smoothie', price: '99', images: ['https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80'], tag: '🥭 Drinks' },
                    { name: 'Paneer Tikka', price: '200', images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80'], tag: '🧆 Starters' },
                    { name: 'Chicken Wings', price: '250', images: ['https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&q=80'], tag: '🍗 Non-Veg', isVeg: false },
                    { name: 'Veg Momos', price: '110', images: ['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&q=80'], tag: '🥟 Snacks' },
                    { name: 'Butter Chicken', price: '320', images: ['https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?w=400&q=80'], tag: '🥘 Curry', isVeg: false },
                    { name: 'Masala Dosa', price: '130', images: ['https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400&q=80'], tag: '🥞 South' },
                  ] as any[]).map((prod: any, idx: number) => {
                    const handleCardPress = () => {
                      const restId = prod.restaurant?._id || (typeof prod.restaurant === 'string' ? prod.restaurant : null) || prod.restaurantId;
                      if (restId) {
                        router.push(`/restaurant/${restId}`);
                      } else {
                        handleAddMustTryProduct(prod);
                      }
                    };

                    return (
                    <TouchableOpacity
                      key={prod._id || `p-${idx}`}
                      activeOpacity={0.9}
                      onPress={handleCardPress}
                      style={{
                        width: 148,
                        backgroundColor: '#FFF',
                        borderRadius: 20,
                        padding: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: '#F3F4F6',
                      }}
                    >
                      {/* Image */}
                      <View style={{ width: '100%', height: 110, borderRadius: 12, backgroundColor: '#F9FAFB', overflow: 'hidden', marginBottom: 10 }}>
                        <Image
                          source={{ uri: (prod.images?.[0] || prod.image) || 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80' }}
                          style={{ width: '100%', height: '100%' }}
                        />
                        {/* FSSAI Veg/Non-Veg Indicator */}
                        <View style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.95)', padding: 3, borderRadius: 4 }}>
                          <View style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: prod.isVeg !== false ? '#16A34A' : '#DC2626', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: prod.isVeg !== false ? '#16A34A' : '#DC2626' }} />
                          </View>
                        </View>
                        {/* Category Tag */}
                        <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }}>{prod.tag || '🍽️ Food'}</Text>
                        </View>
                        {/* Favorite Heart Toggle */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            const prodId = prod._id || `mt-${prod.name.replace(/\s+/g, '-')}`;
                            toggleFavorite({
                              _id: prodId,
                              name: prod.name,
                              price: prod.price,
                              images: prod.images,
                              image: prod.image,
                              tag: prod.tag,
                              isVeg: prod.isVeg,
                              type: 'product' as const,
                              addedAt: Date.now(),
                            });
                          }}
                          style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isFavorite(prod._id || `mt-${prod.name.replace(/\s+/g, '-')}`) ? 'heart' : 'heart-outline'}
                            size={16}
                            color={isFavorite(prod._id || `mt-${prod.name.replace(/\s+/g, '-')}`) ? '#EF4444' : '#9CA3AF'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Name */}
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 13, color: Colors.text, marginBottom: 8 }} numberOfLines={1}>{prod.name}</Text>

                      {/* Price + Add Button */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 15, color: Colors.primary }}>₹{prod.price}</Text>
                        <TouchableOpacity onPress={() => handleAddMustTryProduct(prod)} style={{ width: 30, height: 30, backgroundColor: '#0D9488', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#0D9488', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 }}>
                          <Ionicons name="add" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ); })}
                </ScrollView>
              </View>

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
      {isGroceryEnabled && (activeSection === 'grocery' || !isFoodEnabled) && (
        <View style={styles.groceryMainWrapper}>
          {/* Top Yellowish-Greenish Gradient matching reference image */}
          <LinearGradient
            colors={['#DCF57C', '#EAF9AD', '#F5FCDE', '#FFFFFF']}
            locations={[0, 0.3, 0.65, 1]}
            style={[styles.groceryTopGradient, { height: insets.top + 280 }]}
          />

          <View style={[styles.groceryHeaderContainer, { paddingTop: insets.top + 6 }]}>
            {/* Main Top Header — Greeting + Delivery Location */}
            <View style={[styles.mainHeaderRow, { paddingBottom: 12, alignItems: 'center' }]}>
              {/* Location Left */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={() => router.push('/address')}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={24} color={Colors.primary} style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 16, color: Colors.text, display: 'flex', alignItems: 'center' }}>
                    {(locationTitle || selectedAddress?.label || activeCity || 'Home').toUpperCase()}{' '}
                    <Ionicons name="chevron-down" size={14} color={Colors.text} />
                  </Text>
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 12, color: Colors.textSecondary, marginTop: -2 }} numberOfLines={1}>
                    {locationSubtitle ? locationSubtitle.split(',')[0] : (activeCity || 'Tap to select location')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Right: Notification bell */}
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
    borderColor: Colors.primaryLight,
  },
  locationIconBg: {
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
  },
  heroBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    backgroundColor: Colors.primaryLight,
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
    color: Colors.primary,
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
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primaryLight,
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
    color: Colors.primary,
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
    color: Colors.primary,
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
    backgroundColor: Colors.primary,
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
  legacyLocationPill: {
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
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
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
    shadowColor: Colors.primary,
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
    shadowColor: Colors.primary,
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
  promoText: { fontFamily: BOLD_FONT, fontSize: 11, color: Colors.primary, marginLeft: 6 },

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
