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
import { Typography, Colors } from '../../constants/Theme';

const ADMIN_PRIMARY = '#16A34A'; // Green theme for grocery

interface GroceryFormState {
  _id?: string;
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  unit: string;
  stockQuantity: string;
  image: string;
  description: string;
  badge: string;
  isAvailable: boolean;
  isOrganic: boolean;
  isSpecialDeal: boolean;
  isTrending: boolean;
}

const initialForm: GroceryFormState = {
  name: '',
  category: '',
  price: '',
  originalPrice: '',
  unit: '1 unit',
  stockQuantity: '100',
  image: '',
  description: '',
  badge: '',
  isAvailable: true,
  isOrganic: false,
  isSpecialDeal: false,
  isTrending: false,
};

export default function GroceryProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formData, setFormData] = useState<GroceryFormState>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        adminService.listGroceryProducts(),
        adminService.listGroceryCategories(),
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes || []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not load grocery products');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialForm,
      category: categories.length > 0 ? categories[0]._id : '',
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (prod: any) => {
    setEditingProduct(prod);
    const catId = typeof prod.category === 'object' ? prod.category?._id : prod.category;
    setFormData({
      _id: prod._id,
      name: prod.name || '',
      category: catId || (categories.length > 0 ? categories[0]._id : ''),
      price: String(prod.price ?? ''),
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : '',
      unit: prod.unit || '1 unit',
      stockQuantity: String(prod.stockQuantity ?? 100),
      image: prod.images?.[0] || '',
      description: prod.description || '',
      badge: prod.badge || '',
      isAvailable: prod.isAvailable ?? true,
      isOrganic: !!prod.isOrganic,
      isSpecialDeal: !!prod.isSpecialDeal,
      isTrending: !!prod.isTrending,
    });
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required.');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price in rupees.');
      return;
    }
    if (!formData.category) {
      Alert.alert('Validation Error', 'Please select a product category.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        unit: formData.unit.trim() || '1 unit',
        stockQuantity: Number(formData.stockQuantity) || 0,
        isAvailable: formData.isAvailable,
        isOrganic: formData.isOrganic,
        isSpecialDeal: formData.isSpecialDeal,
        isTrending: formData.isTrending,
      };

      if (formData.originalPrice && !isNaN(Number(formData.originalPrice))) {
        payload.originalPrice = Number(formData.originalPrice);
      }
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.image.trim()) {
        payload.images = [formData.image.trim()];
      }
      if (formData.badge) {
        payload.badge = formData.badge;
      } else {
        payload.badge = null;
      }

      if (editingProduct) {
        const updated = await adminService.updateGroceryProduct(editingProduct._id, payload);
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? { ...p, ...payload, ...updated } : p))
        );
        Alert.alert('Success', 'Product updated successfully.');
      } else {
        const created = await adminService.createGroceryProduct(payload);
        setProducts((prev) => [created, ...prev]);
        Alert.alert('Success', 'Product added to grocery catalog.');
      }

      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (prod: any) => {
    const nextVal = !prod.isAvailable;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p._id === prod._id ? { ...p, isAvailable: nextVal } : p))
    );

    try {
      await adminService.toggleGroceryProductAvailability(prod._id);
    } catch (err: any) {
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p._id === prod._id ? { ...p, isAvailable: !nextVal } : p))
      );
      Alert.alert('Error', err.response?.data?.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteProduct = (prod: any) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to permanently delete "${prod.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteGroceryProduct(prod._id);
              setProducts((prev) => prev.filter((p) => p._id !== prod._id));
              Alert.alert('Deleted', `"${prod.name}" has been removed from catalog.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.response?.data?.message || 'Could not delete product');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const nameMatch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.unit?.toLowerCase().includes(search.toLowerCase());
      if (!nameMatch) return false;

      if (selectedCategory !== 'all') {
        const catId = typeof p.category === 'object' ? p.category?._id : p.category;
        const catSlug = typeof p.category === 'object' ? p.category?.slug : '';
        if (catId !== selectedCategory && catSlug !== selectedCategory) {
          return false;
        }
      }

      if (stockFilter === 'in_stock' && (!p.isAvailable || (p.stockQuantity !== undefined && p.stockQuantity <= 0))) {
        return false;
      }
      if (stockFilter === 'out_of_stock' && (p.isAvailable && (p.stockQuantity === undefined || p.stockQuantity > 0))) {
        return false;
      }

      return true;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const inStockCount = useMemo(
    () => products.filter((p) => p.isAvailable && (p.stockQuantity === undefined || p.stockQuantity > 0)).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => !p.isAvailable || p.stockQuantity <= 0).length,
    [products]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Grocery Products</Text>
            <Text style={styles.pageSubtitle}>{products.length} Catalog Items</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleOpenCreateModal} style={styles.addBtn}>
          <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_PRIMARY]} />}
      >
        {/* Metric Summary Cards */}
        <View style={styles.metricRow}>
          <View style={[styles.metricCard, { borderLeftColor: ADMIN_PRIMARY, borderLeftWidth: 4 }]}>
            <Text style={styles.metricVal}>{products.length}</Text>
            <Text style={styles.metricLbl}>Total Items</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#2563EB', borderLeftWidth: 4 }]}>
            <Text style={[styles.metricVal, { color: '#2563EB' }]}>{inStockCount}</Text>
            <Text style={styles.metricLbl}>In Stock</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
            <Text style={[styles.metricVal, { color: '#EF4444' }]}>{outOfStockCount}</Text>
            <Text style={styles.metricLbl}>Out of Stock</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by title, unit..."
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

        {/* Stock Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, stockFilter === 'all' && styles.filterPillActive]}
            onPress={() => setStockFilter('all')}
          >
            <Text style={[styles.filterText, stockFilter === 'all' && styles.filterTextActive]}>
              All ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, stockFilter === 'in_stock' && styles.filterPillActive]}
            onPress={() => setStockFilter('in_stock')}
          >
            <Text style={[styles.filterText, stockFilter === 'in_stock' && styles.filterTextActive]}>
              ✅ In Stock ({inStockCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, stockFilter === 'out_of_stock' && styles.filterPillActive]}
            onPress={() => setStockFilter('out_of_stock')}
          >
            <Text style={[styles.filterText, stockFilter === 'out_of_stock' && styles.filterTextActive]}>
              🚫 Out of Stock ({outOfStockCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Scroll Filter */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const active = selectedCategory === cat._id || selectedCategory === cat.slug;
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat._id)}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.emoji ? `${cat.emoji} ` : ''}
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Products List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ADMIN_PRIMARY} />
            <Text style={styles.loadingText}>Loading grocery inventory...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="basket-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try adjusting your search query.' : 'Click "Add Product" to create items.'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((prod) => {
            const isAvailable = prod.isAvailable ?? true;
            const categoryName =
              typeof prod.category === 'object' ? prod.category?.name : 'Grocery';
            const imgUrl = prod.images?.[0];

            return (
              <View key={prod._id} style={styles.productCard}>
                <View style={styles.cardTopRow}>
                  {/* Thumbnail */}
                  <View style={styles.imgContainer}>
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.productImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.imgPlaceholder}>
                        <Ionicons name="cube-outline" size={24} color={ADMIN_PRIMARY} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.badgeRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{categoryName}</Text>
                      </View>
                      {prod.badge ? (
                        <View style={[styles.badgeTag, prod.badge === 'deal' ? styles.badgeDeal : styles.badgeBest]}>
                          <Text style={styles.badgeTagText}>{prod.badge.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.productTitle} numberOfLines={2}>
                      {prod.name}
                    </Text>

                    <Text style={styles.unitText}>
                      Unit: <Text style={{ color: Colors.text }}>{prod.unit || '1 unit'}</Text>
                      {prod.stockQuantity !== undefined ? ` • Stock: ${prod.stockQuantity}` : ''}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceMain}>₹{prod.price}</Text>
                      {prod.originalPrice && prod.originalPrice > prod.price ? (
                        <Text style={styles.priceCut}>₹{prod.originalPrice}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardDivider} />
                <View style={styles.cardFooter}>
                  {/* In Stock Switch */}
                  <View style={styles.switchCol}>
                    <Switch
                      value={isAvailable}
                      onValueChange={() => handleToggleAvailability(prod)}
                      trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                      thumbColor={isAvailable ? ADMIN_PRIMARY : Colors.error}
                    />
                    <Text
                      style={[
                        styles.availStatusText,
                        { color: isAvailable ? ADMIN_PRIMARY : Colors.error },
                      ]}
                    >
                      {isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}
                    </Text>
                  </View>

                  {/* Edit / Delete Buttons */}
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(prod)}
                      style={styles.editBtn}
                    >
                      <Ionicons name="create-outline" size={15} color="#4F46E5" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(prod)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingProduct ? 'Edit Grocery Product' : 'Add New Grocery Product'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingProduct ? 'Update product pricing, stock & metadata' : 'Create a new product in the grocery inventory'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Product Name */}
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Amul Taaza Fresh Toned Milk"
                placeholderTextColor={Colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              {/* Category Selector */}
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {categories.map((cat) => {
                  const selected = formData.category === cat._id;
                  return (
                    <TouchableOpacity
                      key={cat._id}
                      style={[styles.modalCatChip, selected && styles.modalCatChipActive]}
                      onPress={() => setFormData({ ...formData, category: cat._id })}
                    >
                      <Text style={[styles.modalCatText, selected && styles.modalCatTextActive]}>
                        {cat.emoji ? `${cat.emoji} ` : ''}
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Price & Original Price (MRP) */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 30"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Original MRP (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 35"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.originalPrice}
                    onChangeText={(text) => setFormData({ ...formData, originalPrice: text })}
                  />
                </View>
              </View>

              {/* Unit & Stock Quantity */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Unit / Weight *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 500 ml, 1 kg"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 100"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.stockQuantity}
                    onChangeText={(text) => setFormData({ ...formData, stockQuantity: text })}
                  />
                </View>
              </View>

              {/* Image URL */}
              <Text style={styles.inputLabel}>Image URL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={Colors.textSecondary}
                value={formData.image}
                onChangeText={(text) => setFormData({ ...formData, image: text })}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Brief details about the grocery item..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />

              {/* Badges Selector */}
              <Text style={styles.inputLabel}>Badge</Text>
              <View style={styles.badgeSelectorRow}>
                {[
                  { key: '', label: 'None' },
                  { key: 'deal', label: '🔥 Deal' },
                  { key: 'best_seller', label: '⭐ Best Seller' },
                  { key: 'organic', label: '🌿 Organic' },
                ].map((b) => {
                  const sel = formData.badge === b.key;
                  return (
                    <TouchableOpacity
                      key={b.key}
                      style={[styles.badgeOption, sel && styles.badgeOptionActive]}
                      onPress={() => setFormData({ ...formData, badge: b.key })}
                    >
                      <Text style={[styles.badgeOptionText, sel && styles.badgeOptionTextActive]}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Switches Row */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>In Stock & Available</Text>
                <Switch
                  value={formData.isAvailable}
                  onValueChange={(val) => setFormData({ ...formData, isAvailable: val })}
                  trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                  thumbColor={formData.isAvailable ? ADMIN_PRIMARY : Colors.error}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Special Deal Highlight</Text>
                <Switch
                  value={formData.isSpecialDeal}
                  onValueChange={(val) => setFormData({ ...formData, isSpecialDeal: val })}
                  trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                  thumbColor={formData.isSpecialDeal ? ADMIN_PRIMARY : '#94A3B8'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Trending Item</Text>
                <Switch
                  value={formData.isTrending}
                  onValueChange={(val) => setFormData({ ...formData, isTrending: val })}
                  trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                  thumbColor={formData.isTrending ? ADMIN_PRIMARY : '#94A3B8'}
                />
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProduct}
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingProduct ? 'Update Product' : 'Create Product'}
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 12 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },
  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricVal: { ...Typography.heading, fontSize: 18, color: ADMIN_PRIMARY },
  metricLbl: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
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
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: '#DCFCE7', borderColor: ADMIN_PRIMARY },
  filterText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11 },
  filterTextActive: { color: ADMIN_PRIMARY, fontWeight: '700' },
  categoryScroll: { gap: 8, paddingBottom: 12 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: '#14532D', borderColor: '#14532D' },
  categoryChipText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 12 },
  categoryChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
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
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  imgContainer: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  productImg: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  catBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: { ...Typography.caption, fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  badgeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeDeal: { backgroundColor: '#FEE2E2' },
  badgeBest: { backgroundColor: '#FEF3C7' },
  badgeTagText: { ...Typography.caption, fontSize: 9, fontWeight: '700', color: '#991B1B' },
  productTitle: { ...Typography.title, fontSize: 14, color: Colors.text, marginBottom: 2 },
  unitText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceMain: { ...Typography.heading, fontSize: 16, color: ADMIN_PRIMARY },
  priceCut: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availStatusText: { ...Typography.label, fontSize: 10, letterSpacing: 0.5 },
  btnRow: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: { ...Typography.caption, color: '#4F46E5', fontWeight: '700', fontSize: 11 },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  formRow: { flexDirection: 'row' },
  modalCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  modalCatChipActive: { backgroundColor: ADMIN_PRIMARY },
  modalCatText: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary },
  modalCatTextActive: { color: '#FFFFFF', fontWeight: '700' },
  badgeSelectorRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  badgeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  badgeOptionActive: { backgroundColor: '#DCFCE7', borderColor: ADMIN_PRIMARY },
  badgeOptionText: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary },
  badgeOptionTextActive: { color: ADMIN_PRIMARY, fontWeight: '700' },
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
    backgroundColor: ADMIN_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { ...Typography.button, color: '#FFFFFF' },
});
