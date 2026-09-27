import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminService, CategoryItem } from '../../services/admin.service';
import { Typography } from '../../constants/Theme';

const PRESET_IMAGES = [
  { name: 'Pizza', url: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
  { name: 'Burger', url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
  { name: 'Biryani', url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' },
  { name: 'Paratha', url: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' },
  { name: 'Noodles', url: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  { name: 'Desserts', url: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg' },
  { name: 'Rolls', url: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg' },
  { name: 'Thali', url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg' },
  { name: 'Coffee / Tea', url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg' },
  { name: 'Ice Cream', url: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg' },
];

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formOrder, setFormOrder] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load categories:', err);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormImage(PRESET_IMAGES[0].url);
    setFormOrder((categories.length + 1).toString());
    setFormDesc('');
    setFormIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingId(cat._id);
    setFormName(cat.name);
    setFormImage(cat.image);
    setFormOrder((cat.order || 1).toString());
    setFormDesc(cat.description || '');
    setFormIsActive(cat.isActive !== false);
    setModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Please enter a category name (e.g. Pizza, Burger).');
      return;
    }
    if (!formImage.trim()) {
      Alert.alert('Validation Error', 'Please provide an image URL for the category icon.');
      return;
    }

    try {
      const orderNum = parseInt(formOrder, 10) || categories.length + 1;
      if (editingId) {
        await adminService.updateCategory(editingId, {
          name: formName.trim(),
          image: formImage.trim(),
          order: orderNum,
          description: formDesc.trim(),
          isActive: formIsActive,
        });
        Alert.alert('Success 🎉', 'Category updated successfully.');
      } else {
        await adminService.createCategory({
          name: formName.trim(),
          image: formImage.trim(),
          order: orderNum,
          description: formDesc.trim(),
          isActive: formIsActive,
        });
        Alert.alert('Success 🎉', 'New category added to "What\'s on your mind?".');
      }
      setModalVisible(false);
      loadCategories();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    Alert.alert('Delete Category', `Are you sure you want to remove "${cat.name}" from "What's on your mind?"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteCategory(cat._id);
            Alert.alert('Deleted', 'Category removed successfully.');
            loadCategories();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete category.');
          }
        },
      },
    ]);
  };

  const handleToggleActive = async (cat: CategoryItem) => {
    try {
      const newStatus = !cat.isActive;
      await adminService.updateCategory(cat._id, { isActive: newStatus });
      setCategories(categories.map((c) => (c._id === cat._id ? { ...c, isActive: newStatus } : c)));
    } catch (err) {
      Alert.alert('Error', 'Failed to update category status.');
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...categories];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Update order values 1, 2, 3...
    const updatedList = reordered.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setCategories(updatedList);

    try {
      setSavingOrder(true);
      const payload = updatedList.map((item) => ({ id: item._id, order: item.order }));
      await adminService.reorderCategories(payload);
    } catch (err) {
      console.warn('Failed to save category order:', err);
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading "What's on your mind" categories...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>"What's on your mind?"</Text>
          <Text style={styles.pageSubtitle}>Manage & arrange home food categories</Text>
        </View>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBanner}>
          <Ionicons name="reorder-three-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.infoBannerText}>
            Use ⬆️ and ⬇️ arrows to reorder which food category appears 1st, 2nd, 3rd on the Home Screen.
          </Text>
        </View>

        {savingOrder && (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color="#4F46E5" style={{ marginRight: 6 }} />
            <Text style={styles.savingText}>Saving position changes...</Text>
          </View>
        )}

        {categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="fast-food-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Categories Configured</Text>
            <Text style={styles.emptySub}>Tap "+ Add Item" to create your first food category.</Text>
          </View>
        ) : (
          categories.map((cat, idx) => (
            <View key={cat._id} style={[styles.categoryCard, !cat.isActive && styles.cardInactive]}>
              {/* Order Rank Badge */}
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{idx + 1}</Text>
              </View>

              {/* Thumbnail Image */}
              <Image source={{ uri: cat.image }} style={styles.catImage} />

              {/* Info */}
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{cat.name}</Text>
                {cat.description ? <Text style={styles.catDesc} numberOfLines={1}>{cat.description}</Text> : null}
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: cat.isActive ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.statusText, { color: cat.isActive ? '#059669' : '#DC2626' }]}>
                    {cat.isActive ? 'Active on Home' : 'Hidden'}
                  </Text>
                </View>
              </View>

              {/* Order Arrows (Up / Down) */}
              <View style={styles.reorderControls}>
                <TouchableOpacity
                  onPress={() => moveCategory(idx, 'up')}
                  disabled={idx === 0}
                  style={[styles.arrowBtn, idx === 0 && styles.arrowDisabled]}
                >
                  <Ionicons name="chevron-up" size={16} color={idx === 0 ? '#CBD5E1' : '#4F46E5'} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => moveCategory(idx, 'down')}
                  disabled={idx === categories.length - 1}
                  style={[styles.arrowBtn, idx === categories.length - 1 && styles.arrowDisabled]}
                >
                  <Ionicons name="chevron-down" size={16} color={idx === categories.length - 1 ? '#CBD5E1' : '#4F46E5'} />
                </TouchableOpacity>
              </View>

              {/* Actions (Edit / Delete) */}
              <View style={styles.actionsColumn}>
                <TouchableOpacity onPress={() => openEditModal(cat)} style={styles.editBtn}>
                  <Ionicons name="pencil" size={16} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Category' : 'Add Food Category'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <Text style={styles.modalLabel}>Category Name *</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Pizza, Biryani, Rolls, Burger"
                style={styles.modalInput}
                placeholderTextColor="#94A3B8"
              />

              {/* Position Rank */}
              <Text style={styles.modalLabel}>Display Position Number (1, 2, 3...)</Text>
              <TextInput
                value={formOrder}
                onChangeText={setFormOrder}
                keyboardType="numeric"
                placeholder="1"
                style={styles.modalInput}
                placeholderTextColor="#94A3B8"
              />

              {/* Image URL */}
              <Text style={styles.modalLabel}>Image URL *</Text>
              <TextInput
                value={formImage}
                onChangeText={setFormImage}
                placeholder="https://images.pexels.com/..."
                style={styles.modalInput}
                placeholderTextColor="#94A3B8"
              />

              {/* Preset Image Suggestions */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Or choose a popular preset icon:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {PRESET_IMAGES.map((preset, pIdx) => (
                  <TouchableOpacity
                    key={pIdx}
                    onPress={() => {
                      setFormImage(preset.url);
                      if (!formName) setFormName(preset.name);
                    }}
                    style={[styles.presetItem, formImage === preset.url && styles.presetItemActive]}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetImage} />
                    <Text style={styles.presetText}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Image Preview */}
              {formImage ? (
                <View style={styles.previewBox}>
                  <Text style={styles.previewLabel}>Icon Preview:</Text>
                  <Image source={{ uri: formImage }} style={styles.previewImage} />
                </View>
              ) : null}

              {/* Description */}
              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="e.g. Cheesy Italian Pizzas"
                style={styles.modalInput}
                placeholderTextColor="#94A3B8"
              />

              {/* Active Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Show on Home Screen</Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                  thumbColor={formIsActive ? '#4F46E5' : '#94A3B8'}
                />
              </View>

              <TouchableOpacity onPress={handleSaveCategory} style={styles.modalSubmitBtn}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalSubmitText}>{editingId ? 'Save Changes' : 'Create Category'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: '#64748B', marginTop: 12 },
  navbar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: { ...Typography.heading, fontSize: 18, color: '#1E293B' },
  pageSubtitle: { ...Typography.caption, fontSize: 11, color: '#64748B', marginTop: 1 },
  addBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { ...Typography.button, color: '#FFF', fontSize: 12 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoBannerText: { ...Typography.caption, color: '#3730A3', flex: 1, fontSize: 12 },
  savingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center' },
  savingText: { ...Typography.caption, color: '#4F46E5' },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { ...Typography.title, fontSize: 16, color: '#1E293B', marginTop: 10 },
  emptySub: { ...Typography.caption, color: '#64748B', textAlign: 'center', marginTop: 4 },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInactive: { opacity: 0.6, backgroundColor: '#F1F5F9' },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { ...Typography.button, fontSize: 11, color: '#4F46E5', fontWeight: '800' },
  catImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#F1F5F9' },
  catInfo: { flex: 1 },
  catName: { ...Typography.title, fontSize: 15, color: '#1E293B' },
  catDesc: { ...Typography.caption, fontSize: 11, color: '#64748B', marginTop: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { ...Typography.caption, fontSize: 10, fontWeight: '700' },
  reorderControls: { flexDirection: 'column', gap: 4, marginHorizontal: 8 },
  arrowBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.4 },
  actionsColumn: { flexDirection: 'column', gap: 6 },
  editBtn: { backgroundColor: '#EEF2FF', padding: 7, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#FEF2F2', padding: 7, borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { ...Typography.heading, fontSize: 18, color: '#1E293B' },
  modalLabel: { ...Typography.label, fontSize: 12, color: '#475569', marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Typography.body,
    fontSize: 14,
    color: '#1E293B',
  },
  presetScroll: { marginVertical: 6 },
  presetItem: {
    alignItems: 'center',
    marginRight: 10,
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  presetItemActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  presetImage: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
  presetText: { ...Typography.caption, fontSize: 10, color: '#1E293B' },
  previewBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 10 },
  previewLabel: { ...Typography.caption, color: '#64748B' },
  previewImage: { width: 40, height: 40, borderRadius: 20 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  switchLabel: { ...Typography.title, fontSize: 13, color: '#1E293B' },
  modalSubmitBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  modalSubmitText: { ...Typography.button, color: '#FFF', fontSize: 15 },
});
