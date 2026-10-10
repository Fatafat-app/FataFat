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

export function AutoScrollHeroBanners() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const BANNER_WIDTH = SCREEN_WIDTH - 24;
  const ITEM_WIDTH = BANNER_WIDTH + 12;

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= bannersData.length) {
        nextIndex = 0;
      }

      const xOffset = nextIndex * ITEM_WIDTH;
      scrollViewRef.current?.scrollTo({ x: xOffset, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    setCurrentIndex(index);
  };

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
        {bannersData.map((banner) => {
          const isAmber = banner.id === '2'; // The 50% OFF banner
          return (
            <TouchableOpacity activeOpacity={0.95} key={banner.id}>
              <View style={[styles.heroBanner, { width: BANNER_WIDTH, backgroundColor: banner.colors[0] }]}>
                {/* Vibrant Gradient Background */}
                <LinearGradient
                  colors={banner.colors as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Dynamic Rotated Floating Image */}
                <View style={styles.rotatedImageContainer}>
                  <Image source={{ uri: banner.img }} style={styles.rotatedImage} />
                </View>

                <View style={styles.contentWrapper}>
                  <View style={[styles.tagPill, { backgroundColor: banner.accent }]}>
                    <Text style={[styles.tagText, { color: banner.colors[1] }]}>{banner.tag}</Text>
                  </View>

                  <Text style={[styles.titleText, isAmber && { color: '#1A1A1F' }]}>{banner.title}</Text>
                  <Text style={[styles.brandText, isAmber && { color: '#1A1A1F' }]}>{banner.titleBrand}</Text>
                  <Text style={[styles.subText, isAmber && { color: '#1A1A1F' }]}>{banner.sub}</Text>

                  <View style={styles.actionBtn}>
                    <Text style={[styles.actionBtnText, { color: '#0B7A75' }]}>{banner.actionText}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0B7A75" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pagination */}
      <View style={styles.paginationRow}>
        {bannersData.map((_, idx) => (
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
