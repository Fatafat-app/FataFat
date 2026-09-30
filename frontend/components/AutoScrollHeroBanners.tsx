import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOLD_FONT = 'PlusJakartaSans-Bold';

const bannersData = [
  {
    id: '1',
    title: 'Only on',
    titleBrand: 'FtaFat!',
    sub: 'Lightning fast delivery.\nHot & fresh at your door.',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    colors: ['#FFE4D6', 'rgba(255,228,214,0.9)', 'transparent'],
    textColor: '#5E2B16',
  },
  {
    id: '2',
    title: 'FtaFat',
    titleBrand: 'Exclusive',
    sub: 'Flat 50% OFF on your\nfavorite local meals.',
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    colors: ['#FFF0E5', 'rgba(255,240,229,0.9)', 'transparent'],
    textColor: '#D94E1B',
  },
  {
    id: '3',
    title: 'Craving',
    titleBrand: 'FtaFat?',
    sub: 'Authentic Indian flavors\ndelivered in minutes.',
    img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
    colors: ['#FFFBEB', 'rgba(255,251,235,0.9)', 'transparent'],
    textColor: '#92400E',
  },
  {
    id: '4',
    title: 'Trust',
    titleBrand: 'FtaFat',
    sub: 'For 100% hygienic and\nsafe food handling.',
    img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    colors: ['#FCE7F3', 'rgba(252,231,243,0.9)', 'transparent'],
    textColor: '#9D174D',
  },
  {
    id: '5',
    title: 'FtaFat',
    titleBrand: 'Specials',
    sub: 'Healthy bowls & salads\ncrafted just for you.',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    colors: ['#DCFCE7', 'rgba(220,252,231,0.9)', 'transparent'],
    textColor: '#166534',
  }
];

export function AutoScrollHeroBanners() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const BANNER_WIDTH = SCREEN_WIDTH - 32;

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= bannersData.length) {
        nextIndex = 0;
      }
      
      const xOffset = nextIndex * (BANNER_WIDTH + 16);
      scrollViewRef.current?.scrollTo({ x: xOffset, animated: true });
      setCurrentIndex(nextIndex);
    }, 3500); 

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const itemWidth = BANNER_WIDTH + 16;
    const index = Math.round(x / itemWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 16 }}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 16}
      >
        {bannersData.map((banner) => (
          <View key={banner.id} style={[styles.heroBanner, { width: BANNER_WIDTH, backgroundColor: banner.colors[0] }]}>
             <View style={styles.heroBannerContent}>
                <View style={styles.brandPill}>
                  <Text style={styles.brandText}>{banner.title}</Text>
                </View>
                <Text style={[styles.heroTitle, { color: banner.textColor }]}>{banner.titleBrand}</Text>
                <Text style={styles.heroSub}>{banner.sub}</Text>
                
                <TouchableOpacity style={[styles.orderNowBtn, { backgroundColor: banner.textColor }]} activeOpacity={0.8}>
                  <Text style={styles.orderNowText}>Order Now</Text>
                </TouchableOpacity>
             </View>
             <View style={styles.imageSide}>
               <Image source={{ uri: banner.img }} style={styles.heroBannerImg} />
               <LinearGradient
                  colors={['transparent', banner.colors[0]]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.fadeGradient}
               />
             </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
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
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#5E2B16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBannerContent: {
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
  heroTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 26,
    marginTop: 4,
    letterSpacing: -1,
    lineHeight: 30,
  },
  heroSub: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 16,
  },
  orderNowBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginTop: 12,
  },
  orderNowText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#FFFFFF',
  },
  imageSide: {
    flex: 1,
    position: 'relative',
  },
  heroBannerImg: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover',
  },
  fadeGradient: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: 60,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 14,
    backgroundColor: '#D94E1B',
  }
});
