import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerStore } from '../../store/owner.store';
import { formatPaise } from '../../utils/formatters';
import { MenuItem } from '../../types';

export default function OwnerMenuScreen() {
  const { restaurant, menuCategories, isLoading, fetchOwnerData, toggleItemStock, addNewDish } =
    useOwnerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Dish Form State
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishPrepTime, setDishPrepTime] = useState('20');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const handleCreateDish = async () => {
    if (!dishName.trim()) {
      Alert.alert('Validation', 'Please enter dish name');
      return;
    }
    const priceNum = parseFloat(dishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation', 'Please enter a valid price');
      return;
    }

    try {
      setSubmitting(true);
      await addNewDish({
        name: dishName.trim(),
        category: dishCategory.trim(),
        price: Math.round(priceNum * 100), // convert ₹ to paise
        description: dishDesc.trim() || undefined,
        isVeg: dishIsVeg,
        preparationTime: parseInt(dishPrepTime, 10) || 20,
        images: dishImageUrl.trim()
          ? [dishImageUrl.trim()]
          : ['https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg'],
      });

      Alert.alert('Success 🎉', 'New dish added to menu successfully!');
      setIsModalOpen(false);
      // Reset Form
      setDishName('');
      setDishPrice('');
      setDishDesc('');
      setDishImageUrl('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not add dish');
    } finally {
      setSubmitting(false);
    }
  };

  const allItems: MenuItem[] = menuCategories.flatMap((c) => c.items);
  const categoriesList = ['ALL', ...menuCategories.map((c) => c.category)];

  const filteredItems = allItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Menu & Stock</Text>
          <Text style={styles.pageSubtitle}>{restaurant?.name || 'Inventory'}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={styles.addDishHeaderBtn}
        >
          <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.addDishHeaderText}>Add Dish</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search menu dishes..."
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
          {categoriesList.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="fast-food-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Dishes Found</Text>
            <Text style={styles.emptySubtitle}>Try clearing search or add a new menu dish.</Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = item.isAvailable ?? true;

            return (
              <View
                key={item._id}
                style={[
                  styles.itemCard,
                  !isAvailable && styles.itemCardOutOfStock,
                ]}
              >
                <Image
                  source={{
                    uri:
                      item.images?.[0] ||
                      'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
                  }}
                  style={styles.itemImage}
                />

                <View style={styles.itemInfo}>
                  <View style={styles.vegRow}>
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
                    <Text style={styles.categoryTag}>{item.category || 'Dish'}</Text>
                  </View>

                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatPaise(item.price)}</Text>
                </View>

                {/* In Stock / Out of Stock Toggle */}
                <View style={styles.stockControl}>
                  <Text
                    style={[
                      styles.stockStatusLabel,
                      { color: isAvailable ? '#15803D' : '#DC2626' },
                    ]}
                  >
                    {isAvailable ? 'IN STOCK' : 'SOLD OUT'}
                  </Text>
                  <Switch
                    value={isAvailable}
                    onValueChange={(val) => toggleItemStock(item._id, val)}
                    trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
                    thumbColor={isAvailable ? '#16A34A' : '#DC2626'}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add New Dish Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Dish</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Dish Name *</Text>
              <TextInput
                value={dishName}
                onChangeText={setDishName}
                placeholder="e.g. Paneer Butter Masala"
                style={styles.inputField}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                value={dishCategory}
                onChangeText={setDishCategory}
                placeholder="e.g. Starters, Main Course, Pizza"
                style={styles.inputField}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Price in Rupees (₹) *</Text>
              <TextInput
                value={dishPrice}
                onChangeText={setDishPrice}
                placeholder="e.g. 249"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                value={dishDesc}
                onChangeText={setDishDesc}
                placeholder="Fresh ingredients, creamy gravy..."
                multiline
                numberOfLines={2}
                style={[styles.inputField, { height: 60 }]}
                placeholderTextColor="#9CA3AF"
              />

              {/* Veg / Non-Veg Selector */}
              <Text style={styles.inputLabel}>Food Type</Text>
              <View style={styles.vegSelectRow}>
                <TouchableOpacity
                  onPress={() => setDishIsVeg(true)}
                  style={[styles.typeOption, dishIsVeg && styles.typeOptionActiveGreen]}
                >
                  <View style={[styles.vegSquare, { borderColor: '#16A34A' }]}>
                    <View style={[styles.vegDot, { backgroundColor: '#16A34A' }]} />
                  </View>
                  <Text style={[styles.typeText, dishIsVeg && { color: '#15803D', fontWeight: '800' }]}>
                    Vegetarian
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDishIsVeg(false)}
                  style={[styles.typeOption, !dishIsVeg && styles.typeOptionActiveRed]}
                >
                  <View style={[styles.vegSquare, { borderColor: '#DC2626' }]}>
                    <View style={[styles.vegDot, { backgroundColor: '#DC2626' }]} />
                  </View>
                  <Text style={[styles.typeText, !dishIsVeg && { color: '#B91C1C', fontWeight: '800' }]}>
                    Non-Veg
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Image URL (Optional)</Text>
              <TextInput
                value={dishImageUrl}
                onChangeText={setDishImageUrl}
                placeholder="https://images.pexels.com/..."
                style={styles.inputField}
                placeholderTextColor="#9CA3AF"
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreateDish}
                disabled={submitting}
                style={styles.submitDishBtn}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitDishText}>Add Dish to Menu</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  addDishHeaderBtn: {
    backgroundColor: '#FF6000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addDishHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  categoryScrollContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  categoryPillsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: '#FF6000',
    borderColor: '#FF6000',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardOutOfStock: {
    opacity: 0.65,
    backgroundColor: '#F9FAFB',
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  vegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  vegSquare: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  categoryTag: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FF6000',
    marginTop: 2,
  },
  stockControl: {
    alignItems: 'center',
  },
  stockStatusLabel: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  formScroll: {
    paddingVertical: 14,
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 10,
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  vegSelectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeOptionActiveGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  typeOptionActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 6,
  },
  submitDishBtn: {
    backgroundColor: '#FF6000',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitDishText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
