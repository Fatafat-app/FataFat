import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { restaurantService } from '../../services/restaurant.service';
import { useCartStore } from '../../store/cart.store';
import { Restaurant, MenuItem, MenuCategory } from '../../types';
import { formatPaise, formatDeliveryTime } from '../../utils/formatters';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [vegOnly, setVegOnly] = useState(false);

  // Cart Store hooks
  const cartRestaurant = useCartStore((state) => state.restaurant);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemsCount = useCartStore((state) => state.getItemsCount);
  const getItemsTotal = useCartStore((state) => state.getItemsTotal);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [restData, menuData] = await Promise.all([
          restaurantService.getRestaurantById(id),
          restaurantService.getRestaurantMenu(id),
        ]);
        setRestaurant(restData);
        setMenuCategories(menuData);
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Could not load restaurant menu');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;

    const success = addItem(item, restaurant);
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
              addItem(item, restaurant);
            },
          },
        ]
      );
    }
  };

  const getItemQuantityInCart = (itemId: string): number => {
    const found = cartItems.find((i) => i.menuItem._id === itemId);
    return found ? found.quantity : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6000" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
        <Text style={styles.notFoundTitle}>Restaurant Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.goBackButton}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const headerImage =
    restaurant.images?.[0] ||
    'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg';

  const cartCount = getItemsCount();
  const cartTotal = getItemsTotal();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
        {/* Restaurant Header Banner */}
        <View style={styles.bannerWrapper}>
          <Image source={{ uri: headerImage }} style={styles.bannerImage} />
          <SafeAreaView style={styles.bannerNav}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.navCircle}
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.navCircle}>
                <Ionicons name="heart-outline" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navCircle}>
                <Ionicons name="share-social-outline" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantCuisines}>
                {restaurant.cuisines?.join(' • ') || 'Multi-Cuisine'}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#FFF" style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>
                {restaurant.rating?.average ? restaurant.rating.average.toFixed(1) : '4.5'}
              </Text>
            </View>
          </View>

          {/* Quick Details Chips */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#FF6000" />
              <Text style={styles.metaText}>
                {formatDeliveryTime(restaurant.estimatedDeliveryTime)}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="wallet-outline" size={16} color="#FF6000" />
              <Text style={styles.metaText}>
                {formatPaise(restaurant.pricing?.costForTwo)} for two
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={16} color="#FF6000" />
              <Text style={styles.metaText}>
                {formatPaise(restaurant.pricing?.deliveryCharge)} delivery
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Bar (Sticky) */}
        <View style={styles.filterBar}>
          <Text style={styles.filterTitle}>Menu & Delicacies</Text>
          <TouchableOpacity
            onPress={() => setVegOnly(!vegOnly)}
            style={[styles.vegToggle, vegOnly && styles.vegToggleActive]}
          >
            <View style={styles.vegSquare}>
              <View style={styles.vegDot} />
            </View>
            <Text style={[styles.vegText, vegOnly && styles.vegTextActive]}>
              Veg Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Categories & Items */}
        <View style={styles.menuContainer}>
          {menuCategories.map((catGroup, groupIdx) => {
            const filteredItems = catGroup.items.filter((item) =>
              vegOnly ? item.isVeg : true
            );

            if (filteredItems.length === 0) return null;

            return (
              <View key={groupIdx} style={styles.categorySection}>
                <Text style={styles.categoryHeading}>
                  {catGroup.category} ({filteredItems.length})
                </Text>

                {filteredItems.map((item) => {
                  const qty = getItemQuantityInCart(item._id);

                  return (
                    <View key={item._id} style={styles.menuItemCard}>
                      <View style={styles.itemTextContainer}>
                        <View style={styles.vegBadgeRow}>
                          <View
                            style={[
                              styles.vegSquare,
                              { borderColor: item.isVeg ? '#16A34A' : '#DC2626' },
                            ]}
                          >
                            <View
                              style={[
                                styles.vegDot,
                                { backgroundColor: item.isVeg ? '#16A34A' : '#DC2626' },
                              ]}
                            />
                          </View>
                          {item.calories ? (
                            <Text style={styles.calorieText}>{item.calories} kcal</Text>
                          ) : null}
                        </View>

                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>{formatPaise(item.price)}</Text>
                        {item.description ? (
                          <Text style={styles.menuItemDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>

                      {/* Image & Add Button */}
                      <View style={styles.itemImageContainer}>
                        <Image
                          source={{
                            uri:
                              item.images?.[0] ||
                              'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
                          }}
                          style={styles.itemImage}
                        />

                        {qty > 0 ? (
                          <View style={styles.qtyControlBox}>
                            <TouchableOpacity
                              onPress={() => updateQuantity(item._id, -1)}
                              style={styles.qtyBtn}
                            >
                              <Ionicons name="remove" size={14} color="#FF6000" />
                            </TouchableOpacity>
                            <Text style={styles.qtyCount}>{qty}</Text>
                            <TouchableOpacity
                              onPress={() => updateQuantity(item._id, 1)}
                              style={styles.qtyBtn}
                            >
                              <Ionicons name="add" size={14} color="#FF6000" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleAddToCart(item)}
                            style={styles.addBtn}
                          >
                            <Text style={styles.addBtnText}>ADD</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.bottomCartContainer}>
          <TouchableOpacity
            onPress={() => router.push('/order')}
            style={styles.floatingCartBar}
          >
            <View>
              <Text style={styles.cartCountLabel}>
                {cartCount} {cartCount === 1 ? 'item' : 'items'} added
              </Text>
              <Text style={styles.cartTotalAmount}>{formatPaise(cartTotal)}</Text>
            </View>

            <View style={styles.viewCartRight}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 16,
  },
  goBackButton: {
    marginTop: 20,
    backgroundColor: '#FF6000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  goBackText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bannerWrapper: {
    height: 240,
    backgroundColor: '#111827',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  bannerNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  navCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  restaurantCuisines: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 14,
  },
  ratingBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 5,
  },
  metaDivider: {
    height: 14,
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  vegToggleActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  vegSquare: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  vegText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  vegTextActive: {
    color: '#15803D',
  },
  menuContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
  },
  menuItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  vegBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calorieText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuItemDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  itemImageContainer: {
    position: 'relative',
    width: 96,
    alignItems: 'center',
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  qtyControlBox: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6000',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtn: {
    paddingHorizontal: 4,
  },
  qtyCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF6000',
    paddingHorizontal: 6,
  },
  addBtn: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6000',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF6000',
  },
  bottomCartContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingCartBar: {
    backgroundColor: '#FF6000',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#FF6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cartCountLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },
  cartTotalAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  viewCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginRight: 4,
  },
});
