import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  useAdminMasterListQuery,
  useAdminCreateMasterMutation,
  useAdminUpdateMasterMutation,
  useAdminDeleteMasterMutation,
} from '../../hooks';
import { Typography, Colors } from '../../constants/Theme';
import { MasterItem } from '../../services/master.service';

type MasterType = 'cuisines' | 'dietary-types' | 'categories' | 'cancellation-reasons';

const TABS: { type: MasterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'cuisines', label: 'Cuisines', icon: 'restaurant-outline' },
  { type: 'dietary-types', label: 'Dietary Types', icon: 'leaf-outline' },
  { type: 'categories', label: 'Categories', icon: 'grid-outline' },
  { type: 'cancellation-reasons', label: 'Cancel Reasons', icon: 'close-circle-outline' },
];

const PRESET_CUISINE_IMAGES = [
  { name: 'North Indian', url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg' },
  { name: 'South Indian', url: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg' },
  { name: 'Biryani', url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' },
  { name: 'Pizza', url: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
  { name: 'Burgers', url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
  { name: 'Chinese', url: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  { name: 'Desserts', url: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg' },
  { name: 'Beverages', url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg' },
];

export default function MasterDataScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<MasterType>('cuisines');
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query
  const { data: items = [], isLoading, refetch } = useAdminMasterListQuery(selectedType);
  const createMutation = useAdminCreateMasterMutation(selectedType);
  const updateMutation = useAdminUpdateMasterMutation(selectedType);
  const deleteMutation = useAdminDeleteMasterMutation(selectedType);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconUrl, setFormIconUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState('1');
  // Extra fields
  const [formColorCode, setFormColorCode] = useState('#059669');
  const [formRole, setFormRole] = useState<'customer' | 'restaurant' | 'rider' | 'admin'>('customer');

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormIconUrl(selectedType === 'cuisines' ? PRESET_CUISINE_IMAGES[0].url : '');
    setFormIsActive(true);
    setFormSortOrder((items.length + 1).toString());
    setFormColorCode('#059669');
    setFormRole('customer');
    setModalVisible(true);
  };

  const openEditModal = (item: MasterItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.code);
    setFormDescription(item.description || '');
    setFormIconUrl(item.iconUrl || (item as any).coverImage || (item as any).image || '');
    setFormIsActive(item.isActive !== false);
    setFormSortOrder((item.sortOrder || 1).toString());
    setFormColorCode((item as any).colorCode || '#059669');
    setFormRole((item as any).role || 'customer');
    setModalVisible(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    // If creating new, auto-suggest code
    if (!editingItem) {
      const suggestedCode = val
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
      setFormCode(suggestedCode);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Display name is required.');
      return;
    }
    if (!formCode.trim()) {
      Alert.alert('Validation Error', 'Master code is required (e.g. NORTH_INDIAN).');
      return;
    }

    const payload: any = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      iconUrl: formIconUrl.trim(),
      isActive: formIsActive,
      sortOrder: parseInt(formSortOrder, 10) || 0,
    };

    if (selectedType === 'cuisines') {
      payload.coverImage = formIconUrl.trim();
    }
    if (selectedType === 'dietary-types') {
      payload.colorCode = formColorCode;
    }
    if (selectedType === 'cancellation-reasons') {
      payload.role = formRole;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem._id, payload });
        Alert.alert('Success', 'Master record updated successfully.');
      } else {
        await createMutation.mutateAsync(payload);
        Alert.alert('Success', 'Master record created successfully.');
      }
      setModalVisible(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = (item: MasterItem) => {
    Alert.alert(
      'Delete Master Record',
      `Are you sure you want to delete "${item.name}" (${item.code})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(item._id);
              Alert.alert('Success', 'Record deleted successfully.');
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Could not delete';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (item: MasterItem, val: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: item._id, payload: { isActive: val } });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to toggle status');
    }
  };

  // Filter items by search
  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.code.toLowerCase().includes(q) ||
      (it.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Master Data Hub</Text>
            <Text style={styles.headerSubtitle}>Centralized Reference Architecture</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const isActive = selectedType === tab.type;
            return (
              <TouchableOpacity
                key={tab.type}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  setSelectedType(tab.type);
                  setSearchQuery('');
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? Colors.primary : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Add Action Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${selectedType.replace('-', ' ')}...`}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading master records...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="layers-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery ? `No items matched "${searchQuery}"` : 'Get started by creating your first master record.'}
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={openAddModal}>
              <Text style={styles.emptyActionText}>+ Create Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => {
            const img = item.iconUrl || (item as any).coverImage || (item as any).image;
            const colorCode = (item as any).colorCode;
            const role = (item as any).role;

            return (
              <View key={item._id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.itemThumb} />
                  ) : colorCode ? (
                    <View style={[styles.colorSquare, { backgroundColor: colorCode }]}>
                      <Ionicons name="leaf" size={16} color="#FFF" />
                    </View>
                  ) : (
                    <View style={styles.defaultThumb}>
                      <Ionicons name="cube-outline" size={18} color="#64748B" />
                    </View>
                  )}

                  <View style={styles.itemInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{item.code}</Text>
                      </View>
                    </View>

                    {item.description ? (
                      <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                    ) : null}

                    <View style={styles.tagRow}>
                      {role && (
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>Role: {role}</Text>
                        </View>
                      )}
                      <Text style={styles.orderLabel}>Order: #{item.sortOrder || 0}</Text>
                    </View>
                  </View>

                  <View style={styles.switchWrap}>
                    <Switch
                      value={item.isActive}
                      onValueChange={(val) => handleToggleActive(item, val)}
                      trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                      thumbColor={item.isActive ? Colors.primary : '#F1F5F9'}
                    />
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.itemFooter}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={14} color={Colors.primary} />
                    <Text style={styles.actionBtnEditText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDelete(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={styles.actionBtnDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>
              {editingItem ? `Edit ${selectedType.replace('-', ' ')}` : `New ${selectedType.replace('-', ' ')}`}
            </Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Display Name */}
              <Text style={styles.fieldLabel}>Display Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. North Indian, Vegan, Out of Stock"
                value={formName}
                onChangeText={handleNameChange}
              />

              {/* Master Code */}
              <Text style={styles.fieldLabel}>Business Code (Unique) *</Text>
              <TextInput
                style={[styles.modalInput, { fontFamily: 'monospace' }]}
                placeholder="e.g. NORTH_INDIAN, VEGAN"
                value={formCode}
                onChangeText={(t) => setFormCode(t.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                autoCapitalize="characters"
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                placeholder="Brief summary..."
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />

              {/* Type specific: Image URL for cuisines / categories */}
              {(selectedType === 'cuisines' || selectedType === 'categories') && (
                <>
                  <Text style={styles.fieldLabel}>Image / Icon URL</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="https://images.pexels.com/..."
                    value={formIconUrl}
                    onChangeText={setFormIconUrl}
                  />

                  {/* Quick Preset Selector for Cuisines */}
                  {selectedType === 'cuisines' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      {PRESET_CUISINE_IMAGES.map((preset) => (
                        <TouchableOpacity
                          key={preset.name}
                          style={styles.presetChip}
                          onPress={() => setFormIconUrl(preset.url)}
                        >
                          <Image source={{ uri: preset.url }} style={styles.presetThumb} />
                          <Text style={styles.presetText}>{preset.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {/* Type specific: Role picker for cancellation reasons */}
              {selectedType === 'cancellation-reasons' && (
                <>
                  <Text style={styles.fieldLabel}>Target Role Context</Text>
                  <View style={styles.rolePickerRow}>
                    {(['customer', 'restaurant', 'rider', 'admin'] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleChip, formRole === r && styles.roleChipActive]}
                        onPress={() => setFormRole(r)}
                      >
                        <Text style={[styles.roleChipText, formRole === r && styles.roleChipTextActive]}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Type specific: Color code for Dietary Types */}
              {selectedType === 'dietary-types' && (
                <>
                  <Text style={styles.fieldLabel}>Color Hex Code</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="#059669 (Green), #DC2626 (Red)"
                    value={formColorCode}
                    onChangeText={setFormColorCode}
                  />
                </>
              )}

              {/* Sort Order */}
              <Text style={styles.fieldLabel}>Sort Sequence Order</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="1"
                keyboardType="numeric"
                value={formSortOrder}
                onChangeText={setFormSortOrder}
              />

              {/* Active Toggle */}
              <View style={styles.activeRow}>
                <Text style={styles.activeLabel}>Active (Available in system)</Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                  thumbColor={formIsActive ? Colors.primary : '#F1F5F9'}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingItem ? 'Save Changes' : 'Create Record'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { ...Typography.heading, fontSize: 18, color: Colors.text },
  headerSubtitle: { ...Typography.caption, color: '#94A3B8', fontSize: 11, marginTop: 1 },
  refreshButton: {
    padding: 8,
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },

  // Tabs
  tabsContainer: { backgroundColor: '#FFFFFF', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabsScroll: { paddingHorizontal: 16, gap: 8 },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: { backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4' },
  tabText: { ...Typography.subtitle, fontSize: 12, color: '#64748B' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  // Controls
  controlsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, marginLeft: 6, ...Typography.body, fontSize: 13, paddingVertical: 6, color: Colors.text },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: { ...Typography.button, color: '#FFFFFF', fontSize: 12 },

  // List
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { ...Typography.caption, color: '#94A3B8', marginTop: 10 },
  emptyCard: { backgroundColor: '#FFFFFF', padding: 36, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyTitle: { ...Typography.heading, fontSize: 16, color: Colors.text, marginTop: 10 },
  emptyDesc: { ...Typography.bodySmall, color: '#94A3B8', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  emptyActionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  emptyActionText: { ...Typography.button, color: '#FFF', fontSize: 12 },

  // Card
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F1F5F9', marginRight: 12 },
  defaultThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  colorSquare: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemInfo: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  itemName: { ...Typography.title, fontSize: 14, color: Colors.text },
  codeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  codeBadgeText: { fontFamily: 'monospace', fontSize: 10, color: '#475569', fontWeight: '700' },
  itemDesc: { ...Typography.caption, color: '#94A3B8', fontSize: 11, marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { ...Typography.caption, color: '#D97706', fontSize: 9, fontWeight: '700' },
  orderLabel: { ...Typography.caption, color: '#94A3B8', fontSize: 10 },
  switchWrap: { marginLeft: 'auto' },

  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 10,
    paddingTop: 8,
  },
  actionBtnEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F0FDFA' },
  actionBtnEditText: { ...Typography.button, color: Colors.primary, fontSize: 11 },
  actionBtnDelete: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FEF2F2' },
  actionBtnDeleteText: { ...Typography.button, color: '#EF4444', fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 14 },
  modalTitle: { ...Typography.heading, fontSize: 18, color: Colors.text, marginBottom: 16 },
  fieldLabel: { ...Typography.subtitle, fontSize: 12, color: '#475569', marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 12,
  },
  presetChip: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, paddingRight: 8, borderRadius: 8, backgroundColor: '#F1F5F9', marginRight: 8 },
  presetThumb: { width: 22, height: 22, borderRadius: 4 },
  presetText: { ...Typography.caption, fontSize: 10, color: '#475569' },
  rolePickerRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleChip: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' },
  roleChipActive: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
  roleChipText: { ...Typography.caption, fontSize: 11, color: '#64748B' },
  roleChipTextActive: { color: Colors.primary, fontWeight: '700' },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  activeLabel: { ...Typography.subtitle, fontSize: 13, color: Colors.text },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText: { ...Typography.button, color: '#64748B', fontSize: 13 },
  submitBtn: { flex: 2, paddingVertical: 11, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  submitBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 13 },
});
