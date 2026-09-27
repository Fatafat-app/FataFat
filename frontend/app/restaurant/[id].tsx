import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { restaurantService } from '../../services/restaurant.service';
import { useCartStore } from '../../store/cart.store';
import { Restaurant, MenuItem, MenuCategory, MenuItemModifierGroup, MenuItemModifierOption } from '../../types';
import { formatPaise, formatDeliveryTime } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart Store hooks
  const cartRestaurant = useCartStore((state) => state.restaurant);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemsCount = useCartStore((state) => state.getItemsCount);
  const getItemsTotal = useCartStore((state) => state.getItemsTotal);

  // Modifier Modal State
  const [modModalVisible, setModModalVisible] = useState(false);
  const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);
  const [modSelections, setModSelections] = useState<Record<string, MenuItemModifierOption[]>>({});

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const [restData, menuData] = await Promise.all([
        restaurantService.getRestaurantById(id),
        restaurantService.getRestaurantMenu(id),
      ]);
      setRestaurant(restData);
      setMenuCategories(menuData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load restaurant menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddToCart = (item: MenuItem, modifiers: MenuItemModifierOption[] = []) => {
    if (!restaurant) return;
    const success = addItem(item, restaurant, modifiers);
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
              addItem(item, restaurant, modifiers);
            },
          },
        ]
      );
    }
  };

  const onAddPress = (item: MenuItem) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedItemForMod(item);
      setModSelections({});
      setModModalVisible(true);
    } else {
      handleAddToCart(item);
    }
  };

  const getItemQuantityInCart = (itemId: string): number => {
    return cartItems
      .filter((i) => i.menuItem._id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleModToggle = (groupIndex: number, group: MenuItemModifierGroup, option: MenuItemModifierOption) => {
    const key = groupIndex.toString();
    const currentSelected = modSelections[key] || [];
    const isSelected = currentSelected.some(o => o.name === option.name);
    const max = group.maxSelections || 1;

    let newSelected = [...currentSelected];
    if (isSelected) {
      newSelected = newSelected.filter(o => o.name !== option.name);
    } else {
      if (max === 1) {
        newSelected = [option];
      } else {
        if (newSelected.length < max) {
          newSelected.push(option);
        } else {
          Alert.alert('Limit Reached', `You can only select up to ${max} options.`);
          return;
        }
      }
    }
    setModSelections(prev => ({ ...prev, [key]: newSelected }));
  };

  const confirmModifications = () => {
    if (!selectedItemForMod) return;

    // Validate minSelections
    for (let i = 0; i < (selectedItemForMod.modifierGroups?.length || 0); i++) {
      const group = selectedItemForMod.modifierGroups![i];
      const selectedCount = (modSelections[i.toString()] || []).length;
      if (group.minSelections && selectedCount < group.minSelections) {
        Alert.alert('Required Selection', `Please select at least ${group.minSelections} options for ${group.name}`);
        return;
      }
    }

    const allModifiers = Object.values(modSelections).flat();
    handleAddToCart(selectedItemForMod, allModifiers);
    setModModalVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Loading size="large" color={Colors.primary} />
        <Text style={[Typography.bodySmall, { marginTop: 12 }]}>Loading menu...</Text>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ErrorState title="Restaurant Not Found" message={error || 'We could not find the restaurant you were looking for.'} onRetry={fetchDetails} />
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const headerImage = restaurant.images?.[0] || 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg';
  const cartCount = getItemsCount();
  const cartTotal = getItemsTotal();

  const filteredCategories = menuCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(i => vegOnly ? i.isVeg : true)
  })).filter(cat => cat.items.length > 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerWrapper}>
          <Image source={{ uri: headerImage }} style={styles.bannerImage} />
          <SafeAreaView style={styles.bannerNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navCircle}>
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.navCircle}>
                <Ionicons name="heart-outline" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Info Card */}
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

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{formatDeliveryTime(restaurant.estimatedDeliveryTime)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="wallet-outline" size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{formatPaise(restaurant.pricing?.costForTwo)} for two</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{formatPaise(restaurant.pricing?.deliveryCharge)} fee</Text>
            </View>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <Text style={styles.filterTitle}>Menu & Delicacies</Text>
          <TouchableOpacity onPress={() => setVegOnly(!vegOnly)} style={[styles.vegToggle, vegOnly && styles.vegToggleActive]}>
            <View style={styles.vegSquare}>
              <View style={styles.vegDot} />
            </View>
            <Text style={[styles.vegText, vegOnly && styles.vegTextActive]}>Veg Only</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {filteredCategories.length === 0 ? (
            <EmptyState title="No items found" message="No menu items are available for the selected filters." icon="restaurant-outline" />
          ) : (
            filteredCategories.map((catGroup, groupIdx) => (
              <View key={groupIdx} style={styles.categorySection}>
                <Text style={styles.categoryHeading}>{catGroup.category} ({catGroup.items.length})</Text>

                {catGroup.items.map((item) => {
                  const qty = getItemQuantityInCart(item._id);

                  return (
                    <View key={item._id} style={styles.menuItemCard}>
                      <View style={styles.itemTextContainer}>
                        <View style={styles.vegBadgeRow}>
                          <View style={[styles.vegSquare, { borderColor: item.isVeg ? '#16A34A' : '#DC2626' }]}>
                            <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#16A34A' : '#DC2626' }]} />
                          </View>
                          {item.calories ? <Text style={styles.calorieText}>{item.calories} kcal</Text> : null}
                          {item.modifierGroups && item.modifierGroups.length > 0 && (
                            <Text style={styles.customizableText}>Customizable</Text>
                          )}
                        </View>

                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>{formatPaise(item.price)}</Text>
                        {item.description ? <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text> : null}
                      </View>

                      <View style={styles.itemImageContainer}>
                        <Image source={{ uri: item.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' }} style={styles.itemImage} />

                        {qty > 0 && (!item.modifierGroups || item.modifierGroups.length === 0) ? (
                          <View style={styles.qtyControlBox}>
                            <TouchableOpacity onPress={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}>
                              <Ionicons name="remove" size={14} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyCount}>{qty}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}>
                              <Ionicons name="add" size={14} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => onAddPress(item)} style={styles.addBtn} disabled={!item.isAvailable}>
                            <Text style={[styles.addBtnText, !item.isAvailable && { color: '#999' }]}>
                              {item.isAvailable ? 'ADD' : 'SOLD OUT'}
                            </Text>
                            {item.modifierGroups && item.modifierGroups.length > 0 && item.isAvailable && (
                              <Text style={styles.plusSign}>+</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modifier Modal */}
      <Modal visible={modModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize {selectedItemForMod?.name}</Text>
              <TouchableOpacity onPress={() => setModModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedItemForMod?.modifierGroups?.map((group, groupIndex) => {
                const max = group.maxSelections || 1;
                return (
                  <View key={groupIndex} style={styles.modGroup}>
                    <View style={styles.modGroupHeader}>
                      <Text style={styles.modGroupName}>{group.name}</Text>
                      <Text style={styles.modGroupReq}>
                        {group.minSelections ? 'Required' : 'Optional'} • Choose up to {max}
                      </Text>
                    </View>
                    {group.options.map((option, optIdx) => {
                      const isSelected = (modSelections[groupIndex.toString()] || []).some(o => o.name === option.name);
                      return (
                        <TouchableOpacity 
                          key={optIdx} 
                          style={styles.modOptionRow}
                          onPress={() => handleModToggle(groupIndex, group, option)}
                        >
                          <View style={styles.modOptionLeft}>
                            <Ionicons 
                              name={isSelected ? (max === 1 ? 'radio-button-on' : 'checkbox') : (max === 1 ? 'radio-button-off' : 'square-outline')} 
                              size={20} 
                              color={isSelected ? Colors.primary : '#999'} 
                            />
                            <Text style={styles.modOptionName}>{option.name}</Text>
                          </View>
                          <Text style={styles.modOptionPrice}>+{formatPaise(option.price)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Add to Cart" onPress={confirmModifications} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.bottomCartContainer}>
          <TouchableOpacity onPress={() => router.push('/order')} style={styles.floatingCartBar}>
            <View>
              <Text style={styles.cartCountLabel}>{cartCount} {cartCount === 1 ? 'item' : 'items'} added</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: { flex: 1 },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  goBackButton: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  goBackText: { ...Typography.button },
  bannerWrapper: { height: 240, backgroundColor: '#111827', position: 'relative' },
  bannerImage: { width: '100%', height: '100%', opacity: 0.85 },
  bannerNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  navCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  navActions: { flexDirection: 'row', gap: 8 },
  infoCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restaurantName: { ...Typography.heading, fontSize: 22, marginBottom: 4 },
  restaurantCuisines: { ...Typography.bodySmall, marginBottom: 14 },
  ratingBadge: { backgroundColor: Colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  ratingText: { ...Typography.label, color: Colors.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.background, padding: 12, borderRadius: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { ...Typography.label, color: Colors.text, marginLeft: 5 },
  metaDivider: { height: 14, width: 1, backgroundColor: Colors.borderDark },
  filterBar: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterTitle: { ...Typography.title, fontSize: 14 },
  vegToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.borderDark, backgroundColor: Colors.background },
  vegToggleActive: { backgroundColor: '#F0FDF4', borderColor: Colors.success },
  vegSquare: { width: 14, height: 14, borderWidth: 1, borderColor: Colors.success, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  vegText: { ...Typography.label },
  vegTextActive: { color: '#15803D' },
  menuContainer: { padding: 16, paddingBottom: 100 },
  categorySection: { marginBottom: 20 },
  categoryHeading: { ...Typography.title, fontSize: 17, marginBottom: 10 },
  menuItemCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTextContainer: { flex: 1, paddingRight: 12 },
  vegBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  calorieText: { ...Typography.caption, marginLeft: 6 },
  customizableText: { ...Typography.caption, color: Colors.primary, marginLeft: 6 },
  menuItemName: { ...Typography.subtitle, fontSize: 15, marginBottom: 2 },
  menuItemPrice: { ...Typography.price, fontSize: 14, color: Colors.text, marginBottom: 4 },
  menuItemDesc: { ...Typography.bodySmall, fontSize: 11, lineHeight: 15 },
  itemImageContainer: { position: 'relative', width: 96, alignItems: 'center' },
  itemImage: { width: 90, height: 90, borderRadius: 14, backgroundColor: Colors.border },
  qtyControlBox: { position: 'absolute', bottom: -8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3 },
  qtyBtn: { paddingHorizontal: 4 },
  qtyCount: { ...Typography.button, color: Colors.primary, fontSize: 12, paddingHorizontal: 6 },
  addBtn: { position: 'absolute', bottom: -8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 5, flexDirection: 'row' },
  addBtnText: { ...Typography.button, color: Colors.primary, fontSize: 11 },
  plusSign: { ...Typography.button, color: Colors.primary, fontSize: 11, position: 'absolute', right: 2, top: 1 },
  bottomCartContainer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  floatingCartBar: { backgroundColor: Colors.primary, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartCountLabel: { ...Typography.label, color: Colors.white, opacity: 0.9, fontSize: 11 },
  cartTotalAmount: { ...Typography.heading, color: Colors.white, fontSize: 16 },
  viewCartRight: { flexDirection: 'row', alignItems: 'center' },
  viewCartText: { ...Typography.button, marginRight: 4, fontSize: 13 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 16 },
  modalTitle: { ...Typography.title },
  modalScroll: { marginBottom: 20 },
  modGroup: { marginBottom: 20 },
  modGroupHeader: { marginBottom: 12 },
  modGroupName: { ...Typography.subtitle },
  modGroupReq: { ...Typography.caption },
  modOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  modOptionName: { ...Typography.body, marginLeft: 10 },
  modOptionPrice: { ...Typography.body, color: Colors.textSecondary },
  modalFooter: { paddingTop: 10 },
});
