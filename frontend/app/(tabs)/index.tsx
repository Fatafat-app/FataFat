import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');
const ORANGE = '#FF6000';
const BANNER_WIDTH = width - 32; // 16 padding on each side

export default function HomeScreen() {
  const logout = useAuthStore((state) => state.logout);
  const [activeBanner, setActiveBanner] = useState(0);

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

  const recommended = [
    { id: 1, name: "La Pino'z Pizza", rating: 4.3, reviews: '1.2k', time: '30-40 min', tag: '20% OFF', tagColor: '#FF6000', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
    { id: 2, name: "Burger Hub", rating: 4.4, reviews: '980', time: '25-35 min', tag: '₹50 OFF', tagColor: '#FF6000', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
    { id: 3, name: "Paratha Point", rating: 4.5, reviews: '2.1k', time: '20-30 min', tag: 'Top Rated', tagColor: '#FF6000', image: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' },
  ];

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / BANNER_WIDTH);
    setActiveBanner(index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={24} color={ORANGE} />
            <View style={styles.locationTextContainer}>
              <View style={styles.locationRow}>
                <Text style={styles.locationTitle}>Bikaner</Text>
                <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.locationSubtitle}>Home</Text>
            </View>
          </View>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Ftafat</Text>
            <MaterialCommunityIcons name="moped" size={24} color="#000" style={styles.logoIcon} />
            <Text style={styles.logoSubtext}>Good Food. Faster.</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileAvatar} onPress={logout}>
              <Text style={styles.profileAvatarText}>V</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput 
              placeholder="Search for food, restaurants or cuisines..." 
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
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
            snapToInterval={BANNER_WIDTH}
            decelerationRate="fast"
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

        {/* Explore Cuisines (New Demo Section) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Cuisines</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisinesScroll} contentContainerStyle={styles.cuisinesContent}>
          {cuisines.map((cuisine) => (
            <TouchableOpacity key={cuisine.id} style={[styles.cuisineCard, { backgroundColor: cuisine.color }]}>
              <Text style={styles.cuisineIcon}>{cuisine.icon}</Text>
              <Text style={styles.cuisineName}>{cuisine.name}</Text>
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
            <View key={item.id} style={styles.foodCard}>
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
            </View>
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

        <View style={styles.shopCard}>
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
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 30,
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
  logoContainer: {
    alignItems: 'center',
    flex: 1.5,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  logoIcon: {
    position: 'absolute',
    right: 0,
    top: -5,
  },
  logoSubtext: {
    fontSize: 9,
    color: '#666',
    marginTop: -2,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
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
    marginBottom: 24,
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
  }
});
