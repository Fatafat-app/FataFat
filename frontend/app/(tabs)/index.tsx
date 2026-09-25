import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const logout = useAuthStore((state) => state.logout);

  const categories = [
    { id: 1, name: 'Burger', image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', color: '#FEF3C7' },
    { id: 2, name: 'Pizza', image: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png', color: '#FEE2E2' },
    { id: 3, name: 'Noodles', image: 'https://cdn-icons-png.flaticon.com/512/3480/3480461.png', color: '#E0E7FF' },
    { id: 4, name: 'Healthy', image: 'https://cdn-icons-png.flaticon.com/512/2515/2515150.png', color: '#D1FAE5' },
    { id: 5, name: 'Dessert', image: 'https://cdn-icons-png.flaticon.com/512/3132/3132675.png', color: '#FCE7F3' },
  ];

  const popular = [
    { id: 1, name: 'Spicy Zinger Burger', restaurant: 'Burger Hub', rating: 4.8, time: '15-20 min', price: '₹149', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
    { id: 2, name: 'Farmhouse Pizza', restaurant: 'Pizza Paradise', rating: 4.5, time: '25-30 min', price: '₹299', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
    { id: 3, name: 'Hakka Noodles', restaurant: 'Wok This Way', rating: 4.6, time: '20-25 min', price: '₹199', image: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Delivering to</Text>
          <View style={styles.locationRow}>
            <Text style={styles.headerTitle}>Home - Connaught Place</Text>
            <Ionicons name="chevron-down" size={20} color="#F59E0B" />
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={logout}>
          <Image source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' }} style={styles.profileImage} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for biryani, pizza, or burger..." 
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          <View style={styles.filterBtn}>
            <Ionicons name="options" size={20} color="white" />
          </View>
        </View>

        {/* Promotional Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>50% OFF</Text>
            <Text style={styles.bannerSubtitle}>On your first 3 Ftafat orders!</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Order Now</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }} 
            style={[styles.bannerImage, { height: 160 }]} 
            resizeMode="cover"
          />
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat, index) => (
            <View key={cat.id} style={[styles.categoryItem, index === 0 && { marginLeft: 20 }]}>
              <View style={[styles.categoryImageWrap, { backgroundColor: cat.color }]}>
                <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Popular Near You */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ftafat Popular</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        
        <View style={styles.popularContainer}>
          {popular.map((item) => (
            <View key={item.id} style={styles.foodCard}>
              <Image source={{ uri: item.image }} style={styles.foodImage} resizeMode="cover" />
              <View style={styles.foodInfo}>
                <View style={styles.foodHeaderRow}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="white" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.restaurantName}>{item.restaurant}</Text>
                <View style={styles.foodFooterRow}>
                  <Text style={styles.foodPrice}>{item.price}</Text>
                  <View style={styles.timeWrap}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280', // gray-500
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginRight: 4,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6', // gray-100
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#111827',
  },
  filterBtn: {
    backgroundColor: '#F59E0B', // amber-500
    padding: 10,
    borderRadius: 12,
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FEF3C7', // amber-100
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 160,
  },
  bannerTextContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D97706', // amber-600
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#92400E', // amber-800
    marginTop: 4,
    fontWeight: '500',
  },
  bannerBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  bannerBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerImage: {
    width: 140,
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#F59E0B', // amber-500
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563', // gray-600
  },
  popularContainer: {
    paddingHorizontal: 20,
  },
  foodCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: 180,
  },
  foodInfo: {
    padding: 16,
  },
  foodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981', // emerald-500
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  restaurantName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  foodFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: 4,
  }
});
