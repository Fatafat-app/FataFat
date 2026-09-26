import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore, useLocationStore } from '../../store';

const { width } = Dimensions.get('window');
const ORANGE = '#FF6000';
const BANNER_WIDTH = width - 32; // 16 padding on each side

export default function HomeScreen() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { locationTitle, locationSubtitle, isDetectingLocation, detectCurrentLocation } = useLocationStore();
  const [activeBanner, setActiveBanner] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8640); // 2 hours, 24 mins
  const scrollRef = useRef<ScrollView>(null);

  // Auto-detect GPS Location on load
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  // States for interactive Order Again buttons
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

  // Auto-scroll Banners
  useEffect(() => {
    const scrollTimer = setInterval(() => {
      setActiveBanner((prev) => {
        // Assume 3 banners length for now
        const next = (prev + 1) % 3;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3000); // Scroll every 3 seconds

    return () => clearInterval(scrollTimer);
  }, []);

  // Flash Deal Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const timeDisplay = formatTime(timeLeft);

  const handleReorder = (id: number) => {
    setReorderingId(id);
    // Simulate network request for 1.5 seconds
    setTimeout(() => {
      setReorderingId(null);
      setAddedId(id);
      // Reset back to original state after 2.5 seconds
      setTimeout(() => {
        setAddedId(null);
      }, 2500);
    }, 1500);
  };

  const banners = [
    {
      id: 1,
      title: 'Cravings?',
      subtitle: 'Ftafat!',
      desc: 'Delicious food delivered\nto your doorstep.',
      image: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg',
      bgColor: '#FFF0E6'
    },
    {
      id: 2,
      title: 'Midnight',
      subtitle: 'Hunger?',
      desc: 'Hot meals delivered\nin just 15 minutes!',
      image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
      bgColor: '#FDF7EC'
    },
    {
      id: 3,
      title: 'Party',
      subtitle: 'Time!',
      desc: 'Flat 50% Off on\nlarge group orders.',
      image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
      bgColor: '#FEE2E2'
    }
  ];

  const categories = [
    { id: 1, name: 'Pizza', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
    { id: 2, name: 'Burger', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
    { id: 3, name: 'Paratha', image: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' },
    { id: 4, name: 'Maggi', image: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
    { id: 5, name: 'Noodles', image: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  ];

  const cuisines = [
    { id: 1, name: 'North Indian', color: '#FEF3C7', icon: '🍲' },
    { id: 2, name: 'Chinese', color: '#FEE2E2', icon: '🍜' },
    { id: 3, name: 'South Indian', color: '#E0E7FF', icon: '🥞' },
    { id: 4, name: 'Italian', color: '#D1FAE5', icon: '🍕' },
  ];

  const recentOrders = [
    { id: 1, name: "Farmhouse Pizza", restaurant: "La Pino'z Pizza", time: "Delivered 2 days ago", image: "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg" },
    { id: 2, name: "Masala Dosa", restaurant: "South Indian Express", time: "Delivered last week", image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg" },
  ];

  const topBrands = [
    { id: 1, name: "Burger King", time: "25 mins", image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg", offer: "60% OFF" },
    { id: 2, name: "Domino's", time: "20 mins", image: "https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg", offer: "BOGO" },
    { id: 3, name: "Haldiram's", time: "30 mins", image: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg", offer: "₹100 OFF" },
    { id: 4, name: "KFC", time: "35 mins", image: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg", offer: "Free Item" },
  ];

  const recommended = [
    { id: 1, name: "La Pino'z Pizza", rating: 4.3, reviews: '1.2k', time: '30-40 min', tag: '20% OFF', tagColor: '#FF6000', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
    { id: 2, name: "Burger Hub", rating: 4.4, reviews: '980', time: '25-35 min', tag: '₹50 OFF', tagColor: '#FF6000', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
    { id: 3, name: "Paratha Point", rating: 4.5, reviews: '2.1k', time: '20-30 min', tag: 'Top Rated', tagColor: '#FF6000', image: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' },
  ];

  const moreProducts = [
    { id: 1, name: "Cheese Burst Pizza", restaurant: "La Pino'z Pizza", price: "₹299", rating: 4.8, image: "https://images.pexels.com/photos/845812/pexels-photo-845812.jpeg" },
    { id: 2, name: "Special Paneer Biryani", restaurant: "Biryani House", price: "₹199", rating: 4.5, image: "https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg" },
    { id: 3, name: "Crispy Veg Burger", restaurant: "Burger Hub", price: "₹149", rating: 4.3, image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg" },
    { id: 4, name: "Spicy Hakka Noodles", restaurant: "Chinese Wok", price: "₹120", rating: 4.1, image: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg" },
  ];

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeBanner && index >= 0 && index < banners.length) {
      setActiveBanner(index);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={detectCurrentLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={24} color={ORANGE} />
              <View style={styles.locationTextContainer}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationTitle} numberOfLines={1}>
                    {locationTitle || 'Home'}
                  </Text>
                  {isDetectingLocation ? (
                    <ActivityIndicator size="small" color={ORANGE} style={{ marginLeft: 4 }} />
                  ) : (
                    <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 2 }} />
                  )}
                </View>
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {locationSubtitle || 'Detecting GPS...'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  {user?.name ? `Hi, ${user.name.split(' ')[0]}! 👋` : 'Good Day! 👋'}
                </Text>
              </View>
              <TouchableOpacity style={styles.bellIcon}>
                <Ionicons name="notifications-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileAvatar} onPress={logout}>
                <Text style={styles.profileAvatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder="Search for 'Biryani'..."
                placeholderTextColor="#888"
                style={styles.searchInput}
              />
              <Feather name="mic" size={20} color="#666" style={styles.micIcon} />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Filters Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
            <TouchableOpacity style={[styles.filterPill, { backgroundColor: ORANGE, borderColor: ORANGE }]}>
              <Text style={[styles.filterPillText, { color: 'white' }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <Ionicons name="people" size={16} color="#555" style={styles.filterPillIcon} />
              <Text style={styles.filterPillText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <MaterialCommunityIcons name="tag" size={16} color={ORANGE} style={styles.filterPillIcon} />
              <Text style={styles.filterPillText}>Offers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <MaterialCommunityIcons name="leaf" size={16} color="#16A34A" style={styles.filterPillIcon} />
              <Text style={styles.filterPillText}>Veg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <MaterialCommunityIcons name="bone" size={16} color="#DC2626" style={styles.filterPillIcon} />
              <Text style={styles.filterPillText}>Non-Veg</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Banners Swiper */}
          <View style={styles.bannerWrapper}>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleBannerScroll}
              scrollEventThrottle={16}
              pagingEnabled={true}
              snapToInterval={width}
              decelerationRate="fast"
              snapToAlignment="center"
              disableIntervalMomentum={true}
            >
              {banners.map((banner, index) => (
                <View key={banner.id} style={[styles.bannerContainer, { backgroundColor: banner.bgColor }]}>
                  <View style={styles.bannerTextContent}>
                    <Text style={styles.bannerCravings}>{banner.title}</Text>
                    <Text style={styles.bannerFtafat}>{banner.subtitle}</Text>
                    <Text style={styles.bannerDesc}>{banner.desc}</Text>
                    <TouchableOpacity style={styles.orderNowBtn}>
                      <Text style={styles.orderNowText}>Order Now</Text>
                      <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                  <Image
                    source={{ uri: banner.image }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Banner Dots */}
            <View style={styles.dotsContainer}>
              {banners.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeBanner && { backgroundColor: ORANGE, width: 12 }]} />
              ))}
            </View>
          </View>

          {/* Flash Deal Timer */}
          <TouchableOpacity style={styles.flashDealContainer} activeOpacity={0.9}>
            <View style={styles.flashDealLeft}>
              <FontAwesome5 name="fire" size={24} color="#FBBF24" />
              <View style={styles.flashDealTextWrapper}>
                <Text style={styles.flashDealTitle}>Flash Deals Live!</Text>
                <Text style={styles.flashDealSub}>Up to 60% off on premium spots</Text>
              </View>
            </View>
            <View style={styles.timerBoxWrapper}>
              <View style={styles.timerBox}><Text style={styles.timerText}>{timeDisplay.hours}</Text></View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}><Text style={styles.timerText}>{timeDisplay.minutes}</Text></View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}><Text style={styles.timerText}>{timeDisplay.seconds}</Text></View>
            </View>
          </TouchableOpacity>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.categoryItem}>
                <View style={styles.categoryImageContainer}>
                  <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Order Again (NEW SECTION) */}
          <View style={styles.orderAgainWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Again</Text>
              <MaterialCommunityIcons name="history" size={20} color="#666" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderAgainScroll} contentContainerStyle={styles.orderAgainContent}>
              {recentOrders.map((order) => (
                <TouchableOpacity key={order.id} style={styles.orderAgainCard} activeOpacity={0.8}>
                  <Image source={{ uri: order.image }} style={styles.orderAgainImage} />
                  <View style={styles.orderAgainInfo}>
                    <Text style={styles.orderAgainName} numberOfLines={1}>{order.name}</Text>
                    <Text style={styles.orderAgainRest} numberOfLines={1}>{order.restaurant}</Text>
                    <Text style={styles.orderAgainTime}>{order.time}</Text>
                  </View>

                  {/* Interactive Reorder Button */}
                  <TouchableOpacity
                    style={[
                      styles.reorderBtn,
                      addedId === order.id && { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }
                    ]}
                    onPress={() => handleReorder(order.id)}
                    disabled={reorderingId === order.id || addedId === order.id}
                  >
                    {reorderingId === order.id ? (
                      <ActivityIndicator size="small" color={ORANGE} style={{ paddingHorizontal: 12, paddingVertical: 2 }} />
                    ) : addedId === order.id ? (
                      <>
                        <Ionicons name="checkmark-circle" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                        <Text style={[styles.reorderBtnText, { color: '#16A34A' }]}>Added</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="refresh" size={14} color={ORANGE} style={{ marginRight: 4 }} />
                        <Text style={styles.reorderBtnText}>Reorder</Text>
                      </>
                    )}
                  </TouchableOpacity>

                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Explore Cuisines */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Cuisines</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisinesScroll} contentContainerStyle={styles.cuisinesContent}>
            {cuisines.map((cuisine) => (
              <TouchableOpacity key={cuisine.id} style={[styles.cuisineCard, { backgroundColor: cuisine.color }]} activeOpacity={0.7}>
                <Text style={styles.cuisineIcon}>{cuisine.icon}</Text>
                <Text style={styles.cuisineName}>{cuisine.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Top Brands for You (NEW SECTION) */}
          <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>Top Brands For You</Text>
            <TouchableOpacity style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={ORANGE} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandsScroll} contentContainerStyle={styles.brandsContent}>
            {topBrands.map((brand) => (
              <TouchableOpacity key={brand.id} style={styles.brandCard} activeOpacity={0.9}>
                <View style={styles.brandImageWrapper}>
                  <Image source={{ uri: brand.image }} style={styles.brandImage} />
                  <View style={styles.brandOfferBadge}>
                    <Text style={styles.brandOfferText}>{brand.offer}</Text>
                  </View>
                </View>
                <Text style={styles.brandName} numberOfLines={1}>{brand.name}</Text>
                <View style={styles.brandTimeRow}>
                  <Ionicons name="time-outline" size={12} color="#666" />
                  <Text style={styles.brandTimeText}>{brand.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recommended for you */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <TouchableOpacity style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={ORANGE} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll} contentContainerStyle={styles.recommendedContent}>
            {recommended.map((item) => (
              <TouchableOpacity key={item.id} style={styles.foodCard} activeOpacity={0.9}>
                <View style={styles.foodImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.foodImage} />
                  <TouchableOpacity style={styles.heartBtn}>
                    <Ionicons name="heart-outline" size={20} color="white" />
                  </TouchableOpacity>
                  <View style={[styles.tagBadge, { backgroundColor: item.tagColor }]}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewsText}>({item.reviews})</Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Shops Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops</Text>
            <TouchableOpacity style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={ORANGE} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shopCard} activeOpacity={0.9}>
            <Image source={{ uri: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg' }} style={styles.shopImage} />
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>Bikaner</Text>
              <Text style={styles.shopDesc}>North Indian, Chinese, Fast Food</Text>
              <View style={styles.shopDetailsRow}>
                <View style={styles.shopRating}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>4.4</Text>
                  <Text style={styles.reviewsText}>(1.5k)</Text>
                </View>
                <View style={styles.shopTime}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.timeText}>25-35 min</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.viewMenuBtn}>
              <Text style={styles.viewMenuText}>View Menu</Text>
              <Ionicons name="arrow-forward" size={14} color={ORANGE} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* More Products / Must Try Dishes - UNIQUE POP-OUT STYLE */}
          <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Must Try Dishes</Text>
            <View style={styles.sparkleTag}>
              <Text style={styles.sparkleText}>✨ Unique</Text>
            </View>
          </View>

          <View style={styles.uniqueGridContainer}>
            {moreProducts.map((product) => (
              <TouchableOpacity key={product.id} style={styles.uniqueCard} activeOpacity={0.8}>
                <Image source={{ uri: product.image }} style={styles.uniqueImage} />
                <View style={styles.uniqueRatingBadge}>
                  <Ionicons name="star" size={10} color="#FFF" />
                  <Text style={styles.uniqueRatingText}>{product.rating}</Text>
                </View>

                <Text style={styles.uniqueProductName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.uniqueProductRest} numberOfLines={1}>{product.restaurant}</Text>

                <View style={styles.uniqueCardFooter}>
                  <Text style={styles.uniquePrice}>{product.price}</Text>
                  <TouchableOpacity style={styles.uniqueAddBtn}>
                    <Ionicons name="add" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trending Products (Replaced Tags Cloud) */}
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Trending Products</Text>
            <View style={{ backgroundColor: '#FFF5F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Ionicons name="trending-up" size={16} color={ORANGE} />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll} contentContainerStyle={styles.trendingContent}>
            {[
              { id: 1, name: "Cold Coffee", price: "₹89", image: "https://images.pexels.com/photos/1209029/pexels-photo-1209029.jpeg" },
              { id: 2, name: "Chicken Tikka", price: "₹249", image: "https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg" },
              { id: 3, name: "Lava Cake", price: "₹99", image: "https://images.pexels.com/photos/1055271/pexels-photo-1055271.jpeg" },
              { id: 4, name: "Samosa", price: "₹20", image: "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg" },
            ].map((product) => (
              <TouchableOpacity key={product.id} style={styles.trendingCard} activeOpacity={0.9}>
                <Image source={{ uri: product.image }} style={styles.trendingImage} />
                <Text style={styles.trendingName} numberOfLines={1}>{product.name}</Text>
                <View style={styles.trendingFooter}>
                  <Text style={styles.trendingPrice}>{product.price}</Text>
                  <Ionicons name="add-circle" size={24} color={ORANGE} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ftafat PRO Banner */}
          <TouchableOpacity style={styles.proBanner} activeOpacity={0.9}>
            <View style={styles.proBannerContent}>
              <View style={styles.proHeaderRow}>
                <Text style={styles.proTitle}>Ftafat</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
                <FontAwesome5 name="crown" size={16} color="#FBBF24" style={{ marginLeft: 8 }} />
              </View>
              <Text style={styles.proDesc}>Get unlimited free delivery and 30% extra off on all orders!</Text>
              <TouchableOpacity style={styles.proBtn}>
                <Text style={styles.proBtnText}>Join at ₹99/mo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.proBannerDecoration}>
              <Ionicons name="star" size={120} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -30, top: -20 }} />
            </View>
          </TouchableOpacity>

          {/* Bottom Footer */}
          <View style={styles.footerContainer}>
            <Ionicons name="heart" size={18} color={ORANGE} style={{ marginBottom: 4 }} />
            <Text style={styles.footerText}>Created by Peeyush Tiwari</Text>
            <Text style={styles.footerSubText}>For Demo Purposes Only</Text>
          </View>

        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  greetingContainer: {
    marginRight: 12,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '700',
    color: ORANGE,
  },
  bellIcon: {
    marginRight: 12,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: ORANGE,
    fontWeight: 'bold',
    fontSize: 18,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  micIcon: {
    marginLeft: 8,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  filtersScroll: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  filterPillIcon: {
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bannerWrapper: {
    marginBottom: 20,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    marginHorizontal: 16,
    borderRadius: 16,
    height: 180,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerTextContent: {
    flex: 1.2,
    padding: 16,
    justifyContent: 'center',
  },
  bannerCravings: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#111',
  },
  bannerFtafat: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: ORANGE,
    marginTop: -4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
    marginBottom: 12,
    fontWeight: '500',
  },
  orderNowBtn: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  orderNowText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  bannerImage: {
    flex: 1,
    height: '100%',
  },
  flashDealContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827', // Very dark blue/gray
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  flashDealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashDealTextWrapper: {
    marginLeft: 12,
  },
  flashDealTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flashDealSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  timerBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBox: {
    backgroundColor: 'rgba(255, 96, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 96, 0, 0.4)',
  },
  timerText: {
    color: ORANGE,
    fontWeight: '900',
    fontSize: 12,
  },
  timerColon: {
    color: ORANGE,
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  categoriesScroll: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FDF7EC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3E8D6',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  cuisinesScroll: {
    marginBottom: 24,
  },
  cuisinesContent: {
    paddingHorizontal: 16,
  },
  cuisineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  cuisineIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cuisineName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedScroll: {
    marginBottom: 24,
  },
  recommendedContent: {
    paddingHorizontal: 16,
  },
  foodCard: {
    width: 160,
    marginRight: 16,
  },
  foodImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tagBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  foodInfo: {
    paddingHorizontal: 4,
  },
  foodName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  shopCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  shopDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  shopDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  shopTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMenuBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewMenuText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingWidget: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#111827', // Dark modern gray
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingWidgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingWidgetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  floatingWidgetTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  floatingWidgetSub: {
    color: '#9CA3AF', // light gray
    fontSize: 12,
    marginTop: 2,
  },
  floatingWidgetBtn: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  floatingWidgetBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sparkleTag: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sparkleText: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 'bold',
  },
  uniqueGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40, // Space for the top floating images
    paddingBottom: 24,
  },
  uniqueCard: {
    width: (width - 48) / 2, // 2 columns with 16 padding on edges and 16 gap
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 12,
    paddingTop: 60, // Space inside card for the overlapping image
    marginBottom: 50, // Gap between rows to fit the overlapping images
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,96,0,0.1)',
  },
  uniqueImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'absolute',
    top: -40,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#F3F4F6',
  },
  uniqueRatingBadge: {
    position: 'absolute',
    top: 45, // Just below the floating image
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  uniqueRatingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  uniqueProductName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  uniqueProductRest: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  uniqueCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto', // Push to bottom
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  uniquePrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  uniqueAddBtn: {
    backgroundColor: ORANGE,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  orderAgainWrapper: {
    backgroundColor: '#FFF5F0',
    paddingVertical: 16,
    marginBottom: 24,
  },
  orderAgainScroll: {
    marginTop: 8,
  },
  orderAgainContent: {
    paddingHorizontal: 16,
  },
  orderAgainCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    width: 280,
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  orderAgainImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  orderAgainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderAgainName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  orderAgainRest: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderAgainTime: {
    fontSize: 10,
    color: '#888',
    marginTop: 6,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reorderBtnText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  brandsScroll: {
    marginBottom: 24,
  },
  brandsContent: {
    paddingHorizontal: 16,
  },
  brandCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 76,
  },
  brandImageWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  brandImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  brandOfferBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#DC2626', // Red
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  brandOfferText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  brandTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  brandTimeText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
  },
  trendingScroll: {
    marginBottom: 24,
  },
  trendingContent: {
    paddingHorizontal: 16,
  },
  trendingCard: {
    width: 130,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trendingImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
  },
  trendingName: {
    color: '#000',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
  },
  trendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingPrice: {
    color: ORANGE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  proBanner: {
    backgroundColor: '#111827',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  proBannerContent: {
    position: 'relative',
    zIndex: 2,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  proBadge: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  proBadgeText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  proDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
    maxWidth: '80%',
  },
  proBtn: {
    backgroundColor: ORANGE,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  proBannerDecoration: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    zIndex: 1,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingBottom: 10,
  },
  footerText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  footerSubText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600'
  }
});
