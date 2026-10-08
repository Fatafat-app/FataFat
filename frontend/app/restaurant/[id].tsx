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

  // Product Detail Sheet State
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

  const openDetailSheet = (item: MenuItem) => {
    setDetailItem(item);
    setDetailSheetVisible(true);
  };

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
        <Loading />
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
        {/* ── HEADER HERO ── */}
        <View style={styles.bannerWrapper}>
          <Image source={{ uri: headerImage }} style={styles.bannerImage} />
          
          {/* Gradient Overlay */}
          <View style={styles.bannerGradient}>
            <Text style={styles.bannerResName}>{restaurant.name}</Text>
          </View>

          <SafeAreaView style={styles.bannerNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navCircle} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#1C1C1C" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.navCircle} activeOpacity={0.8}>
                <Ionicons name="heart-outline" size={22} color="#1C1C1C" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navCircle} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={20} color="#1C1C1C" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* ── INFO SECTION ── */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              
              <View style={styles.cuisineTagsRow}>
                {restaurant.cuisines?.map((c, i) => (
                  <View key={i} style={styles.cuisinePill}>
                    <Text style={styles.cuisinePillText}>{c}</Text>
                  </View>
                )) || (
                  <View style={styles.cuisinePill}><Text style={styles.cuisinePillText}>Multi-Cuisine</Text></View>
                )}
              </View>

            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>
                {restaurant.rating?.average ? restaurant.rating.average.toFixed(1) : '4.5'}
              </Text>
              <Ionicons name="star" size={11} color="#FFF" style={{ marginLeft: 3 }} />
              {restaurant.rating?.count > 0 && (
                <Text style={styles.ratingCount}>({restaurant.rating.count}+)</Text>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={15} color="#0D9488" />
              <Text style={styles.metaText}>{formatDeliveryTime(restaurant.estimatedDeliveryTime)}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={15} color="#0D9488" />
              <Text style={styles.metaText}>{formatPaise(restaurant.pricing?.deliveryCharge)} fee</Text>
            </View>
            {(restaurant.pricing as any)?.minOrderAmount > 0 && (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>₹{(restaurant.pricing as any).minOrderAmount / 100} min</Text>
              </>
            )}
          </View>

          {(restaurant as any).isVegOnly && (
            <View style={styles.pureVegBadge}>
              <Ionicons name="leaf" size={14} color="#059669" />
              <Text style={styles.pureVegText}>Pure Veg Restaurant</Text>
            </View>
          )}
        </View>

        {/* ── STICKY CATEGORY TABS ── */}
        <View style={styles.stickyTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {filteredCategories.map((cat, idx) => (
              <TouchableOpacity key={idx} style={[styles.tabBtn, idx === 0 && styles.tabBtnActive]}>
                <Text style={[styles.tabBtnText, idx === 0 && styles.tabBtnTextActive]}>{cat.category}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setVegOnly(!vegOnly)} style={[styles.vegToggle, vegOnly && styles.vegToggleActive]}>
              <View style={[styles.vegSquare, { borderColor: vegOnly ? '#059669' : '#9CA3AF' }]}>
                <View style={[styles.vegDot, { backgroundColor: vegOnly ? '#059669' : '#9CA3AF' }]} />
              </View>
              <Text style={[styles.vegText, vegOnly && styles.vegTextActive]}>Veg Only</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── MENU ITEMS ── */}
        <View style={styles.menuContainer}>
          {filteredCategories.length === 0 ? (
            <EmptyState title="No items found" message="No menu items are available for the selected filters." icon="restaurant-outline" />
          ) : (
            filteredCategories.map((catGroup, groupIdx) => (
              <View key={groupIdx} style={styles.categorySection}>
                <Text style={styles.categoryHeading}>{catGroup.category}</Text>

                {catGroup.items.map((item, itemIdx) => {
                  const qty = getItemQuantityInCart(item._id);

                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[styles.menuItemCard, itemIdx === catGroup.items.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => openDetailSheet(item)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.itemTextContainer}>
                        <View style={styles.vegBadgeRow}>
                          <View style={[styles.vegSquare, { borderColor: item.isVeg ? '#059669' : '#DC2626' }]}>
                            <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#059669' : '#DC2626' }]} />
                          </View>
                          {(item as any).isBestseller && (
                            <View style={styles.bestsellerBadge}>
                              <Text style={styles.bestsellerText}>Bestseller</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>{formatPaise(item.price)}</Text>
                        
                        {item.description ? <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text> : null}
                      </View>

                      <View style={styles.itemImageContainer}>
                        <View style={styles.itemImageWrapper}>
                          <Image source={{ uri: item.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' }} style={styles.itemImage} />
                        </View>

                        {qty > 0 && (!item.modifierGroups || item.modifierGroups.length === 0) ? (
                          <View style={styles.qtyControlBox}>
                            <TouchableOpacity onPress={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}>
                              <Ionicons name="remove" size={16} color="#0D9488" />
                            </TouchableOpacity>
                            <Text style={styles.qtyCount}>{qty}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}>
                              <Ionicons name="add" size={16} color="#0D9488" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => onAddPress(item)} style={styles.addBtn} disabled={!item.isAvailable}>
                            <Text style={[styles.addBtnText, !item.isAvailable && { color: '#9CA3AF' }]}>
                              {item.isAvailable ? 'ADD' : 'SOLD OUT'}
                            </Text>
                            {item.modifierGroups && item.modifierGroups.length > 0 && item.isAvailable && (
                              <Text style={styles.plusSign}>+</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── PRODUCT DETAIL BOTTOM SHEET ── */}
      <Modal visible={detailSheetVisible} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={() => setDetailSheetVisible(false)} />
        {detailItem && (
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            <View style={styles.detailImageWrapper}>
              <Image source={{ uri: detailItem.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' }} style={styles.detailImage} resizeMode="cover" />
            </View>

            <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailName}>{detailItem.name}</Text>
                <Text style={styles.detailPrice}>{formatPaise(detailItem.price)}</Text>
              </View>

              <View style={styles.detailBadgesRow}>
                <View style={[styles.detailTypeBadge, { backgroundColor: detailItem.isVeg ? '#F0FDF4' : '#FEF2F2', borderColor: detailItem.isVeg ? '#059669' : '#DC2626' }]}>
                  <Text style={[styles.detailTypeText, { color: detailItem.isVeg ? '#059669' : '#DC2626' }]}>
                    {detailItem.isVeg ? '🟢 Pure Veg' : '🔴 Non-Veg'}
                  </Text>
                </View>
                {detailItem.isBestseller && (
                  <View style={[styles.detailTypeBadge, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
                    <Text style={[styles.detailTypeText, { color: '#D97706' }]}>⭐ Bestseller</Text>
                  </View>
                )}
              </View>

              {detailItem.description ? (
                <View style={styles.detailDescBox}>
                  <Text style={styles.detailDescLabel}>About this dish</Text>
                  <Text style={styles.detailDesc}>{detailItem.description}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.detailFooter}>
              {(() => {
                const qty = getItemQuantityInCart(detailItem._id);
                if (!detailItem.isAvailable) {
                  return (
                    <View style={[styles.detailAddBtn, { backgroundColor: '#E5E7EB' }]}>
                      <Text style={[styles.detailAddBtnText, { color: '#9CA3AF' }]}>Sold Out</Text>
                    </View>
                  );
                }
                if (qty > 0 && (!detailItem.modifierGroups || detailItem.modifierGroups.length === 0)) {
                  return (
                    <View style={styles.detailQtyRow}>
                      <TouchableOpacity onPress={() => updateQuantity(detailItem._id, -1)} style={styles.detailQtyBtn}>
                        <Ionicons name="remove" size={20} color="#0D9488" />
                      </TouchableOpacity>
                      <Text style={styles.detailQtyCount}>{qty}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(detailItem._id, 1)} style={styles.detailQtyBtn}>
                        <Ionicons name="add" size={20} color="#0D9488" />
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    style={styles.detailAddBtn}
                    onPress={() => { setDetailSheetVisible(false); setTimeout(() => onAddPress(detailItem), 300); }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.detailAddBtnText}>
                      {detailItem.modifierGroups && detailItem.modifierGroups.length > 0 ? 'Customise & Add' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        )}
      </Modal>

      {/* ── MODIFIER MODAL ── */}
      <Modal visible={modModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize {selectedItemForMod?.name}</Text>
              <TouchableOpacity onPress={() => setModModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1C" />
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
                              color={isSelected ? '#0D9488' : '#9CA3AF'} 
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
              <TouchableOpacity style={styles.modConfirmBtn} onPress={confirmModifications}>
                <Text style={styles.modConfirmBtnText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FLOATING CART BAR ── */}
      {cartCount > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.bottomCartContainer}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.floatingCartBar} activeOpacity={0.9}>
            <View>
              <Text style={styles.cartCountLabel}>{cartCount} {cartCount === 1 ? 'item' : 'items'} | {formatPaise(cartTotal)}</Text>
              <Text style={styles.cartExtraLabel}>Extra charges may apply</Text>
            </View>
            <View style={styles.viewCartRight}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <Ionicons name="caret-forward" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { flex: 1 },
  centerContainer: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 24 },
  goBackButton: { marginTop: 20, backgroundColor: '#0D9488', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  goBackText: { ...Typography.button, color: '#FFF' },
  
  // Header / Banner
  bannerWrapper: { height: 250, backgroundColor: '#E5E7EB', position: 'relative' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
    backgroundColor: 'rgba(0,0,0,0)',
    // Fake gradient using solid color with opacity
    borderBottomWidth: 60, borderBottomColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 24,
  },
  bannerResName: { fontFamily: 'Georgia-Bold', fontSize: 24, color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  bannerNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  navCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  navActions: { flexDirection: 'row', gap: 12 },
  
  // Info Card
  infoCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  restaurantName: { fontFamily: 'Georgia-Bold', fontSize: 22, color: '#1C1C1C', marginBottom: 8 },
  cuisineTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cuisinePill: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cuisinePillText: { fontFamily: 'Georgia', fontSize: 12, color: '#555' },
  ratingBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontFamily: 'Georgia-Bold', color: '#FFF', fontSize: 13 },
  ratingCount: { fontFamily: 'Georgia', color: 'rgba(255,255,255,0.8)', fontSize: 10, marginLeft: 4 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', padding: 12, borderRadius: 12, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: 'Georgia-Bold', fontSize: 13, color: '#1C1C1C' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginHorizontal: 12 },
  
  pureVegBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  pureVegText: { fontFamily: 'Georgia-Bold', fontSize: 12, color: '#059669', marginLeft: 6 },

  // Sticky Tabs
  stickyTabsContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 12, alignItems: 'center' },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabBtnActive: { backgroundColor: '#1C1C1C' },
  tabBtnText: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#7A7A7A' },
  tabBtnTextActive: { color: '#FFF' },
  
  vegToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', marginLeft: 'auto' },
  vegToggleActive: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
  vegSquare: { width: 14, height: 14, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  vegText: { fontFamily: 'Georgia-Bold', fontSize: 12, color: '#7A7A7A' },
  vegTextActive: { color: '#059669' },

  // Menu List
  menuContainer: { paddingBottom: 120 },
  categorySection: { paddingTop: 20 },
  categoryHeading: { fontFamily: 'Georgia-Bold', fontSize: 18, color: '#1C1C1C', marginHorizontal: 16, marginBottom: 16 },
  
  menuItemCard: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemTextContainer: { flex: 1, paddingRight: 16 },
  vegBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  bestsellerBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#F59E0B' },
  bestsellerText: { fontFamily: 'Georgia-Bold', fontSize: 10, color: '#D97706' },
  menuItemName: { fontFamily: 'Georgia-Bold', fontSize: 16, color: '#1C1C1C', marginBottom: 4 },
  menuItemPrice: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#1C1C1C', marginBottom: 6 },
  menuItemDesc: { fontFamily: 'Georgia', fontSize: 13, color: '#7A7A7A', lineHeight: 18 },
  
  itemImageContainer: { alignItems: 'center', width: 110 },
  itemImageWrapper: { width: 110, height: 110, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  itemImage: { width: '100%', height: '100%' },
  
  addBtn: { position: 'absolute', bottom: -12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0D9488', borderRadius: 8, width: 90, height: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  addBtnText: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#0D9488' },
  plusSign: { position: 'absolute', right: 8, top: 4, fontFamily: 'Georgia-Bold', fontSize: 16, color: '#0D9488' },
  
  qtyControlBox: { position: 'absolute', bottom: -12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0D9488', borderRadius: 8, width: 90, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  qtyBtn: { width: 30, height: '100%', alignItems: 'center', justifyContent: 'center' },
  qtyCount: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#0D9488' },

  // Detail Sheet
  detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  detailSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  detailHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  detailImageWrapper: { padding: 16 },
  detailImage: { width: '100%', height: 240, borderRadius: 16 },
  detailBody: { paddingHorizontal: 16 },
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  detailName: { fontFamily: 'Georgia-Bold', fontSize: 22, color: '#1C1C1C', flex: 1, marginRight: 16 },
  detailPrice: { fontFamily: 'Georgia-Bold', fontSize: 20, color: '#0D9488' },
  detailBadgesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  detailTypeText: { fontFamily: 'Georgia-Bold', fontSize: 12 },
  detailDescBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 24 },
  detailDescLabel: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#1C1C1C', marginBottom: 8 },
  detailDesc: { fontFamily: 'Georgia', fontSize: 14, color: '#4B5563', lineHeight: 22 },
  detailFooter: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailAddBtn: { backgroundColor: '#0D9488', height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  detailAddBtnText: { fontFamily: 'Georgia-Bold', fontSize: 16, color: '#FFF' },
  detailQtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDFA', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#0D9488', paddingHorizontal: 16 },
  detailQtyBtn: { width: 40, height: '100%', alignItems: 'center', justifyContent: 'center' },
  detailQtyCount: { fontFamily: 'Georgia-Bold', fontSize: 18, color: '#0D9488' },
  
  soldOutBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16 },
  soldOutText: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#DC2626' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontFamily: 'Georgia-Bold', fontSize: 18, color: '#1C1C1C' },
  modalScroll: { marginBottom: 20 },
  modGroup: { marginBottom: 24 },
  modGroupHeader: { marginBottom: 12 },
  modGroupName: { fontFamily: 'Georgia-Bold', fontSize: 16, color: '#1C1C1C', marginBottom: 4 },
  modGroupReq: { fontFamily: 'Georgia', fontSize: 12, color: '#6B7280' },
  modOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  modOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modOptionName: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#1C1C1C' },
  modOptionPrice: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#6B7280' },
  modalFooter: { paddingTop: 10, paddingBottom: 20 },
  modConfirmBtn: { backgroundColor: '#0D9488', padding: 16, borderRadius: 12, alignItems: 'center' },
  modConfirmBtnText: { fontFamily: 'Georgia-Bold', fontSize: 16, color: '#FFF' },

  // Floating Cart Bar
  bottomCartContainer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  floatingCartBar: { backgroundColor: '#0D9488', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#0D9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  cartCountLabel: { fontFamily: 'Georgia-Bold', fontSize: 14, color: '#FFF', marginBottom: 2 },
  cartExtraLabel: { fontFamily: 'Georgia', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  viewCartRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewCartText: { fontFamily: 'Georgia-Bold', fontSize: 15, color: '#FFF' },
});

