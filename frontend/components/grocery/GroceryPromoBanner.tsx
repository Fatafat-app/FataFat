import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRadius, GSpacing, GColors } from '../../constants/GroceryTheme';
import { useRouter } from 'expo-router';
import { bannerService } from '../../services/banner.service';

const { width } = Dimensions.get('window');

// Ftafat Branded Fallback Banners for Grocery
const FATAFAT_GROCERY_BANNERS = [
  { 
    id: '1', 
    title: 'Ftafat Fresh 🥦', 
    subtitle: 'Farm to Door', 
    desc: 'Fresh organic vegetables\n& fruits in 10 mins!', 
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80', 
    bgColor: '#E6F4EA', 
    textColor: '#1E3D34',
    actionText: 'Shop Fresh',
  },
  { 
    id: '2', 
    title: 'Ftafat Mart 🏠', 
    subtitle: 'Mega Deals', 
    desc: 'Up to 50% OFF on\ndaily household essentials.', 
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80', 
    bgColor: '#FCE8E6', 
    textColor: '#B31412',
    actionText: 'Shop Deals',
  },
  { 
    id: '3', 
    title: 'Ftafat Dairy 🥛', 
    subtitle: 'Morning Fresh', 
    desc: 'Daily essentials delivered\nbefore you wake up.', 
    image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=800&q=80', 
    bgColor: '#E8F0FE', 
    textColor: '#174EA6',
    actionText: 'Order Dairy',
  },
  { 
    id: '4', 
    title: 'Ftafat Snacks 🍟', 
    subtitle: 'Party Ready!', 
    desc: 'Cold drinks & chips\ndelivered instantly.', 
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80', 
    bgColor: '#FEF7E0', 
    textColor: '#B06000',
    actionText: 'Munch Now',
  },
];

interface NormalizedBanner {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  displayMode?: 'FULL_POSTER' | 'CARD_TEMPLATE';
  bgColor: string;
  textColor: string;
  actionText: string;
  targetType?: string;
  targetId?: string;
}

function normalizeBanner(b: any, index: number): NormalizedBanner {
  const safeBg =
    b.bgColor ||
    b.bgGradient?.from ||
    (Array.isArray(b.colors) && b.colors[0]) ||
    '#E6F4EA';

  const rawImage = b.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
  const cleanImage = typeof rawImage === 'string' ? rawImage.replace(/&amp;/g, '&') : rawImage;

  return {
    id: String(b._id || b.id || index),
    title: b.title || 'Ftafat Grocery',
    subtitle: b.subtitle || '',
    desc: b.desc || b.description || (b.code ? `Use coupon ${b.code}` : ''),
    image: cleanImage,
    displayMode: b.displayMode || 'CARD_TEMPLATE',
    bgColor: safeBg,
    textColor: b.textColor || '#1E3D34',
    actionText: b.actionText || 'Shop Now',
    targetType: b.targetType || b.linkType,
    targetId: b.targetId,
  };
}

interface GroceryPromoBannerProps {
  banners?: any[];
  onBannerPress?: (banner: any) => void;
}

let cachedGroceryBanners: NormalizedBanner[] | null = null;

export function GroceryPromoBanner({ banners: propBanners, onBannerPress }: GroceryPromoBannerProps) {
  const router = useRouter();
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [banners, setBanners] = useState<NormalizedBanner[]>(() => {
    if (cachedGroceryBanners && cachedGroceryBanners.length > 0) {
      return cachedGroceryBanners;
    }
    if (propBanners && propBanners.length > 0) {
      return propBanners.map(normalizeBanner);
    }
    return [];
  });

  useEffect(() => {
    let isMounted = true;
    bannerService
      .getBanners('GROCERY_HERO')
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          const mapped = data.map(normalizeBanner);
          cachedGroceryBanners = mapped;
          setBanners(mapped);
        } else if (propBanners && propBanners.length > 0) {
          const mapped = propBanners.map(normalizeBanner);
          cachedGroceryBanners = mapped;
          setBanners(mapped);
        } else {
          cachedGroceryBanners = [];
          setBanners([]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (propBanners && propBanners.length > 0) {
          setBanners(propBanners.map(normalizeBanner));
        } else if (!cachedGroceryBanners) {
          setBanners(FATAFAT_GROCERY_BANNERS.map(normalizeBanner));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [propBanners]);

  // Auto-scroll logic
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      let nextBanner = activeBanner + 1;
      if (nextBanner >= banners.length) {
        nextBanner = 0;
      }
      bannerScrollRef.current?.scrollTo({ x: nextBanner * width, animated: true });
      setActiveBanner(nextBanner);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeBanner, banners.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveBanner(index);
  };

  const handlePress = (banner: NormalizedBanner) => {
    if (onBannerPress) {
      onBannerPress(banner);
      return;
    }
    if (banner.targetType === 'category' && banner.targetId) {
      router.push({ pathname: '/(tabs)/search', params: { category: banner.targetId } } as any);
    } else if (banner.targetType === 'search' && banner.targetId) {
      router.push({ pathname: '/(tabs)/search', params: { q: banner.targetId } } as any);
    } else if (banner.targetId) {
      router.push({ pathname: '/(tabs)/search', params: { q: banner.targetId } } as any);
    }
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.bannerWrapper}>
      <ScrollView
        ref={bannerScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="center"
      >
        {banners.map((banner) => {
          if (banner.displayMode === 'FULL_POSTER') {
            return (
              <TouchableOpacity 
                key={banner.id} 
                activeOpacity={0.9}
                style={[styles.bannerContainer, { backgroundColor: '#0F172A' }]}
                onPress={() => handlePress(banner)}
              >
                <Image
                  source={{ uri: banner.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            );
          }

          const safeBg = banner.bgColor || '#E6F4EA';
          return (
            <TouchableOpacity 
              key={banner.id} 
              activeOpacity={0.9}
              style={[styles.bannerContainer, { backgroundColor: safeBg }]}
              onPress={() => handlePress(banner)}
            >
              <View style={styles.bannerTextContent}>
                <View style={styles.brandPill}>
                  <Text style={styles.brandText}>{banner.title}</Text>
                </View>
                {banner.subtitle ? (
                  <Text style={[styles.bannerSubtitle, { color: banner.textColor || '#1E3D34' }]}>{banner.subtitle}</Text>
                ) : null}
                {banner.desc ? (
                  <Text style={styles.bannerDesc}>{banner.desc}</Text>
                ) : null}
                
                <View style={[styles.cta, { backgroundColor: banner.textColor || '#1E3D34' }]}>
                  <Text style={styles.ctaText}>{banner.actionText || 'Shop Now'}</Text>
                </View>
              </View>
              <View style={styles.imageSide}>
                <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
                <LinearGradient
                  colors={['rgba(255,255,255,0)', safeBg]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.fadeGradient}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeBanner && { backgroundColor: '#1E3D34', width: 16 }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: { 
    marginBottom: 24,
    marginTop: 8,
  },
  bannerContainer: {
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 24,
    height: 180, // Taller and more immersive
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerTextContent: { 
    flex: 1.3, 
    padding: 20, 
    justifyContent: 'center',
    zIndex: 2,
  },
  brandPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  brandText: { 
    fontFamily: BOLD_FONT, 
    fontSize: 10, 
    color: '#D94E1B',
    textTransform: 'uppercase',
  },
  bannerSubtitle: { 
    fontFamily: BOLD_FONT, 
    fontSize: 26, 
    marginTop: 4, 
    letterSpacing: -1,
    lineHeight: 30,
  },
  bannerDesc: { 
    fontFamily: STYLISH_FONT, 
    fontSize: 12, 
    color: '#4B5563', 
    marginTop: 8, 
    lineHeight: 16 
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: GRadius.full,
    marginTop: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: BOLD_FONT,
  },
  imageSide: {
    flex: 1,
    position: 'relative',
  },
  bannerImage: { 
    flex: 1, 
    height: '100%',
  },
  fadeGradient: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: 60, // Smooth fade transition from image to text
  },
  dotsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 14 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#D1D5DB', 
    marginHorizontal: 4, 
  },
});
