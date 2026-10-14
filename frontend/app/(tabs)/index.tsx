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
import { RestaurantCardSkeleton, CategoriesRowSkeleton } from '../../components/ui/Skeleton';
import { useFoodCategoriesQuery, useNearbyRestaurantsQuery, useMustTryProductsQuery, useRecommendedProductsQuery, useUnder99ProductsQuery, useGroceryProductsQuery } from '../../hooks';
import { Typography, BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';
import { SectionSwitcher } from '../../components/SectionSwitcher';
import { AutoScrollHeroBanners } from '../../components/AutoScrollHeroBanners';
import AutoScrollWhyChoose from '../../components/AutoScrollWhyChoose';
import { GrocerySearch } from '../../components/grocery/GrocerySearch';
import { GroceryHome } from '../../components/grocery/GroceryHome';
import { GroceryTabBar } from '../../components/grocery/GroceryTabBar';
import { FrequentlyBoughtProductCard } from '../../components/grocery/FrequentlyBoughtProductCard';
import { useGroceryStore } from '../../store/grocery.store';
import { GroceryProduct } from '../../constants/GroceryData';
import { useConfigStore } from '../../store/config.store';
import { useNotificationStore } from '../../store/notification.store';
import { useFavoritesStore } from '../../store/favorites.store';
import { formatPaise } from '../../utils/formatters';
import { bannerService, BannerItem } from '../../services/banner.service';
import { NinetyNineStoreSection } from '../../components/NinetyNineStore';

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

const getFoodProductImage = (prod: any): string => {
  if (prod?.images && Array.isArray(prod.images) && prod.images.length > 0 && prod.images[0]) {
    return prod.images[0];
  }
  if (prod?.image) {
    return prod.image;
  }
  const lower = (prod?.name || '').toLowerCase();
  if (lower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80';
  if (lower.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80';
  if (lower.includes('biryani') || lower.includes('rice')) return 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&q=80';
  if (lower.includes('fries')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80';
  if (lower.includes('coffee') || lower.includes('shake') || lower.includes('tea') || lower.includes('smoothie')) return 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80';
  if (lower.includes('cake') || lower.includes('dessert') || lower.includes('sweet') || lower.includes('pastry')) return 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=500&q=80';
  if (lower.includes('wrap') || lower.includes('roll')) return 'https://images.unsplash.com/photo-1626804475297-41609ae0f4dc?w=500&q=80';
  if (lower.includes('momo') || lower.includes('dimsum')) return 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500&q=80';
  if (lower.includes('tikka') || lower.includes('paneer') || lower.includes('curry')) return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80';
  if (lower.includes('chicken') || lower.includes('wing')) return 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&q=80';
  if (lower.includes('dosa') || lower.includes('idli')) return 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
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

let cachedOfferBanners: BannerItem[] | null = null;
let cachedSpotlightBanners: BannerItem[] | null = null;

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
  const foodFeedScrollRef = useRef<ScrollView>(null);
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

  const [refreshing, setRefreshing] = useState(false);
  const [offerBanners, setOfferBanners] = useState<BannerItem[]>(() => cachedOfferBanners || []);
  const [spotlightBanners, setSpotlightBanners] = useState<BannerItem[]>(() => cachedSpotlightBanners || []);

  const fetchOffers = useCallback(async () => {
    try {
      const data = await bannerService.getBanners('OFFERS_FOR_YOU');
      if (data) {
        const cleaned = data.map((b) => ({
          ...b,
          image: typeof b.image === 'string' ? b.image.replace(/&amp;/g, '&') : b.image,
        }));
        cachedOfferBanners = cleaned;
        setOfferBanners(cleaned);
      }
    } catch {
      // Keep existing
    }
  }, []);

  const fetchSpotlights = useCallback(async () => {
    try {
      const data = await bannerService.getBanners('SPOTLIGHT');
      if (data) {
        const cleaned = data.map((b) => ({
          ...b,
          image: typeof b.image === 'string' ? b.image.replace(/&amp;/g, '&') : b.image,
        }));
        cachedSpotlightBanners = cleaned;
        setSpotlightBanners(cleaned);
      }
    } catch {
      // Keep existing
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchSpotlights();
  }, [fetchOffers, fetchSpotlights]);

  const handleOfferBannerPress = (banner: BannerItem) => {
    if (banner.targetType === 'restaurant' && banner.targetId) {
      router.push(`/restaurant/${banner.targetId}` as any);
    } else if (banner.targetType === 'cuisine' && banner.targetId) {
      router.push({ pathname: '/search', params: { cuisine: banner.targetId } } as any);
    } else if (banner.targetType === 'category' && banner.targetId) {
      router.push({ pathname: '/search', params: { category: banner.targetId } } as any);
    } else if (banner.targetType === 'search' && banner.targetId) {
      router.push({ pathname: '/search', params: { q: banner.targetId } } as any);
    } else if (banner.targetType === 'coupon') {
      router.push('/(tabs)/cart' as any);
    } else if (banner.targetId) {
      router.push({ pathname: '/search', params: { q: banner.targetId } } as any);
    }
  };

  // TanStack Query: Cached & Deduped Data
  const { data: categories = [] } = useFoodCategoriesQuery();
  const {
    data: rawRestaurants = [],
    isLoading: loadingRestaurants,
    isError: fetchError,
    refetch: refetchRestaurants,
  } = useNearbyRestaurantsQuery({
    lat: currentLocation?.latitude || 28.6139,
    lng: currentLocation?.longitude || 77.2090,
    radius: 50,
    isVeg: vegOnly ? true : undefined,
  });

  const isRestaurantVeg = useCallback((r: Restaurant) => {
    if (r.isPureVeg) return true;
    const cuisinesStr = (r.cuisines || []).join(' ').toLowerCase();
    if (cuisinesStr.includes('veg') || cuisinesStr.includes('vegetarian') || cuisinesStr.includes('jain') || cuisinesStr.includes('sattvic')) return true;
    const nameLower = (r.name || '').toLowerCase();
    if (nameLower.includes('veg') || nameLower.includes('pure veg') || nameLower.includes('jain') || nameLower.includes('vaishno') || nameLower.includes('haldiram') || nameLower.includes('sagar ratna') || nameLower.includes('bikanervala')) return true;
    return false;
  }, []);

  const restaurants = vegOnly ? rawRestaurants.filter(isRestaurantVeg) : rawRestaurants;
  const restaurantsToShow = restaurants.slice(0, 4);

  const { data: rawMustTryProducts = [], refetch: refetchMustTry } = useMustTryProductsQuery();
  const mustTryProducts = vegOnly ? rawMustTryProducts.filter((p: any) => p.isVeg !== false) : rawMustTryProducts;

  const {
    data: rawRecommendedProducts = [],
    isLoading: loadingRecommended,
    refetch: refetchRecommended,
  } = useRecommendedProductsQuery(vegOnly ? true : undefined);

  const {
    data: rawUnder99Products = [],
    refetch: refetchUnder99,
  } = useUnder99ProductsQuery(vegOnly ? true : undefined);

  const {
    data: popularGroceryResponse,
    isLoading: loadingFrequentProducts,
    isError: frequentProductsError,
    refetch: refetchFrequentProducts,
  } = useGroceryProductsQuery({ sort: 'popularity', limit: 10 });

  const frequentlyBoughtProducts: GroceryProduct[] = (popularGroceryResponse?.products || []).map((product) => ({
    id: product._id || product.slug,
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    originalPrice: product.originalPrice,
    unit: product.unit,
    image: product.images?.[0] || '',
    images: product.images,
    badge: product.badge || undefined,
    discount: product.discount || (product.discountPercentage ? `${product.discountPercentage}% off` : undefined),
    rating: product.rating,
  }));

  const under99Products = rawUnder99Products.filter((p: any) => (vegOnly ? p.isVeg !== false : true));

  const recommendedProducts = (rawRecommendedProducts && rawRecommendedProducts.length > 0
    ? rawRecommendedProducts
    : rawMustTryProducts).filter((p: any) => (vegOnly ? p.isVeg !== false : true));

  const loading = loadingRestaurants && rawRestaurants.length === 0;

  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const { addItem, restaurant: cartRestaurant, clearCart } = useCartStore();

  const getItemQuantityInCart = useCallback((itemId: string): number => {
    return cartItems
      .filter((i) => i.menuItem._id === itemId || (i.menuItem as any).id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleAddMustTryProduct = (prod: any) => {
    const rawRest = prod.restaurant;
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
          _id: (typeof rawRest === 'string' ? rawRest : null) || prod.restaurantId || 'ftft-kitchen-must-try',
          name: prod.restaurantName || 'Partner Restaurant',
          images: [],
          isOpen: true,
          address: { line1: 'Partner Store' }
        } as any;

    const rawPrice = Number(prod.price) || 0;
    const priceInPaise = rawPrice >= 100 ? rawPrice : rawPrice * 100;
    const dishImages = (prod.images && prod.images.length > 0) ? prod.images : [getFoodProductImage(prod)];
    
    const formattedItem = {
      _id: prod._id || prod.id || `mt-${prod.name.replace(/\s+/g, '-')}`,
      name: prod.name,
      price: priceInPaise,
      description: prod.description || 'A must-try signature dish!',
      images: dishImages,
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

  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchRestaurants(),
      refetchMustTry(),
      refetchRecommended(),
      refetchUnder99(),
      fetchOffers(),
      fetchSpotlights(),
    ]);
    setRefreshing(false);
  }, [refetchRestaurants, refetchMustTry, refetchRecommended, refetchUnder99, fetchOffers, fetchSpotlights]);

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

            {/* Top Search Bar Row with Kinare/Beside VEG Switch */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 16,
                marginBottom: 12,
                gap: 10,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 50,
                }}
                onPress={() => router.push({ pathname: '/(tabs)/search', params: vegOnly ? { veg: 'true' } : {} } as any)}
                activeOpacity={0.9}
              >
                <Ionicons name="search" size={20} color="#4B5563" style={{ marginRight: 8 }} />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <TypewriterText
                    texts={['Search "Biryani"', 'Search "Pizza"', 'Search "Burger"']}
                    style={{ fontFamily: STYLISH_FONT, fontSize: 14, color: '#4B5563' }}
                  />
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 8 }} />
                <Ionicons name="mic" size={20} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityLabel="Pure vegetarian food only"
                accessibilityState={{ checked: vegOnly }}
                activeOpacity={0.85}
                onPress={() => setVegOnly((prev) => !prev)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 42,
                  paddingHorizontal: 9,
                  borderRadius: 14,
                  backgroundColor: vegOnly ? '#0B7A55' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: vegOnly ? '#0B7A55' : '#DCE7DC',
                  shadowColor: vegOnly ? '#0B7A55' : '#233323',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: vegOnly ? 0.18 : 0.05,
                  shadowRadius: 5,
                  elevation: 2,
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: BOLD_FONT,
                    fontSize: 11,
                    color: vegOnly ? '#FFFFFF' : '#31523A',
                    letterSpacing: 0.4,
                  }}
                >
                  {vegOnly ? 'VEG ON' : 'VEG'}
                </Text>
                <View
                  style={{
                    width: 26,
                    height: 15,
                    borderRadius: 8,
                    backgroundColor: vegOnly ? 'rgba(255,255,255,0.35)' : '#DCE4DC',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: vegOnly ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 6,
                      backgroundColor: '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 1,
                      elevation: 1,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Active Veg Mode Notification Banner */}
            {vegOnly && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ECFDF5',
                  marginHorizontal: 16,
                  marginBottom: 10,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="leaf" size={14} color="#059669" />
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: '#065F46' }}>
                    Veg Mode Active: Showing Pure Veg & vegetarian dishes
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setVegOnly(false)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close-circle" size={16} color="#059669" />
                </TouchableOpacity>
              </View>
            )}

            {/* Mode Switcher - only visible when Grocery is enabled */}
            {isGroceryEnabled && (
              <SectionSwitcher activeSection={activeSection} onSwitch={handleSectionSwitch} style={{ marginBottom: 12 }} />
            )}
          </View>

          <ScrollView
            ref={foodFeedScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
            bounces={false}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >

            {/* Main Hero Banners (Auto Scrolling) */}
            <AutoScrollHeroBanners />

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
            {/* WHAT'S ON YOUR MIND? (Circular Icons) */}
            {loading && categories.length === 0 ? (
              <View style={{ marginTop: 12, marginBottom: 16 }}>
                <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>What's on your mind?</Text>
                </View>
                <CategoriesRowSkeleton />
              </View>
            ) : categories.length > 0 ? (
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
            ) : null}

            {/* ============================================================ */}
            {/* RECOMMENDED FOR YOU SECTION (Directly Below Categories)       */}
            {/* ============================================================ */}
            {recommendedProducts && recommendedProducts.length > 0 && (
              <View style={{ marginTop: 6, marginBottom: 8 }}>
                {/* Section Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#F0FDFA',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#99F6E4',
                      }}
                    >
                      <MaterialCommunityIcons name="chef-hat" size={18} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>
                        Recommended for You
                      </Text>
                      <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: Colors.textSecondary, marginTop: 1 }}>
                        Handpicked dishes based on popular cravings
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'Recommended' } })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F0FDFA',
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#CCFBF1',
                    }}
                  >
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.primary, marginRight: 2 }}>
                      See All
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Horizontal Scroll Cards with Better Styling */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 14 }}
                >
                  {recommendedProducts.map((prod: any, idx: number) => {
                    const prodId = prod._id || prod.id || `rec-${idx}`;
                    const rawRest = prod.restaurant;
                    const restId = (typeof rawRest === 'object' && rawRest?._id) ? rawRest._id : (typeof rawRest === 'string' ? rawRest : prod.restaurantId);
                    const restaurantName = (typeof rawRest === 'object' && rawRest?.name) ? rawRest.name : prod.restaurantName;
                    const dishImage = getFoodProductImage(prod);
                    const isVeg = prod.isVeg !== false;
                    const isFav = isFavorite(prodId);
                    const qty = getItemQuantityInCart(prodId);
                    const rawPrice = Number(prod.price) || 0;
                    const priceInPaise = rawPrice >= 100 ? rawPrice : rawPrice * 100;
                    const ratingScore = prod.rating?.average ? prod.rating.average.toFixed(1) : '4.8';
                    const tagBadge = prod.isBestseller ? '★ Bestseller' : (idx === 0 || idx === 2 ? '🔥 Popular' : null);

                    const handleCardPress = () => {
                      if (restId) {
                        router.push(`/restaurant/${restId}`);
                      } else {
                        handleAddMustTryProduct(prod);
                      }
                    };

                    return (
                      <TouchableOpacity
                        key={prodId}
                        activeOpacity={0.92}
                        onPress={handleCardPress}
                        style={{
                          width: 172,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 20,
                          padding: 10,
                          borderWidth: 1.2,
                          borderColor: '#F1F5F9',
                          shadowColor: '#0F172A',
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.07,
                          shadowRadius: 10,
                          elevation: 4,
                        }}
                      >
                        {/* Image Wrapper */}
                        <View
                          style={{
                            width: '100%',
                            height: 122,
                            borderRadius: 15,
                            overflow: 'hidden',
                            backgroundColor: '#F8FAFC',
                            position: 'relative',
                          }}
                        >
                          <Image
                            source={{ uri: dishImage }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />

                          {/* Subtle Bottom Gradient */}
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.45)']}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 38 }}
                          />

                          {/* Veg / Non-Veg Indicator (Top Left) */}
                          <View
                            style={{
                              position: 'absolute',
                              top: 7,
                              left: 7,
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              padding: 3,
                              borderRadius: 4,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                              elevation: 2,
                            }}
                          >
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderWidth: 1.5,
                                borderColor: isVeg ? '#16A34A' : '#DC2626',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 2,
                              }}
                            >
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 2.5,
                                  backgroundColor: isVeg ? '#16A34A' : '#DC2626',
                                }}
                              />
                            </View>
                          </View>

                          {/* Bestseller / Popular Tag */}
                          {tagBadge && (
                            <View
                              style={{
                                position: 'absolute',
                                top: 7,
                                left: 26,
                                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                paddingHorizontal: 6,
                                paddingVertical: 2.5,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontFamily: BOLD_FONT, fontSize: 9, color: '#FCD34D' }}>
                                {tagBadge}
                              </Text>
                            </View>
                          )}

                          {/* Favorite Heart (Top Right) */}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleFavorite({
                                _id: prodId,
                                name: prod.name,
                                price: prod.price,
                                images: prod.images || [dishImage],
                                image: dishImage,
                                isVeg: prod.isVeg,
                                type: 'product',
                                addedAt: Date.now(),
                              });
                            }}
                            style={{
                              position: 'absolute',
                              top: 7,
                              right: 7,
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor: 'rgba(255,255,255,0.92)',
                              justifyContent: 'center',
                              alignItems: 'center',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                              elevation: 2,
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isFav ? 'heart' : 'heart-outline'}
                              size={15}
                              color={isFav ? '#EF4444' : '#64748B'}
                            />
                          </TouchableOpacity>

                          {/* Star Rating Badge (Bottom Left) */}
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 5,
                              left: 7,
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Ionicons name="star" size={9} color="#FBBF24" style={{ marginRight: 2.5 }} />
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFFFFF' }}>
                              {ratingScore}
                            </Text>
                          </View>

                          {/* Estimated Delivery Time (Bottom Right) */}
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 5,
                              right: 7,
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255,255,255,0.92)',
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              borderRadius: 5,
                            }}
                          >
                            <Ionicons name="time-outline" size={9} color="#475569" style={{ marginRight: 2 }} />
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 9, color: '#1E293B' }}>
                              {prod.restaurant?.deliveryInfo?.estimatedMinutes || 25}m
                            </Text>
                          </View>
                        </View>

                        {/* Dish Name */}
                        <Text
                          style={{
                            fontFamily: BOLD_FONT,
                            fontSize: 13.5,
                            color: '#0F172A',
                            marginTop: 8,
                            marginBottom: 2,
                            lineHeight: 18,
                          }}
                          numberOfLines={1}
                        >
                          {prod.name}
                        </Text>

                        {/* Restaurant Subtitle */}
                        <Text
                          style={{
                            fontFamily: STYLISH_FONT,
                            fontSize: 11,
                            color: '#64748B',
                            marginBottom: 10,
                          }}
                          numberOfLines={1}
                        >
                          {restaurantName ? `By ${restaurantName}` : 'Kitchen Special'}
                        </Text>

                        {/* Price & Action Row */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 'auto',
                            paddingTop: 4,
                          }}
                        >
                          <View>
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 15, color: '#0F172A' }}>
                              {formatPaise(priceInPaise)}
                            </Text>
                            <Text
                              style={{
                                fontFamily: STYLISH_FONT,
                                fontSize: 10,
                                color: '#94A3B8',
                                textDecorationLine: 'line-through',
                                marginTop: -2,
                              }}
                            >
                              {formatPaise(priceInPaise + 4000)}
                            </Text>
                          </View>

                          {/* Interactive ADD or Quantity Stepper */}
                          {qty > 0 ? (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: Colors.primary,
                                borderRadius: 12,
                                paddingHorizontal: 6,
                                height: 32,
                                shadowColor: Colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 4,
                                elevation: 2,
                              }}
                            >
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(prodId, -1);
                                }}
                                style={{ paddingHorizontal: 3, paddingVertical: 2 }}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Ionicons name="remove" size={14} color="#FFF" />
                              </TouchableOpacity>
                              <Text
                                style={{
                                  fontFamily: BOLD_FONT,
                                  fontSize: 12,
                                  color: '#FFF',
                                  marginHorizontal: 5,
                                }}
                              >
                                {qty}
                              </Text>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(prodId, 1);
                                }}
                                style={{ paddingHorizontal: 3, paddingVertical: 2 }}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Ionicons name="add" size={14} color="#FFF" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleAddMustTryProduct(prod);
                              }}
                              activeOpacity={0.85}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#F0FDFA',
                                borderWidth: 1.2,
                                borderColor: Colors.primary,
                                paddingHorizontal: 11,
                                height: 32,
                                borderRadius: 12,
                                shadowColor: Colors.primary,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 1,
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: BOLD_FONT,
                                  fontSize: 12,
                                  color: Colors.primary,
                                  marginRight: 2,
                                }}
                              >
                                ADD
                              </Text>
                              <Ionicons name="add" size={14} color={Colors.primary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* STEAL DEALS FOR YOU (Premium Swiggy/Cred Style - Positioned Below Recommended for You) */}
            <View style={{ marginTop: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: '#FFEDD5',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#FED7AA',
                    }}
                  >
                    <MaterialCommunityIcons name="ticket-percent" size={19} color="#EA580C" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>
                      Steal Deals for You
                    </Text>
                    <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: Colors.textSecondary, marginTop: 1 }}>
                      Unbeatable discounts & pocket-friendly feasts
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'Offers' } } as any)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFF7ED',
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#FFEDD5',
                    gap: 3,
                  }}
                >
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: '#EA580C' }}>See All</Text>
                  <Ionicons name="chevron-forward" size={13} color="#EA580C" />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 14 }}>
                {offerBanners.length > 0 ? (
                  offerBanners.map((card) => {
                    if (card.displayMode === 'FULL_POSTER') {
                      return (
                        <TouchableOpacity
                          key={card._id}
                          activeOpacity={0.9}
                          onPress={() => handleOfferBannerPress(card)}
                          style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#0F172A', overflow: 'hidden' }}
                        >
                          <Image
                            source={{ uri: card.image }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      );
                    }

                    const bg1 = (Array.isArray(card.colors) && card.colors[0]) ? card.colors[0] : '#0D9488';
                    const bg2 = (Array.isArray(card.colors) && card.colors[1]) ? card.colors[1] : bg1;
                    const isDark = card.textColor === '#1A1A1F';
                    return (
                      <TouchableOpacity
                        key={card._id}
                        activeOpacity={0.9}
                        onPress={() => handleOfferBannerPress(card)}
                        style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: bg1, overflow: 'hidden' }}
                      >
                        <Image
                          source={{ uri: card.image }}
                          style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, opacity: 0.9 }}
                        />
                        <LinearGradient
                          colors={[bg1, bg2]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ position: 'absolute', width: '100%', height: '100%' }}
                        />
                        <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                          {card.tag ? (
                            <View
                              style={{
                                backgroundColor: card.accentColor || 'rgba(255,255,255,0.2)',
                                alignSelf: 'flex-start',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: isDark ? '#1A1A1F' : '#FFF' }}>
                                {card.tag}
                              </Text>
                            </View>
                          ) : null}
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 24, color: card.textColor || '#FFF', lineHeight: 28 }}>
                            {card.title}
                          </Text>
                          {card.subtitle ? (
                            <Text
                              style={{
                                fontFamily: STYLISH_FONT,
                                fontSize: 13,
                                color: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
                                marginTop: 2,
                              }}
                            >
                              {card.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <>
                    {/* Fallback Card 1 */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'Pizza' } } as any)}
                      style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#0D9488', overflow: 'hidden' }}
                    >
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

                    {/* Fallback Card 2 */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'Dessert' } } as any)}
                      style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#F59E0B', overflow: 'hidden' }}
                    >
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' }} style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, opacity: 0.9 }} />
                      <LinearGradient colors={['rgba(245,158,11,0.9)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                      <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 }}>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }}>MEGA OFFER</Text>
                        </View>
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 24, color: '#FFF', lineHeight: 28 }}>Buy 1 Get 1</Text>
                        <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>on selected desserts</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Fallback Card 3 */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'Salad' } } as any)}
                      style={{ width: 280, height: 130, borderRadius: 24, backgroundColor: '#E11D48', overflow: 'hidden' }}
                    >
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
                  </>
                )}
              </ScrollView>
            </View>

            <NinetyNineStoreSection
              products={under99Products}
              getDishImage={getFoodProductImage}
              getQty={getItemQuantityInCart}
              onAdd={handleAddMustTryProduct}
              onChangeQty={updateQuantity}
              onOpenRestaurant={(id) => router.push(`/restaurant/${id}`)}
              onViewAll={() => router.push({ pathname: '/(tabs)/search', params: { q: 'budget' } } as any)}
            />

            {/* Grey Divider */}
            <View style={{ height: 8, backgroundColor: '#F3F4F6', marginVertical: 16 }} />

            {/* TOP RESTAURANTS NEAR YOU (VERTICAL FULL WIDTH) */}
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5, marginBottom: 16 }}>Restaurants Near You</Text>

              {loading ? (
                <View style={{ gap: 16, paddingBottom: 16 }}>
                  <RestaurantCardSkeleton />
                  <RestaurantCardSkeleton />
                  <RestaurantCardSkeleton />
                </View>
              ) : fetchError ? (
                <View style={styles.emptyState}><Text style={styles.emptyTitle}>Could not load restaurants</Text></View>
              ) : restaurants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    {vegOnly ? 'No Pure Veg Restaurants Nearby' : 'No Restaurants Nearby'}
                  </Text>
                  {vegOnly && (
                    <TouchableOpacity
                      onPress={() => setVegOnly(false)}
                      style={{
                        marginTop: 12,
                        backgroundColor: '#10B981',
                        paddingHorizontal: 18,
                        paddingVertical: 9,
                        borderRadius: 12,
                        alignSelf: 'center',
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontFamily: BOLD_FONT, color: '#FFFFFF', fontSize: 13 }}>
                        Show All Restaurants
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{ gap: 24, paddingBottom: 16 }}>
                  {restaurantsToShow.map((r) => {
                    const isFav = isFavorite(r._id);
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
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite({
                              _id: r._id,
                              name: r.name,
                              price: 0,
                              image: r.coverImage || r.images?.[0] || '',
                              images: r.images || [],
                              type: 'restaurant',
                              cuisine: r.cuisines?.join(', '),
                              rating: r.rating?.average,
                              addedAt: Date.now(),
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? '#EF4444' : Colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Teal Discount Badge */}
                        <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 13 }}>60% OFF / UPTO ₹120</Text>
                        </View>
                      </View>

                      <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>{r.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: (r.rating?.count > 0 && r.rating?.average) ? Colors.success : '#6B7280', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 12, marginRight: (r.rating?.count > 0 && r.rating?.average) ? 2 : 0 }}>
                              {r.rating?.count > 0 && r.rating?.average ? `${r.rating.average.toFixed(1)} (${r.rating.count})` : 'NEW'}
                            </Text>
                            {r.rating?.count > 0 && r.rating?.average ? (
                              <Ionicons name="star" size={10} color="#FFF" />
                            ) : null}
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

            {/* TRENDING DISHES */}
            <View style={{ marginTop: 8, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <Ionicons name="flame" size={19} color="#F97316" style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 19, color: Colors.text, letterSpacing: -0.5 }}>
                      Trending Dishes
                    </Text>
                  </View>
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 12, color: Colors.textSecondary }}>
                    Local favourites everyone is loving
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'trending' } } as any)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 10 }}
                >
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.primary, marginRight: 3 }}>See all</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {loadingRecommended && recommendedProducts.length === 0 ? (
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
                  {[0, 1].map((item) => (
                    <View
                      key={item}
                      style={{ width: 210, height: 230, borderRadius: 20, backgroundColor: '#F3F4F6' }}
                    />
                  ))}
                </View>
              ) : recommendedProducts.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 14 }}
                >
                  {recommendedProducts.slice(0, 10).map((prod: any, idx: number) => {
                    const prodId = prod._id || prod.id || `trending-${idx}`;
                    const rawRestaurant = prod.restaurant;
                    const restaurantId =
                      (typeof rawRestaurant === 'object' && rawRestaurant?._id)
                        ? rawRestaurant._id
                        : (typeof rawRestaurant === 'string' ? rawRestaurant : prod.restaurantId);
                    const restaurantName =
                      (typeof rawRestaurant === 'object' && rawRestaurant?.name)
                        ? rawRestaurant.name
                        : (prod.restaurantName || 'Popular near you');
                    const rawPrice = Number(prod.price) || 0;
                    const priceInPaise = rawPrice >= 100 ? rawPrice : rawPrice * 100;

                    return (
                      <TouchableOpacity
                        key={prodId}
                        activeOpacity={0.93}
                        onPress={() => {
                          if (restaurantId) {
                            router.push(`/restaurant/${restaurantId}`);
                          } else {
                            router.push({ pathname: '/(tabs)/search', params: { q: prod.name } } as any);
                          }
                        }}
                        style={{
                          width: 210,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 20,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: '#F1F5F9',
                          shadowColor: '#0F172A',
                          shadowOffset: { width: 0, height: 5 },
                          shadowOpacity: 0.07,
                          shadowRadius: 10,
                          elevation: 3,
                        }}
                      >
                        <View style={{ height: 142, backgroundColor: '#F3F4F6', position: 'relative' }}>
                          <Image
                            source={{ uri: getFoodProductImage(prod) }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                          <LinearGradient
                            colors={['transparent', 'rgba(15,23,42,0.4)']}
                            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56 }}
                          />
                          <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 }}>
                            <Ionicons name="flame" size={12} color="#EA580C" />
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#C2410C', marginLeft: 4 }}>
                              {prod.isBestseller ? 'BESTSELLER' : 'TRENDING'}
                            </Text>
                          </View>
                          <View style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: Colors.text }} numberOfLines={1}>
                              {restaurantName}
                            </Text>
                          </View>
                          <View style={{ position: 'absolute', top: 11, right: 11, width: 17, height: 17, borderWidth: 1, borderColor: prod.isVeg === false ? '#DC2626' : '#059669', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 3 }}>
                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: prod.isVeg === false ? '#DC2626' : '#059669' }} />
                          </View>
                        </View>

                        <View style={{ padding: 12 }}>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 15, color: Colors.text, marginBottom: 9 }} numberOfLines={1}>
                            {prod.name}
                          </Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 15, color: Colors.text }}>
                              {formatPaise(priceInPaise)}
                            </Text>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={(event) => {
                                event.stopPropagation();
                                handleAddMustTryProduct(prod);
                              }}
                              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
                            >
                              <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: Colors.primary, marginRight: 3 }}>ADD</Text>
                              <Ionicons name="add" size={14} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: 'popular dishes' } } as any)}
                  style={{ marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: '#F0FDFA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ flex: 1, fontFamily: STYLISH_FONT, fontSize: 13, color: Colors.textSecondary, marginRight: 12 }}>
                    Explore popular dishes around you
                  </Text>
                  <Ionicons name="arrow-forward-circle" size={25} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* FREQUENTLY BOUGHT PRODUCTS */}
            <View style={{ marginBottom: 24, paddingTop: 8, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                      <Ionicons name="repeat" size={14} color="#4E6D3A" style={{ marginRight: 5 }} />
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#4E6D3A', letterSpacing: 1.1 }}>
                        EVERYDAY FAVOURITES
                      </Text>
                    </View>
                    <Text style={{ fontFamily: BOLD_FONT, fontSize: 20, color: '#263523', letterSpacing: -0.5 }}>
                      Frequently bought
                    </Text>
                    <Text style={{ fontFamily: STYLISH_FONT, fontSize: 12, color: '#7E8978', marginTop: 3 }}>
                      Top picks, ready for your basket
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSection('grocery')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DEE5D4', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, marginLeft: 8 }}
                >
                  <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: '#4E6D3A', marginRight: 4 }}>Shop all</Text>
                  <Ionicons name="arrow-forward" size={12} color="#4E6D3A" />
                </TouchableOpacity>
              </View>

              {loadingFrequentProducts && frequentlyBoughtProducts.length === 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                  {[0, 1, 2].map((item) => (
                    <View key={item} style={{ width: Math.min(width * 0.43, 188), height: 235, borderRadius: 18, backgroundColor: '#F1F4EA' }} />
                  ))}
                </ScrollView>
              ) : frequentProductsError && frequentlyBoughtProducts.length === 0 ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => refetchFrequentProducts()}
                  style={{ marginHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ fontFamily: STYLISH_FONT, fontSize: 13, color: '#7E8978' }}>
                    Couldn’t load products. Tap to retry.
                  </Text>
                  <Ionicons name="refresh" size={17} color="#4E6D3A" />
                </TouchableOpacity>
              ) : frequentlyBoughtProducts.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}
                >
                  {frequentlyBoughtProducts.map((product) => (
                    <FrequentlyBoughtProductCard
                      key={product._id || product.id}
                      product={product}
                    />
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSection('grocery')}
                  style={{ marginHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ flex: 1, fontFamily: STYLISH_FONT, fontSize: 13, color: '#7E8978' }}>
                    Browse groceries and everyday essentials
                  </Text>
                  <Ionicons name="arrow-forward-circle" size={24} color="#4E6D3A" />
                </TouchableOpacity>
              )}
            </View>

            {/* SPOTLIGHT DEALS */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Spotlight Deals</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/search', params: { filter: 'spotlight' } } as any)}
                >
                  <Text style={styles.seeAllText}>Explore <Ionicons name="arrow-forward" size={12} /></Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
                {spotlightBanners.length > 0 ? (
                  spotlightBanners.map((item, idx) => {
                    if (item.displayMode === 'FULL_POSTER') {
                      return (
                        <TouchableOpacity
                          key={item._id}
                          onPress={() => handleOfferBannerPress(item)}
                          style={{ width: 220, height: 260, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0F172A', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 }}
                          activeOpacity={0.9}
                        >
                          <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={item._id}
                        onPress={() => handleOfferBannerPress(item)}
                        style={{ width: 220, height: 260, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 }}
                        activeOpacity={0.9}
                      >
                        <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                          style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                        >
                          {item.tag ? (
                            <View style={{ backgroundColor: item.accentColor || 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 }}>
                              <Text style={{ fontFamily: BOLD_FONT, color: '#FFF', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{item.tag}</Text>
                            </View>
                          ) : null}
                          <Text style={{ fontFamily: BOLD_FONT, color: item.textColor || '#FFF', fontSize: 20, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="flame" size={14} color="#F59E0B" />
                            <Text style={{ fontFamily: STYLISH_FONT, color: '#FCD34D', fontSize: 12, marginLeft: 4 }} numberOfLines={1}>
                              {item.subtitle || 'Special Deal'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  restaurants.slice(0, 4).map((item, idx) => (
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
                  ))
                )}
              </ScrollView>
            </View>

            {/* MUST-TRY PRODUCTS */}
            <View style={{ paddingBottom: 16 }}>
              {mustTryProducts && mustTryProducts.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                    <View>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 18, color: Colors.text, letterSpacing: -0.5 }}>Must-Try Products</Text>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 11, color: Colors.textSecondary }}>Handpicked dishes from top restaurants</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/search')} style={{ backgroundColor: '#F0FDFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#99F6E4' }}>
                      <Text style={{ fontFamily: BOLD_FONT, fontSize: 12, color: Colors.primary }}>See All</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
                    {mustTryProducts.map((prod: any, idx: number) => {
                      const restId = prod.restaurant?._id || (typeof prod.restaurant === 'string' ? prod.restaurant : null) || prod.restaurantId;
                      const restaurantName = prod.restaurant?.name || prod.restaurantName;
                      const dishImage = getFoodProductImage(prod);
                      const tagText = (prod.tags && prod.tags.length > 0) ? prod.tags[0] : (prod.tag || (prod.isVeg !== false ? '🌱 Pure Veg' : '🍗 Non-Veg'));

                      const handleCardPress = () => {
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
                          width: 154,
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
                            source={{ uri: dishImage }}
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
                            <Text style={{ fontFamily: BOLD_FONT, fontSize: 10, color: '#FFF' }} numberOfLines={1}>{tagText}</Text>
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
                                images: prod.images || [dishImage],
                                image: dishImage,
                                tag: tagText,
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
                        <Text style={{ fontFamily: BOLD_FONT, fontSize: 13, color: Colors.text, marginBottom: 2 }} numberOfLines={1}>{prod.name}</Text>

                        {/* Restaurant Name */}
                        {restaurantName ? (
                          <Text style={{ fontFamily: STYLISH_FONT, fontSize: 11, color: Colors.textSecondary, marginBottom: 8 }} numberOfLines={1}>
                            {restaurantName}
                          </Text>
                        ) : (
                          <View style={{ height: 6 }} />
                        )}

                        {/* Price + Add Button */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <Text style={{ fontFamily: BOLD_FONT, fontSize: 15, color: Colors.primary }}>
                            {formatPaise(Number(prod.price) >= 100 ? Number(prod.price) : Number(prod.price) * 100)}
                          </Text>
                          <TouchableOpacity onPress={() => handleAddMustTryProduct(prod)} style={{ width: 30, height: 30, backgroundColor: '#0D9488', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#0D9488', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 }}>
                            <Ionicons name="add" size={18} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ); })}
                  </ScrollView>
                </View>
              )}

            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => foodFeedScrollRef.current?.scrollTo({ y: 0, animated: true })}
              style={{ alignSelf: 'center', marginTop: 8, marginBottom: 28, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11 }}
              >
                <Ionicons name="arrow-up" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: BOLD_FONT, fontSize: 13, color: '#FFFFFF' }}>Back to top</Text>
              </LinearGradient>
            </TouchableOpacity>

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
