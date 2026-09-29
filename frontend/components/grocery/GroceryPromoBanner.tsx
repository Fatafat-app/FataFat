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

const { width } = Dimensions.get('window');

// Ftafat Branded Fallback Banners for Grocery
const FATAFAT_GROCERY_BANNERS = [
  { 
    id: 1, 
    title: 'Ftafat Fresh 🥦', 
    subtitle: 'Farm to Door', 
    desc: 'Fresh organic vegetables\n& fruits in 10 mins!', 
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80', 
    bgColor: '#E6F4EA', 
    textColor: '#1E3D34' 
  },
  { 
    id: 2, 
    title: 'Ftafat Mart 🏠', 
    subtitle: 'Mega Deals', 
    desc: 'Up to 50% OFF on\ndaily household essentials.', 
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80', 
    bgColor: '#FCE8E6', 
    textColor: '#B31412' 
  },
  { 
    id: 3, 
    title: 'Ftafat Dairy 🥛', 
    subtitle: 'Morning Fresh', 
    desc: 'Daily essentials delivered\nbefore you wake up.', 
    image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=800&q=80', 
    bgColor: '#E8F0FE', 
    textColor: '#174EA6' 
  },
  { 
    id: 4, 
    title: 'Ftafat Snacks 🍟', 
    subtitle: 'Party Ready!', 
    desc: 'Cold drinks & chips\ndelivered instantly.', 
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80', 
    bgColor: '#FEF7E0', 
    textColor: '#B06000' 
  },
];

interface GroceryPromoBannerProps {
  banners?: any[];
  onBannerPress?: (banner: any) => void;
}

export function GroceryPromoBanner({ banners: propBanners, onBannerPress }: GroceryPromoBannerProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      let nextBanner = activeBanner + 1;
      if (nextBanner >= FATAFAT_GROCERY_BANNERS.length) {
        nextBanner = 0;
      }
      bannerScrollRef.current?.scrollTo({ x: nextBanner * width, animated: true });
      setActiveBanner(nextBanner);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeBanner]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveBanner(index);
  };

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
        {FATAFAT_GROCERY_BANNERS.map((banner) => (
          <TouchableOpacity 
            key={banner.id} 
            activeOpacity={0.9}
            style={[styles.bannerContainer, { backgroundColor: banner.bgColor }]}
            onPress={() => onBannerPress?.(banner)}
          >
            <View style={styles.bannerTextContent}>
              <View style={styles.brandPill}>
                <Text style={styles.brandText}>{banner.title}</Text>
              </View>
              <Text style={[styles.bannerSubtitle, { color: banner.textColor }]}>{banner.subtitle}</Text>
              <Text style={styles.bannerDesc}>{banner.desc}</Text>
              
              <View style={[styles.cta, { backgroundColor: banner.textColor }]}>
                <Text style={styles.ctaText}>Shop Now</Text>
              </View>
            </View>
            <View style={styles.imageSide}>
              <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', banner.bgColor]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.fadeGradient}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {FATAFAT_GROCERY_BANNERS.map((_, i) => (
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
    transition: 'width 0.3s',
  },
});
