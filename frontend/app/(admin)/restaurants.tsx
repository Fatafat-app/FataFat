import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminService } from '../../services/admin.service';
import { Restaurant } from '../../types';
import { Typography, Colors } from '../../constants/Theme';

const ADMIN_PRIMARY = '#4F46E5';

interface DishFormState {
  _id?: string;
  name: string;
  category: string;
  price: string; // in rupees
  description: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
}

const initialDishForm: DishFormState = {
  name: '',
  category: '',
  price: '',
  description: '',
  image: '',
  isVeg: true,
  isAvailable: true,
};

export default function AdminRestaurantsScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'grocery'>('all');

  // Restaurant Menu Modal State
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [dishSearch, setDishSearch] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('all');

  // Dish Add / Edit Modal State
  const [dishModalVisible, setDishModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState<any | null>(null);
  const [dishFormData, setDishFormData] = useState<DishFormState>(initialDishForm);
  const [savingDish, setSavingDish] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await adminService.listAllRestaurants();
      setRestaurants(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const handleToggleStatus = (rest: Restaurant) => {
    const nextState = !rest.isActive;
    Alert.alert(
      nextState ? 'Activate Store' : 'Suspend / Ban Store',
      `Are you sure you want to ${nextState ? 'activate' : 'suspend'} ${rest.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextState ? 'Activate' : 'Suspend',
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const updated = await adminService.updateRestaurantStatus(rest._id, { isActive: nextState });
              setRestaurants((prev) =>
                prev.map((r) => (r._id === updated._id ? { ...r, ...updated, isActive: nextState } : r))
              );
              if (selectedRest && selectedRest._id === rest._id) {
                setSelectedRest((prev: any) => ({ ...prev, isActive: nextState }));
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not update store status');
            }
          },
        },
      ]
    );
  };

  const handleToggleVerified = async (rest: Restaurant) => {
    const nextState = !rest.isVerified;
    try {
      await adminService.updateRestaurantStatus(rest._id, { isVerified: nextState });
      setRestaurants((prev) =>
        prev.map((r) => (r._id === rest._id ? { ...r, isVerified: nextState } : r))
      );
      if (selectedRest && selectedRest._id === rest._id) {
        setSelectedRest((prev: any) => ({ ...prev, isVerified: nextState }));
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update verification status');
    }
  };

  // --- Menu Management Handlers ---
  const handleOpenStoreMenu = async (rest: Restaurant) => {
    setSelectedRest(rest);
    setDishSearch('');
    setSelectedMenuCategory('all');
    try {
      setLoadingMenu(true);
      const menuData = await adminService.getRestaurantMenu(rest._id);
      setMenuCategories(menuData || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not load store menu');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleRefreshMenu = async () => {
    if (!selectedRest) return;
    try {
      setLoadingMenu(true);
      const menuData = await adminService.getRestaurantMenu(selectedRest._id);
      setMenuCategories(menuData || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not refresh menu');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleToggleDishAvailability = async (dish: any) => {
    if (!selectedRest) return;
    const nextVal = !dish.isAvailable;

    // Optimistically update local menu categories
    setMenuCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item: any) =>
          item._id === dish._id ? { ...item, isAvailable: nextVal } : item
        ),
      }))
    );

    try {
      await adminService.toggleRestaurantMenuItemAvailability(selectedRest._id, dish._id);
    } catch (err: any) {
      // Revert on error
      setMenuCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item: any) =>
            item._id === dish._id ? { ...item, isAvailable: !nextVal } : item
          ),
        }))
      );
      Alert.alert('Error', err.response?.data?.message || 'Could not toggle item availability');
    }
  };

  const handleDeleteDish = (dish: any) => {
    if (!selectedRest) return;
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to permanently remove "${dish.name}" from ${selectedRest.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteRestaurantMenuItem(selectedRest._id, dish._id);
              setMenuCategories((prev) =>
                prev.map((cat) => ({
                  ...cat,
                  items: cat.items.filter((item: any) => item._id !== dish._id),
                }))
              );
              Alert.alert('Deleted', `"${dish.name}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.response?.data?.message || 'Could not delete item');
            }
          },
        },
      ]
    );
  };

  const handleOpenAddDishModal = () => {
    if (!selectedRest) return;
    setEditingDish(null);
    setDishFormData({
      ...initialDishForm,
      category: menuCategories.length > 0 ? menuCategories[0].name || menuCategories[0]._id : 'Main Course',
    });
    setDishModalVisible(true);
  };

  const handleOpenEditDishModal = (dish: any) => {
    setEditingDish(dish);
    const catName =
      typeof dish.category === 'object'
        ? dish.category?.name
        : menuCategories.find((c) => c._id === dish.category)?.name || dish.category || 'Main Course';

    setDishFormData({
      _id: dish._id,
      name: dish.name || '',
      category: catName,
      price: String(dish.price ? dish.price / 100 : ''),
      description: dish.description || '',
      image: dish.images?.[0] || '',
      isVeg: dish.isVeg ?? true,
      isAvailable: dish.isAvailable ?? true,
    });
    setDishModalVisible(true);
  };

  const handleSaveDish = async () => {
    if (!selectedRest) return;
    if (!dishFormData.name.trim()) {
      Alert.alert('Validation', 'Dish name is required.');
      return;
    }
    if (!dishFormData.price || isNaN(Number(dishFormData.price)) || Number(dishFormData.price) <= 0) {
      Alert.alert('Validation', 'Please enter a valid price in rupees.');
      return;
    }
    if (!dishFormData.category.trim()) {
      Alert.alert('Validation', 'Please provide a category name.');
      return;
    }

    try {
      setSavingDish(true);
      const payload: any = {
        name: dishFormData.name.trim(),
        category: dishFormData.category.trim(),
        price: Math.round(Number(dishFormData.price) * 100), // convert rupees to paise
        description: dishFormData.description.trim(),
        isVeg: dishFormData.isVeg,
        isAvailable: dishFormData.isAvailable,
      };

      if (dishFormData.image.trim()) {
        payload.images = [dishFormData.image.trim()];
      }

      if (editingDish) {
        await adminService.updateRestaurantMenuItem(selectedRest._id, editingDish._id, payload);
        Alert.alert('Success', 'Dish updated successfully.');
      } else {
        await adminService.addRestaurantMenuItem(selectedRest._id, payload);
        Alert.alert('Success', 'New dish added to store menu.');
      }

      setDishModalVisible(false);
      await handleRefreshMenu();
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not save menu item');
    } finally {
      setSavingDish(false);
    }
  };

  const filteredStores = useMemo(() => {
    return restaurants.filter((r) => {
      const nameMatch =
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.address?.city?.toLowerCase().includes(search.toLowerCase()) ||
        r.address?.street?.toLowerCase().includes(search.toLowerCase());
      if (!nameMatch) return false;

      const isGrocery = r.name?.toLowerCase().includes('grocery') || r.name?.toLowerCase().includes('mart');
      if (filterType === 'food' && isGrocery) return false;
      if (filterType === 'grocery' && !isGrocery) return false;

      return true;
    });
  }, [restaurants, search, filterType]);

  // Flattened & filtered dishes for modal
  const allDishes = useMemo(() => {
    const list: any[] = [];
    menuCategories.forEach((cat) => {
      (cat.items || []).forEach((item: any) => {
        list.push({ ...item, categoryName: cat.name });
      });
    });
    return list;
  }, [menuCategories]);

  const filteredDishes = useMemo(() => {
    return allDishes.filter((dish) => {
      const matchSearch =
        dish.name?.toLowerCase().includes(dishSearch.toLowerCase()) ||
        dish.description?.toLowerCase().includes(dishSearch.toLowerCase());
      if (!matchSearch) return false;

      if (selectedMenuCategory !== 'all') {
        if (dish.categoryName !== selectedMenuCategory && dish.category !== selectedMenuCategory) {
          return false;
        }
      }

      return true;
    });
  }, [allDishes, dishSearch, selectedMenuCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navbarLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Stores & Vendors</Text>
            <Text style={styles.pageSubtitle}>{restaurants.length} Registered Merchants</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={ADMIN_PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_PRIMARY]} />}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores, marts, cities..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              All Stores ({restaurants.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'food' && styles.filterPillActive]}
            onPress={() => setFilterType('food')}
          >
            <Text style={[styles.filterText, filterType === 'food' && styles.filterTextActive]}>
              🍔 Restaurants
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'grocery' && styles.filterPillActive]}
            onPress={() => setFilterType('grocery')}
          >
            <Text style={[styles.filterText, filterType === 'grocery' && styles.filterTextActive]}>
              🛒 Grocery Marts
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ADMIN_PRIMARY} />
            <Text style={styles.loadingText}>Loading merchant catalog...</Text>
          </View>
        ) : filteredStores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Stores Found</Text>
            <Text style={styles.emptySubtitle}>No merchants matching your search query.</Text>
          </View>
        ) : (
          filteredStores.map((rest) => {
            const isActive = rest.isActive ?? true;
            const isGrocery = rest.name?.toLowerCase().includes('grocery') || rest.name?.toLowerCase().includes('mart');

            return (
              <View key={rest._id} style={styles.restaurantCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenStoreMenu(rest)}
                  style={styles.cardHeader}
                >
                  <View style={[styles.restImagePlaceholder, isGrocery && { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons
                      name={isGrocery ? 'basket' : 'restaurant'}
                      size={22}
                      color={isGrocery ? '#16A34A' : Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.restName} numberOfLines={1}>
                        {rest.name}
                      </Text>
                      {rest.isVerified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#2563EB" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.restAddress} numberOfLines={1}>
                      <Ionicons name="location" size={10} color={Colors.textSecondary} />{' '}
                      {rest.address?.street || 'Local Area'}, {rest.address?.city || 'City'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {/* Manage Menu Action Banner */}
                <TouchableOpacity
                  onPress={() => handleOpenStoreMenu(rest)}
                  style={styles.menuBannerBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="book-outline" size={15} color={ADMIN_PRIMARY} />
                  <Text style={styles.menuBannerText}>
                    Open Products & Menu Catalog ({rest.cuisines?.join(', ') || 'Dishes'})
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={ADMIN_PRIMARY} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    onPress={() => handleToggleVerified(rest)}
                    style={[styles.actionTag, rest.isVerified && styles.actionTagActive]}
                  >
                    <Ionicons
                      name={rest.isVerified ? 'shield-checkmark' : 'shield-outline'}
                      size={14}
                      color={rest.isVerified ? '#2563EB' : Colors.textSecondary}
                    />
                    <Text style={[styles.actionTagText, rest.isVerified && { color: '#2563EB' }]}>
                      {rest.isVerified ? 'Verified Partner' : 'Mark Verified'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.toggleCol}>
                    <Text style={[styles.statusText, { color: isActive ? Colors.success : Colors.error }]}>
                      {isActive ? 'ONLINE' : 'SUSPENDED'}
                    </Text>
                    <Switch
                      value={isActive}
                      onValueChange={() => handleToggleStatus(rest)}
                      trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                      thumbColor={isActive ? Colors.success : Colors.error}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- STORE PRODUCTS & MENU INSPECTOR MODAL --- */}
      <Modal
        visible={!!selectedRest}
        animationType="slide"
        onRequestClose={() => setSelectedRest(null)}
      >
        <SafeAreaView style={styles.fullModalSafeArea}>
          {/* Header */}
          <View style={styles.modalNav}>
            <TouchableOpacity onPress={() => setSelectedRest(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalNavTitle} numberOfLines={1}>
                {selectedRest?.name || 'Store Details'}
              </Text>
              <Text style={styles.modalNavSub} numberOfLines={1}>
                {selectedRest?.address?.street}, {selectedRest?.address?.city} • {allDishes.length} Items
              </Text>
            </View>

            <TouchableOpacity onPress={handleOpenAddDishModal} style={styles.addDishBtn}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addDishBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Store Status Bar */}
          {selectedRest && (
            <View style={styles.storeStatusBar}>
              <View style={styles.storeStatusCol}>
                <Text style={styles.storeStatusLabel}>STORE STATUS</Text>
                <View style={styles.rowAlign}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: selectedRest.isActive ? Colors.success : Colors.error },
                    ]}
                  />
                  <Text
                    style={[
                      styles.storeStatusVal,
                      { color: selectedRest.isActive ? Colors.success : Colors.error },
                    ]}
                  >
                    {selectedRest.isActive ? 'Active & Accepting Orders' : 'Store Suspended / Banned'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleToggleStatus(selectedRest)}
                style={[
                  styles.suspendBtn,
                  selectedRest.isActive ? styles.suspendBtnActive : styles.activateBtn,
                ]}
              >
                <Ionicons
                  name={selectedRest.isActive ? 'ban' : 'checkmark-circle'}
                  size={14}
                  color={selectedRest.isActive ? '#DC2626' : '#16A34A'}
                />
                <Text
                  style={[
                    styles.suspendBtnText,
                    { color: selectedRest.isActive ? '#DC2626' : '#16A34A' },
                  ]}
                >
                  {selectedRest.isActive ? 'Ban Store' : 'Activate Store'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dish Search & Category Filters */}
          <View style={styles.modalFilterArea}>
            <View style={styles.modalSearchBar}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search dishes or items..."
                placeholderTextColor={Colors.textSecondary}
                value={dishSearch}
                onChangeText={setDishSearch}
              />
              {dishSearch ? (
                <TouchableOpacity onPress={() => setDishSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {menuCategories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingTop: 8 }}
              >
                <TouchableOpacity
                  style={[styles.menuCatPill, selectedMenuCategory === 'all' && styles.menuCatPillActive]}
                  onPress={() => setSelectedMenuCategory('all')}
                >
                  <Text style={[styles.menuCatPillText, selectedMenuCategory === 'all' && styles.menuCatPillTextActive]}>
                    All ({allDishes.length})
                  </Text>
                </TouchableOpacity>
                {menuCategories.map((cat) => {
                  const isSel = selectedMenuCategory === cat.name || selectedMenuCategory === cat._id;
                  return (
                    <TouchableOpacity
                      key={cat._id}
                      style={[styles.menuCatPill, isSel && styles.menuCatPillActive]}
                      onPress={() => setSelectedMenuCategory(cat.name)}
                    >
                      <Text style={[styles.menuCatPillText, isSel && styles.menuCatPillTextActive]}>
                        {cat.name} ({cat.items?.length || 0})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Dishes List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={loadingMenu} onRefresh={handleRefreshMenu} colors={[ADMIN_PRIMARY]} />}
          >
            {loadingMenu ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ADMIN_PRIMARY} />
                <Text style={styles.loadingText}>Fetching menu & products...</Text>
              </View>
            ) : filteredDishes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="fast-food-outline" size={44} color={Colors.borderDark} />
                <Text style={styles.emptyTitle}>No Menu Items Found</Text>
                <Text style={styles.emptySubtitle}>
                  {dishSearch ? 'No items match your search.' : 'Tap "+ Add Item" to add products to this store.'}
                </Text>
              </View>
            ) : (
              filteredDishes.map((dish) => {
                const isAvail = dish.isAvailable ?? true;
                const isVeg = dish.isVeg ?? true;
                const img = dish.images?.[0];
                const priceInRupees = dish.price ? Math.round(dish.price / 100) : 0;

                return (
                  <View key={dish._id} style={styles.dishCard}>
                    <View style={styles.dishTopRow}>
                      <View style={styles.dishImgWrapper}>
                        {img ? (
                          <Image source={{ uri: img }} style={styles.dishImg} resizeMode="cover" />
                        ) : (
                          <View style={styles.dishImgPlaceholder}>
                            <Ionicons name="restaurant-outline" size={22} color={ADMIN_PRIMARY} />
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.dishMetaRow}>
                          <View style={[styles.vegBadge, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                            <View
                              style={[
                                styles.vegDot,
                                { backgroundColor: isVeg ? '#16A34A' : '#DC2626' },
                              ]}
                            />
                          </View>
                          <Text style={styles.dishCategoryTag}>{dish.categoryName || 'Item'}</Text>
                        </View>

                        <Text style={styles.dishName} numberOfLines={2}>
                          {dish.name}
                        </Text>
                        {dish.description ? (
                          <Text style={styles.dishDesc} numberOfLines={1}>
                            {dish.description}
                          </Text>
                        ) : null}

                        <Text style={styles.dishPrice}>₹{priceInRupees}</Text>
                      </View>
                    </View>

                    <View style={styles.dishDivider} />

                    <View style={styles.dishFooter}>
                      {/* Availability / Ban toggle for this dish */}
                      <View style={styles.dishToggleCol}>
                        <Switch
                          value={isAvail}
                          onValueChange={() => handleToggleDishAvailability(dish)}
                          trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                          thumbColor={isAvail ? '#16A34A' : '#DC2626'}
                        />
                        <Text
                          style={[
                            styles.dishAvailStatus,
                            { color: isAvail ? '#16A34A' : '#DC2626' },
                          ]}
                        >
                          {isAvail ? 'AVAILABLE' : 'BANNED / OUT'}
                        </Text>
                      </View>

                      <View style={styles.dishBtnRow}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditDishModal(dish)}
                          style={styles.dishEditBtn}
                        >
                          <Ionicons name="create-outline" size={14} color="#4F46E5" />
                          <Text style={styles.dishEditText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteDish(dish)}
                          style={styles.dishDeleteBtn}
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* --- ADD / EDIT DISH MODAL --- */}
      <Modal
        visible={dishModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDishModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingDish ? 'Edit Menu Item' : 'Add New Menu Item'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedRest?.name} • Manage pricing and details
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDishModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Dish Name */}
              <Text style={styles.inputLabel}>Dish / Product Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Paneer Butter Masala"
                placeholderTextColor={Colors.textSecondary}
                value={dishFormData.name}
                onChangeText={(text) => setDishFormData({ ...dishFormData, name: text })}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Main Course, Starters, Beverages"
                placeholderTextColor={Colors.textSecondary}
                value={dishFormData.category}
                onChangeText={(text) => setDishFormData({ ...dishFormData, category: text })}
              />

              {/* Price in Rupees */}
              <Text style={styles.inputLabel}>Price in Rupees (₹) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 240"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={dishFormData.price}
                onChangeText={(text) => setDishFormData({ ...dishFormData, price: text })}
              />

              {/* Image URL */}
              <Text style={styles.inputLabel}>Image URL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={Colors.textSecondary}
                value={dishFormData.image}
                onChangeText={(text) => setDishFormData({ ...dishFormData, image: text })}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Fresh cottage cheese cooked in creamy tomato butter gravy..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                value={dishFormData.description}
                onChangeText={(text) => setDishFormData({ ...dishFormData, description: text })}
              />

              {/* Veg / Non-Veg Switch */}
              <View style={styles.switchRow}>
                <View style={styles.rowAlign}>
                  <View
                    style={[
                      styles.vegBadge,
                      { borderColor: dishFormData.isVeg ? '#16A34A' : '#DC2626', marginRight: 8 },
                    ]}
                  >
                    <View
                      style={[
                        styles.vegDot,
                        { backgroundColor: dishFormData.isVeg ? '#16A34A' : '#DC2626' },
                      ]}
                    />
                  </View>
                  <Text style={styles.switchLabel}>
                    {dishFormData.isVeg ? 'Pure Veg' : 'Non-Veg'}
                  </Text>
                </View>
                <Switch
                  value={dishFormData.isVeg}
                  onValueChange={(val) => setDishFormData({ ...dishFormData, isVeg: val })}
                  trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                  thumbColor={dishFormData.isVeg ? '#16A34A' : '#DC2626'}
                />
              </View>

              {/* In-Stock / Available Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Available / In Stock</Text>
                <Switch
                  value={dishFormData.isAvailable}
                  onValueChange={(val) => setDishFormData({ ...dishFormData, isAvailable: val })}
                  trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                  thumbColor={dishFormData.isAvailable ? '#16A34A' : '#DC2626'}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setDishModalVisible(false)}
                style={styles.cancelBtn}
                disabled={savingDish}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveDish}
                style={[styles.saveBtn, savingDish && { opacity: 0.7 }]}
                disabled={savingDish}
              >
                {savingDish ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingDish ? 'Update Dish' : 'Add Dish'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pageTitle: { ...Typography.heading, fontSize: 18 },
  pageSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  refreshBtn: { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 10 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: '#EEF2FF', borderColor: ADMIN_PRIMARY },
  filterText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 12 },
  filterTextActive: { color: ADMIN_PRIMARY, fontWeight: '700' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 10 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  emptySubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  restImagePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  restName: { ...Typography.heading, fontSize: 16, flex: 1, marginRight: 8 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: { ...Typography.caption, fontSize: 10, color: '#1E40AF', fontWeight: '700' },
  restAddress: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  menuBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  menuBannerText: { ...Typography.caption, color: ADMIN_PRIMARY, fontWeight: '600', fontSize: 11, flex: 1, marginLeft: 6 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  actionTagActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  actionTagText: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary },
  toggleCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { ...Typography.label, fontSize: 10, letterSpacing: 0.5 },

  // --- Full Modal Styles ---
  fullModalSafeArea: { flex: 1, backgroundColor: Colors.background },
  modalNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalNavTitle: { ...Typography.heading, fontSize: 16 },
  modalNavSub: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11, marginTop: 1 },
  addDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addDishBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 11 },
  storeStatusBar: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeStatusCol: { flex: 1 },
  storeStatusLabel: { ...Typography.label, fontSize: 9, color: '#94A3B8', letterSpacing: 0.5 },
  storeStatusVal: { ...Typography.button, fontSize: 12, marginLeft: 6 },
  rowAlign: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  suspendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  suspendBtnActive: { backgroundColor: '#FEF2F2' },
  activateBtn: { backgroundColor: '#DCFCE7' },
  suspendBtnText: { ...Typography.caption, fontSize: 11, fontWeight: '700' },
  modalFilterArea: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSearchInput: { flex: 1, ...Typography.body, fontSize: 13, color: Colors.text },
  menuCatPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  menuCatPillActive: { backgroundColor: '#4F46E5' },
  menuCatPillText: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary },
  menuCatPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // Dish Card Styles
  dishCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
  },
  dishTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dishImgWrapper: { width: 60, height: 60, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F8FAFC' },
  dishImg: { width: '100%', height: '100%' },
  dishImgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  dishMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  vegBadge: { width: 14, height: 14, borderWidth: 1.5, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  dishCategoryTag: { ...Typography.caption, fontSize: 10, color: Colors.textSecondary },
  dishName: { ...Typography.title, fontSize: 14, color: Colors.text },
  dishDesc: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  dishPrice: { ...Typography.heading, fontSize: 15, color: '#4F46E5', marginTop: 4 },
  dishDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  dishFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishToggleCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dishAvailStatus: { ...Typography.label, fontSize: 9, letterSpacing: 0.5 },
  dishBtnRow: { flexDirection: 'row', gap: 6 },
  dishEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  dishEditText: { ...Typography.caption, fontSize: 11, color: '#4F46E5', fontWeight: '700' },
  dishDeleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal / Form Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.heading, fontSize: 17 },
  modalSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { padding: 4 },
  modalBody: { paddingHorizontal: 20, paddingTop: 14 },
  inputLabel: { ...Typography.label, fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: { ...Typography.body, fontSize: 13, color: Colors.text },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...Typography.button, color: Colors.textSecondary },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { ...Typography.button, color: '#FFFFFF' },
});
