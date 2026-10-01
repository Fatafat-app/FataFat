import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../store/admin.store';
import { Coupon, CreateCouponPayload } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

const ADMIN_PRIMARY = '#4F46E5';

export default function AdminCouponsScreen() {
  const router = useRouter();
  const { coupons, isLoading, fetchCoupons, createCoupon, toggleCoupon, deleteCoupon } = useAdminStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onRefresh = async () => {
    await fetchCoupons();
  };

  const handleCreateCoupon = async () => {
    const trimmedCode = code.trim().toUpperCase();
    const val = parseFloat(discountValue);

    if (!trimmedCode) {
      Alert.alert('Validation Error', 'Please enter a coupon code.');
      return;
    }
    if (!val || val <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid discount value.');
      return;
    }
    if (discountType === 'percentage' && val > 100) {
      Alert.alert('Validation Error', 'Percentage discount cannot exceed 100%.');
      return;
    }

    try {
      setCreating(true);
      const payload: CreateCouponPayload = {
        code: trimmedCode,
        discountType,
        discountValue: discountType === 'flat' ? Math.round(val * 100) : val,
        minOrderValue: minOrderValue ? Math.round(parseFloat(minOrderValue) * 100) : 0,
        maxDiscountAmount: maxDiscountAmount ? Math.round(parseFloat(maxDiscountAmount) * 100) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
        description: description.trim() || undefined,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      };

      await createCoupon(payload);
      Alert.alert('Success 🎉', `Coupon code ${trimmedCode} created successfully!`);
      setModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setDescription('');
  };

  const handleDelete = (coupon: Coupon) => {
    Alert.alert(
      'Delete Coupon',
      `Are you sure you want to permanently delete coupon "${coupon.code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCoupon(coupon._id);
          },
        },
      ]
    );
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'active') return c.isActive;
    if (filterType === 'inactive') return !c.isActive;
    return true;
  });

  const activeCount = coupons.filter((c) => c.isActive).length;
  const inactiveCount = coupons.length - activeCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Coupons & Promo</Text>
            <Text style={styles.headerSubtitle}>Discount Codes & Campaigns</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createBtn} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={Colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>New Code</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[ADMIN_PRIMARY]} />}
      >
        {/* Metric Summary */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: ADMIN_PRIMARY, borderLeftWidth: 4 }]}>
            <Text style={styles.metricVal}>{coupons.length}</Text>
            <Text style={styles.metricLabel}>Total Codes</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#16A34A', borderLeftWidth: 4 }]}>
            <Text style={[styles.metricVal, { color: '#16A34A' }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Active Live</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#94A3B8', borderLeftWidth: 4 }]}>
            <Text style={[styles.metricVal, { color: '#64748B' }]}>{inactiveCount}</Text>
            <Text style={styles.metricLabel}>Disabled</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coupon code..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="characters"
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
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>All ({coupons.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'active' && styles.filterPillActive]}
            onPress={() => setFilterType('active')}
          >
            <Text style={[styles.filterText, filterType === 'active' && styles.filterTextActive]}>Active ({activeCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'inactive' && styles.filterPillActive]}
            onPress={() => setFilterType('inactive')}
          >
            <Text style={[styles.filterText, filterType === 'inactive' && styles.filterTextActive]}>Inactive ({inactiveCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Coupons List */}
        {isLoading && coupons.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ADMIN_PRIMARY} />
            <Text style={styles.loadingText}>Loading coupon catalog...</Text>
          </View>
        ) : filteredCoupons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pricetag-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Coupons Found</Text>
            <Text style={styles.emptySubtitle}>Tap "+ New Code" to create your first discount campaign.</Text>
          </View>
        ) : (
          filteredCoupons.map((coupon) => {
            const isPercent = coupon.discountType === 'percentage';
            return (
              <View key={coupon._id} style={styles.couponCard}>
                <View style={styles.couponTop}>
                  <View style={styles.codeContainer}>
                    <View style={styles.tagIconCircle}>
                      <Ionicons name="pricetag" size={16} color={ADMIN_PRIMARY} />
                    </View>
                    <Text style={styles.codeText}>{coupon.code}</Text>
                  </View>

                  <View style={styles.toggleRow}>
                    <Switch
                      value={coupon.isActive}
                      onValueChange={() => toggleCoupon(coupon._id)}
                      trackColor={{ false: Colors.border, true: '#C7D2FE' }}
                      thumbColor={coupon.isActive ? ADMIN_PRIMARY : '#F8FAFC'}
                    />
                    <TouchableOpacity onPress={() => handleDelete(coupon)} style={styles.trashBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {coupon.description ? (
                  <Text style={styles.couponDesc}>{coupon.description}</Text>
                ) : null}

                <View style={styles.couponDivider} />

                <View style={styles.couponBottom}>
                  <View style={styles.benefitBadge}>
                    <Ionicons name="sparkles" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                    <Text style={styles.benefitText}>
                      {isPercent ? `${coupon.discountValue}% OFF` : `${formatPaise(coupon.discountValue)} FLAT OFF`}
                    </Text>
                  </View>

                  <View style={styles.conditionsRow}>
                    {coupon.minOrderValue ? (
                      <Text style={styles.conditionText}>
                        Min Order: {formatPaise(coupon.minOrderValue)}
                      </Text>
                    ) : null}
                    {coupon.maxDiscountAmount ? (
                      <Text style={styles.conditionText}>
                        Max Cap: {formatPaise(coupon.maxDiscountAmount)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Coupon Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Promo Code</Text>
                <Text style={styles.modalSubtitle}>Configure discount offer</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Code */}
              <Text style={styles.inputLabel}>COUPON CODE *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. WELCOME50, FESTIVE20"
                placeholderTextColor={Colors.textSecondary}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                autoCapitalize="characters"
              />

              {/* Discount Type */}
              <Text style={styles.inputLabel}>DISCOUNT TYPE *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, discountType === 'percentage' && styles.typeOptionActive]}
                  onPress={() => setDiscountType('percentage')}
                >
                  <Ionicons
                    name="pie-chart"
                    size={16}
                    color={discountType === 'percentage' ? ADMIN_PRIMARY : Colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.typeOptionText, discountType === 'percentage' && styles.typeOptionTextActive]}>
                    Percentage (%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeOption, discountType === 'flat' && styles.typeOptionActive]}
                  onPress={() => setDiscountType('flat')}
                >
                  <Ionicons
                    name="cash"
                    size={16}
                    color={discountType === 'flat' ? ADMIN_PRIMARY : Colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.typeOptionText, discountType === 'flat' && styles.typeOptionTextActive]}>
                    Flat Amount (₹)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Discount Value */}
              <Text style={styles.inputLabel}>
                {discountType === 'percentage' ? 'PERCENTAGE VALUE (%) *' : 'DISCOUNT AMOUNT (₹) *'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                placeholderTextColor={Colors.textSecondary}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
              />

              {/* Min Order Value */}
              <Text style={styles.inputLabel}>MINIMUM ORDER VALUE (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 199 (0 for no minimum)"
                placeholderTextColor={Colors.textSecondary}
                value={minOrderValue}
                onChangeText={setMinOrderValue}
                keyboardType="numeric"
              />

              {/* Max Discount Cap */}
              {discountType === 'percentage' && (
                <>
                  <Text style={styles.inputLabel}>MAXIMUM DISCOUNT CAP (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 100 (Optional max limit)"
                    placeholderTextColor={Colors.textSecondary}
                    value={maxDiscountAmount}
                    onChangeText={setMaxDiscountAmount}
                    keyboardType="numeric"
                  />
                </>
              )}

              {/* Description */}
              <Text style={styles.inputLabel}>SHORT DESCRIPTION</Text>
              <TextInput
                style={[styles.modalInput, { height: 64, textAlignVertical: 'top' }]}
                placeholder="e.g. Get 20% off on all weekend food & grocery orders"
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline={true}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCoupon}
                style={[styles.submitBtn, creating && { opacity: 0.7 }]}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Publish Coupon</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { ...Typography.heading, fontSize: 18 },
  headerSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createBtnText: { ...Typography.button, color: Colors.white, fontSize: 13 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricVal: { ...Typography.heading, fontSize: 18, color: ADMIN_PRIMARY },
  metricLabel: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10, marginTop: 2 },
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
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  emptySubtitle: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  couponCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  couponTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeContainer: { flexDirection: 'row', alignItems: 'center' },
  tagIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  codeText: { ...Typography.heading, fontSize: 16, letterSpacing: 0.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trashBtn: { padding: 6 },
  couponDesc: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 8 },
  couponDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  couponBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  benefitText: { ...Typography.label, color: '#16A34A', fontSize: 11, fontWeight: '700' },
  conditionsRow: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  conditionText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 14,
  },
  modalTitle: { ...Typography.heading, fontSize: 18 },
  modalSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { paddingVertical: 16 },
  inputLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    fontSize: 14,
  },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: ADMIN_PRIMARY,
  },
  typeOptionText: { ...Typography.button, fontSize: 12, color: Colors.textSecondary },
  typeOptionTextActive: { color: ADMIN_PRIMARY, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...Typography.button, color: Colors.textSecondary },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: ADMIN_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { ...Typography.button, color: Colors.white, fontSize: 14 },
});
