import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium fonts for banners
const BOLD_FONT = Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' });
const REGULAR_FONT = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const STYLISH_SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const bannersData = [
  {
    id: '1',
    tag: 'LIMITED TIME',
    title: 'Midnight',
    titleBrand: 'Cravings?',
    sub: 'Hot & fresh food delivered\nin 20 mins flat.',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
    colors: ['#0D9488', '#0F766E'], // Deep Teal
    accent: '#CCFBF1',
    actionText: 'Order Now',
    watermark: 'CRAVE',
  },
  {
    id: '2',
    tag: 'EXCLUSIVE',
    title: 'Flat 50%',
    titleBrand: 'OFF TODAY',
    sub: 'On your favorite pizzas\nand local meals.',
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    colors: ['#F59E0B', '#D97706'], // Amber
    accent: '#FEF3C7',
    actionText: 'Claim Offer',
    watermark: 'DEALS',
  },
  {
    id: '3',
    tag: 'HOT & SPICY',
    title: 'Desi',
    titleBrand: 'Flavors',
    sub: 'Authentic Indian curries\n& tandoori specials.',
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80',
    colors: ['#EA580C', '#C2410C'], // Deep Orange
    accent: '#FFEDD5',
    actionText: 'Spice it Up',
    watermark: 'SPICY',
  },
  {
    id: '4',
    tag: 'FESTIVE',
    title: 'Maha',
    titleBrand: 'Thali',
    sub: 'Enjoy our grand veg thali\nwith family & friends.',
    img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80',
    colors: ['#F97316', '#EA580C'], // Bright Orange
    accent: '#FFF7ED',
    actionText: 'Feast Now',
    watermark: 'THALI',
  },
  {
    id: '5',
    tag: 'HEALTHY',
    title: 'Fresh',
    titleBrand: 'Salads',
    sub: 'Crafted for your healthy\nlifestyle & diet.',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
    colors: ['#10B981', '#059669'], // Emerald
    accent: '#D1FAE5',
    actionText: 'View Menu',
    watermark: 'FRESH',
  },
  {
    id: '6',
    tag: 'DESSERTS',
    title: 'Sweet',
    titleBrand: 'Tooth?',
    sub: 'Buy 1 Get 1 on all\npremium desserts.',
    img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=80',
    colors: ['#6366F1', '#4F46E5'], // Indigo
    accent: '#E0E7FF',
    actionText: 'Grab Now',
    watermark: 'SWEET',
  }
];

import { useRouter } from 'expo-router';
import { bannerService } from '../services/banner.service';

let cachedFoodBanners: any[] | null = null;

export function AutoScrollHeroBanners() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>(() => cachedFoodBanners || []);
  const [loading, setLoading] = useState(() => !cachedFoodBanners);
  const BANNER_WIDTH = SCREEN_WIDTH - 24;
  const ITEM_WIDTH = BANNER_WIDTH + 12;

  useEffect(() => {
    let isMounted = true;
    bannerService
      .getBanners('FOOD_HERO')
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          const mapped = data.map((b) => ({
            id: b._id,
            tag: b.tag || 'PROMO',
            title: b.title,
            titleBrand: b.subtitle || '',
            sub: b.description || '',
            img: typeof b.image === 'string' ? b.image.replace(/&amp;/g, '&') : b.image,
            displayMode: b.displayMode || 'CARD_TEMPLATE',
            colors: b.colors && b.colors.length >= 2 ? b.colors : ['#0D9488', '#0F766E'],
            accent: b.accentColor || '#CCFBF1',
            textColor: b.textColor || '#FFFFFF',
            actionText: b.actionText || 'Order Now',
            watermark: (b.tag || b.title || 'DEAL').slice(0, 6).toUpperCase(),
            targetType: b.targetType,
            targetId: b.targetId,
          }));
          cachedFoodBanners = mapped;
          setBanners(mapped);
        } else {
          cachedFoodBanners = [];
          setBanners([]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        if (!cachedFoodBanners) {
          setBanners(bannersData);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }

      const xOffset = nextIndex * ITEM_WIDTH;
      scrollViewRef.current?.scrollTo({ x: xOffset, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  const handleScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    setCurrentIndex(index);
  };

  const handleBannerPress = (banner: any) => {
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

  if (loading && banners.length === 0) {
    return (
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 12 }}>
          <View style={[styles.heroBanner, { width: BANNER_WIDTH, backgroundColor: '#F1F5F9' }]}>
            <LinearGradient
              colors={['#F1F5F9', '#E2E8F0', '#F1F5F9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10, gap: 12 }}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
      >
        {banners.map((banner) => {
          if ((banner as any).displayMode === 'FULL_POSTER') {
            return (
              <TouchableOpacity activeOpacity={0.95} key={banner.id} onPress={() => handleBannerPress(banner)}>
                <View style={[styles.heroBanner, { width: BANNER_WIDTH, backgroundColor: '#0F172A' }]}>
                  <Image
                    source={{ uri: banner.img }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            );
          }

          const color1 = (Array.isArray(banner.colors) && banner.colors[0]) || '#0D9488';
          const color2 = (Array.isArray(banner.colors) && banner.colors[1]) || color1;
          const isAmber = (banner as any).textColor === '#1A1A1F' || banner.id === '2';
          return (
            <TouchableOpacity activeOpacity={0.95} key={banner.id} onPress={() => handleBannerPress(banner)}>
              <View style={[styles.heroBanner, { width: BANNER_WIDTH, backgroundColor: color1 }]}>
                {/* Vibrant Gradient Background */}
                <LinearGradient
                  colors={[color1, color2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Dynamic Rotated Floating Image */}
                <View style={styles.rotatedImageContainer}>
                  <Image source={{ uri: banner.img }} style={styles.rotatedImage} />
                </View>

                <View style={styles.contentWrapper}>
                  {banner.tag ? (
                    <View style={[styles.tagPill, { backgroundColor: banner.accent }]}>
                      <Text style={[styles.tagText, { color: banner.colors[1] }]}>{banner.tag}</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.titleText, isAmber && { color: '#1A1A1F' }]}>{banner.title}</Text>
                  {banner.titleBrand ? (
                    <Text style={[styles.brandText, isAmber && { color: '#1A1A1F' }]}>{banner.titleBrand}</Text>
                  ) : null}
                  {banner.sub ? (
                    <Text style={[styles.subText, isAmber && { color: '#1A1A1F' }]}>{banner.sub}</Text>
                  ) : null}

                  <View style={styles.actionBtn}>
                    <Text style={[styles.actionBtnText, { color: banner.colors[0] }]}>{banner.actionText}</Text>
                    <Ionicons name="arrow-forward" size={14} color={banner.colors[0]} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pagination */}
      <View style={styles.paginationRow}>
        {banners.map((_, idx) => (
          <View key={idx} style={[styles.dot, currentIndex === idx ? styles.activeDot : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  heroBanner: {
    height: 200,
    borderTopLeftRadius: 48,
    borderBottomRightRadius: 48,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  watermarkText: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    fontFamily: BOLD_FONT,
    fontSize: 90,
    opacity: 0.15,
    transform: [{ rotate: '-10deg' }],
  },
  rotatedImageContainer: {
    position: 'absolute',
    right: -30,
    top: 5,
    width: 185,
    height: 220,
    borderRadius: 28,
    transform: [{ rotate: '-12deg' }],
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: '#F3F4F6',
  },
  imageFallback: {
    ...StyleSheet.absoluteFill as any,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  fallbackText: {
    fontFamily: BOLD_FONT,
    fontSize: 20,
    opacity: 0.3,
    transform: [{ rotate: '12deg' }], // Counteract parent rotation so text is straight
  },
  rotatedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: '62%',
    zIndex: 5,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  tagText: {
    fontFamily: BOLD_FONT,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    fontFamily: STYLISH_SERIF,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  brandText: {
    fontFamily: STYLISH_SERIF,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 32,
    marginBottom: 6,
    fontWeight: '700',
  },
  subText: {
    fontFamily: REGULAR_FONT,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    marginRight: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0D9488',
  }
});
