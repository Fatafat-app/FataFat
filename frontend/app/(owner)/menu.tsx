import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerStore } from '../../store/owner.store';
import { formatPaise } from '../../utils/formatters';
import { MenuItem } from '../../types';
import { Typography, Colors } from '../../constants/Theme';

type ModalMode = 'add' | 'edit' | 'category' | null;

export default function OwnerMenuScreen() {
  const {
    restaurant,
    menuCategories,
    isLoading,
    fetchOwnerData,
    toggleItemStock,
    addNewDish,
    updateDish,
    addCategory,
  } = useOwnerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishPrepTime, setDishPrepTime] = useState('20');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOwnerData();
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const existingCategoryNames = React.useMemo(() => {
    return Array.from(
      new Set(
        menuCategories
          .map((c) => c.name || c.category)
          .filter(Boolean)
      )
    );
  }, [menuCategories]);

  const categoriesList = ['ALL', ...existingCategoryNames];

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    menuCategories.forEach((c) => {
      const name = c.name || c.category || '';
      if (c._id) map.set(c._id.toString(), name);
      if (name) map.set(name.toLowerCase(), name);
    });
    return map;
  }, [menuCategories]);

  const allItems = React.useMemo(() => {
    return menuCategories.flatMap((c) =>
      (c.items || []).map((item) => {
        const catName =
          c.name ||
          c.category ||
          (item.category ? categoryMap.get(item.category.toString()) : '') ||
          'General';
        return {
          ...item,
          categoryDisplayName: catName,
        };
      })
    );
  }, [menuCategories, categoryMap]);

  const filteredItems = React.useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' ||
        (item.categoryDisplayName || '').toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchQuery, selectedCategory]);

  const openAddModal = () => {
    setEditingItem(null);
    setDishName('');
    setDishCategory(existingCategoryNames[0] || '');
    setDishPrice('');
    setDishDesc('');
    setDishIsVeg(true);
    setDishPrepTime('20');
    setDishImageUrl('');
    setCategoryDropdownOpen(false);
    setModalMode('add');
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setDishName(item.name);
    setDishCategory(item.categoryDisplayName || item.category || '');
    setDishPrice(item.price ? String(item.price / 100) : '');
    setDishDesc(item.description || '');
    setDishIsVeg(item.isVeg ?? true);
    setDishPrepTime(item.preparationTime ? String(item.preparationTime) : '20');
    setDishImageUrl(item.images?.[0] || '');
    setCategoryDropdownOpen(false);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingItem(null);
    setCategoryDropdownOpen(false);
  };

  const handleSubmitDish = async () => {
    if (!dishName.trim()) {
      Alert.alert('Validation', 'Please enter a dish name');
      return;
    }
    if (!dishCategory.trim()) {
      Alert.alert('Validation', 'Please select or enter a category');
      return;
    }
    const priceNum = parseFloat(dishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation', 'Please enter a valid price');
      return;
    }

    const payload = {
      name: dishName.trim(),
      category: dishCategory.trim(),
      price: Math.round(priceNum * 100),
      description: dishDesc.trim() || undefined,
      isVeg: dishIsVeg,
      preparationTime: parseInt(dishPrepTime, 10) || 20,
      images: dishImageUrl.trim() ? [dishImageUrl.trim()] : undefined,
    };

    try {
      setSubmitting(true);
      if (modalMode === 'edit' && editingItem) {
        await updateDish(editingItem._id, payload);
        Alert.alert('Updated ✅', 'Dish updated successfully!');
      } else {
        await addNewDish(payload);
        Alert.alert('Added 🎉', 'New dish added to menu!');
      }
      closeModal();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not save dish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Validation', 'Please enter a category name');
      return;
    }
    if (existingCategoryNames.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      Alert.alert('Duplicate', 'This category already exists');
      return;
    }
    try {
      setAddingCategory(true);
      await addCategory(name);
      setNewCategoryName('');
      Alert.alert('Done ✅', `Category "${name}" added successfully!`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not add category');
    } finally {
      setAddingCategory(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Menu & Stock</Text>
          <Text style={styles.pageSubtitle}>{restaurant?.name || 'Your Restaurant'}</Text>
        </View>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={() => setModalMode('category')} style={styles.categoryBtn}>
            <Ionicons name="folder-open-outline" size={16} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.categoryBtnText}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openAddModal} style={styles.addDishHeaderBtn}>
            <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.addDishHeaderText}>Add Dish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search menu dishes..."
          style={styles.searchInput}
          placeholderTextColor={Colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* CATEGORY PILLS */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
          {categoriesList.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ITEM LIST */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="fast-food-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Dishes Found</Text>
            <Text style={styles.emptySubtitle}>
              {menuCategories.length === 0
                ? 'Start by adding a category, then add dishes.'
                : 'Try clearing search or tap "Add Dish".'}
            </Text>
            {menuCategories.length === 0 && (
              <TouchableOpacity onPress={() => setModalMode('category')} style={styles.emptyActionBtn}>
                <Text style={styles.emptyActionBtnText}>Add First Category</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = item.isAvailable ?? true;
            return (
              <View key={item._id} style={[styles.itemCard, !isAvailable && styles.itemCardOutOfStock]}>
                <Image
                  source={{ uri: item.images?.[0] || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <View style={styles.vegRow}>
                    <View style={[styles.vegSquare, { borderColor: item.isVeg ? Colors.success : Colors.error }]}>
                      <View style={[styles.vegDot, { backgroundColor: item.isVeg ? Colors.success : Colors.error }]} />
                    </View>
                    <Text style={styles.categoryTag}>{item.categoryDisplayName || item.category || 'Dish'}</Text>
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatPaise(item.price)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editIconBtn}>
                    <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.stockControl}>
                    <Text style={[styles.stockStatusLabel, { color: isAvailable ? Colors.success : Colors.error }]}>
                      {isAvailable ? 'IN STOCK' : 'SOLD OUT'}
                    </Text>
                    <Switch
                      value={isAvailable}
                      onValueChange={(val) => toggleItemStock(item._id, val)}
                      trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
                      thumbColor={isAvailable ? Colors.success : Colors.error}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ADD / EDIT DISH MODAL */}
      <Modal visible={modalMode === 'add' || modalMode === 'edit'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalMode === 'edit' ? 'Edit Dish' : 'Add New Dish'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Dish Name *</Text>
              <TextInput
                value={dishName}
                onChangeText={setDishName}
                placeholder="e.g. Paneer Butter Masala"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Category *</Text>

              {existingCategoryNames.length === 0 ? (
                <TouchableOpacity
                  style={styles.noCatBtn}
                  onPress={() => { closeModal(); setTimeout(() => setModalMode('category'), 300); }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.noCatBtnText}>No categories yet — tap to add one first</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setCategoryDropdownOpen((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownTriggerText, !dishCategory && { color: Colors.textSecondary }]}>
                      {dishCategory || 'Select a category...'}
                    </Text>
                    <Ionicons
                      name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {categoryDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {existingCategoryNames.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.dropdownOption, dishCategory === cat && styles.dropdownOptionActive]}
                          onPress={() => { setDishCategory(cat); setCategoryDropdownOpen(false); }}
                        >
                          <Text style={[styles.dropdownOptionText, dishCategory === cat && styles.dropdownOptionTextActive]}>
                            {cat}
                          </Text>
                          {dishCategory === cat && (
                            <Ionicons name="checkmark" size={16} color={Colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.dropdownAddNew}
                        onPress={() => { closeModal(); setTimeout(() => setModalMode('category'), 300); }}
                      >
                        <Ionicons name="add-circle-outline" size={15} color={Colors.primary} />
                        <Text style={styles.dropdownAddNewText}>Add New Category</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.inputLabel}>Price in Rupees (₹) *</Text>
              <TextInput
                value={dishPrice}
                onChangeText={setDishPrice}
                placeholder="e.g. 249"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                value={dishDesc}
                onChangeText={setDishDesc}
                placeholder="Fresh ingredients, creamy gravy..."
                multiline
                numberOfLines={2}
                style={[styles.inputField, { height: 60 }]}
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Food Type</Text>
              <View style={styles.vegSelectRow}>
                <TouchableOpacity onPress={() => setDishIsVeg(true)} style={[styles.typeOption, dishIsVeg && styles.typeOptionActiveGreen]}>
                  <View style={[styles.vegSquare, { borderColor: Colors.success }]}>
                    <View style={[styles.vegDot, { backgroundColor: Colors.success }]} />
                  </View>
                  <Text style={[styles.typeText, dishIsVeg && { color: Colors.success, fontWeight: '800' }]}>Vegetarian</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDishIsVeg(false)} style={[styles.typeOption, !dishIsVeg && styles.typeOptionActiveRed]}>
                  <View style={[styles.vegSquare, { borderColor: Colors.error }]}>
                    <View style={[styles.vegDot, { backgroundColor: Colors.error }]} />
                  </View>
                  <Text style={[styles.typeText, !dishIsVeg && { color: Colors.error, fontWeight: '800' }]}>Non-Veg</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Prep Time (minutes)</Text>
              <TextInput
                value={dishPrepTime}
                onChangeText={setDishPrepTime}
                placeholder="e.g. 20"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Image URL (Optional)</Text>
              <TextInput
                value={dishImageUrl}
                onChangeText={setDishImageUrl}
                placeholder="https://..."
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />

              <TouchableOpacity onPress={handleSubmitDish} disabled={submitting} style={styles.submitDishBtn}>
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitDishText}>{modalMode === 'edit' ? 'Save Changes' : 'Add Dish to Menu'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CATEGORY MANAGEMENT MODAL */}
      <Modal visible={modalMode === 'category'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Categories</Text>
              <TouchableOpacity onPress={() => setModalMode(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Existing Categories</Text>
              {existingCategoryNames.length === 0 ? (
                <Text style={styles.noCatText}>No categories yet. Add your first one below.</Text>
              ) : (
                existingCategoryNames.map((cat) => (
                  <View key={cat} style={styles.catListItem}>
                    <Ionicons name="folder-outline" size={16} color={Colors.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.catListText}>{cat}</Text>
                    <Text style={styles.catItemCount}>
                      {menuCategories.find((c) => (c.name || c.category) === cat)?.items.length || 0} dishes
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.divider} />

              <Text style={styles.inputLabel}>Add New Category</Text>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="e.g. Starters, Main Course, Drinks"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity onPress={handleAddCategory} disabled={addingCategory} style={styles.submitDishBtn}>
                {addingCategory ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitDishText}>Add Category</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, marginTop: 12, color: Colors.textSecondary },

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
  pageTitle: { ...Typography.heading, fontSize: 18 },
  pageSubtitle: { ...Typography.bodySmall, fontSize: 11 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  categoryBtnText: { ...Typography.button, color: Colors.primary, fontSize: 12 },
  addDishHeaderBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  addDishHeaderText: { ...Typography.button, color: Colors.white, fontSize: 12 },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  searchInput: { ...Typography.bodySmall, flex: 1, fontSize: 13, color: Colors.text },

  categoryScrollContainer: { marginTop: 10, marginBottom: 6 },
  categoryPillsRow: { paddingHorizontal: 16, gap: 8 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  categoryPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryPillText: { ...Typography.button, fontSize: 12, color: Colors.textSecondary },
  categoryPillTextActive: { color: Colors.white },

  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 40 },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 36, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  emptySubtitle: { ...Typography.caption, textAlign: 'center', marginTop: 4 },
  emptyActionBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyActionBtnText: { ...Typography.button, color: Colors.white, fontSize: 13 },

  itemCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  itemCardOutOfStock: { opacity: 0.65, backgroundColor: Colors.background },
  itemImage: { width: 68, height: 68, borderRadius: 12, backgroundColor: Colors.border, marginRight: 12 },
  itemInfo: { flex: 1, marginRight: 8 },
  vegRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  vegSquare: { width: 12, height: 12, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  vegDot: { width: 5, height: 5, borderRadius: 2.5 },
  categoryTag: { ...Typography.label, fontSize: 10, color: Colors.textSecondary },
  itemName: { ...Typography.title, fontSize: 14 },
  itemPrice: { ...Typography.heading, fontSize: 13, color: Colors.primary, marginTop: 2 },

  itemActions: { alignItems: 'center', gap: 8 },
  editIconBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stockControl: { alignItems: 'center' },
  stockStatusLabel: { ...Typography.label, fontSize: 9, marginBottom: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.heading, fontSize: 18 },
  formScroll: { paddingVertical: 14, paddingBottom: 30 },
  inputLabel: { ...Typography.button, fontSize: 12, color: Colors.textSecondary, marginBottom: 4, marginTop: 10 },
  inputField: { ...Typography.bodySmall, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },

  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { ...Typography.button, fontSize: 12, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.white },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  dropdownTriggerText: { ...Typography.body, fontSize: 14, color: Colors.text, flex: 1 },
  dropdownList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownOptionActive: { backgroundColor: '#FFF5F0' },
  dropdownOptionText: { ...Typography.body, fontSize: 14, color: Colors.text },
  dropdownOptionTextActive: { color: Colors.primary, fontWeight: '700' },
  dropdownAddNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  dropdownAddNewText: { ...Typography.button, fontSize: 13, color: Colors.primary, marginLeft: 6 },

  noCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    gap: 8,
  },
  noCatBtnText: { ...Typography.button, fontSize: 13, color: Colors.primary, flex: 1 },

  vegSelectRow: { flexDirection: 'row', gap: 10 },
  typeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  typeOptionActiveGreen: { backgroundColor: '#F0FDF4', borderColor: Colors.success },
  typeOptionActiveRed: { backgroundColor: '#FEF2F2', borderColor: Colors.error },
  typeText: { ...Typography.button, fontSize: 12, color: Colors.textSecondary, marginLeft: 6 },
  submitDishBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  submitDishText: { ...Typography.heading, color: Colors.white, fontSize: 15 },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  noCatText: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 8 },
  catListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catListText: { ...Typography.body, flex: 1, fontSize: 14 },
  catItemCount: { ...Typography.caption, color: Colors.textSecondary, fontSize: 12 },
});

