import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminService, FeeConfig, CustomFeeItem } from '../../services/admin.service';
import { Typography, Colors } from '../../constants/Theme';

export default function AdminFeesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fee Form State (amounts in Rupees in UI, stored in Paise)
  const [platformFee, setPlatformFee] = useState('5');
  const [platformFeeEnabled, setPlatformFeeEnabled] = useState(true);

  const [taxPercent, setTaxPercent] = useState('5');
  const [taxEnabled, setTaxEnabled] = useState(true);

  const [baseDeliveryFee, setBaseDeliveryFee] = useState('30');
  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(true);

  const [packagingFee, setPackagingFee] = useState('10');
  const [packagingFeeEnabled, setPackagingFeeEnabled] = useState(false);

  const [surgeFee, setSurgeFee] = useState('0');
  const [surgeFeeEnabled, setSurgeFeeEnabled] = useState(false);

  const [customFees, setCustomFees] = useState<CustomFeeItem[]>([]);

  // Add Custom Fee Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState('');
  const [newFeeDesc, setNewFeeDesc] = useState('');

  const loadFeeConfig = async () => {
    try {
      setLoading(true);
      const config = await adminService.getFeeConfig();
      if (config) {
        setPlatformFee(((config.platformFee || 0) / 100).toString());
        setPlatformFeeEnabled(config.platformFeeEnabled !== false);

        setTaxPercent((config.taxPercent || 0).toString());
        setTaxEnabled(config.taxEnabled !== false);

        setBaseDeliveryFee(((config.baseDeliveryFee || 0) / 100).toString());
        setDeliveryFeeEnabled(config.deliveryFeeEnabled !== false);

        setPackagingFee(((config.packagingFee || 0) / 100).toString());
        setPackagingFeeEnabled(Boolean(config.packagingFeeEnabled));

        setSurgeFee(((config.surgeFee || 0) / 100).toString());
        setSurgeFeeEnabled(Boolean(config.surgeFeeEnabled));

        setCustomFees(config.customFees || []);
      }
    } catch (err: any) {
      console.warn('Could not load fee configuration:', err);
      Alert.alert('Notice', 'Using default fee configuration template.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeConfig();
  }, []);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload: Partial<FeeConfig> = {
        platformFee: Math.round((parseFloat(platformFee) || 0) * 100),
        platformFeeEnabled,

        taxPercent: Math.max(0, Math.min(100, parseFloat(taxPercent) || 0)),
        taxEnabled,

        baseDeliveryFee: Math.round((parseFloat(baseDeliveryFee) || 0) * 100),
        deliveryFeeEnabled,

        packagingFee: Math.round((parseFloat(packagingFee) || 0) * 100),
        packagingFeeEnabled,

        surgeFee: Math.round((parseFloat(surgeFee) || 0) * 100),
        surgeFeeEnabled,

        customFees: customFees.map((f) => ({
          name: f.name,
          amount: f.amount,
          isEnabled: f.isEnabled,
          description: f.description,
        })),
      };

      await adminService.updateFeeConfig(payload);
      Alert.alert('Fees Updated 🎉', 'Platform fee and tax settings applied successfully across the platform.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update fee configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomFee = () => {
    if (!newFeeName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for the fee.');
      return;
    }
    const amtRupees = parseFloat(newFeeAmount) || 0;
    if (amtRupees <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid fee amount.');
      return;
    }

    const newFee: CustomFeeItem = {
      name: newFeeName.trim(),
      amount: Math.round(amtRupees * 100),
      isEnabled: true,
      description: newFeeDesc.trim(),
    };

    setCustomFees([...customFees, newFee]);
    setNewFeeName('');
    setNewFeeAmount('');
    setNewFeeDesc('');
    setModalVisible(false);
  };

  const toggleCustomFee = (index: number) => {
    const updated = [...customFees];
    updated[index].isEnabled = !updated[index].isEnabled;
    setCustomFees(updated);
  };

  const removeCustomFee = (index: number) => {
    Alert.alert('Remove Fee', `Are you sure you want to remove "${customFees[index].name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setCustomFees(customFees.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading fee configurations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Fee & Tax Engine</Text>
            <Text style={styles.pageSubtitle}>Platform Charges, GST & Surge</Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadFeeConfig} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Platform Fee */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Platform Fee</Text>
                <Text style={styles.cardSub}>Charged per order for platform maintenance</Text>
              </View>
            </View>
            <Switch
              value={platformFeeEnabled}
              onValueChange={setPlatformFeeEnabled}
              trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
              thumbColor={platformFeeEnabled ? '#4F46E5' : '#94A3B8'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              value={platformFee}
              onChangeText={setPlatformFee}
              keyboardType="numeric"
              style={styles.textInput}
              placeholder="5"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.inputSuffix}>per order</Text>
          </View>
        </View>

        {/* GST & Taxes */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="receipt-outline" size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.cardTitle}>GST & Taxes</Text>
                <Text style={styles.cardSub}>Applied on food items subtotal</Text>
              </View>
            </View>
            <Switch
              value={taxEnabled}
              onValueChange={setTaxEnabled}
              trackColor={{ false: '#E2E8F0', true: '#FDE68A' }}
              thumbColor={taxEnabled ? '#D97706' : '#94A3B8'}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              value={taxPercent}
              onChangeText={setTaxPercent}
              keyboardType="numeric"
              style={styles.textInput}
              placeholder="5"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.inputSuffix}>% of subtotal</Text>
          </View>
        </View>

        {/* Base Delivery Fee */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="bicycle-outline" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Base Delivery Fee</Text>
                <Text style={styles.cardSub}>Standard delivery charge for orders</Text>
              </View>
            </View>
            <Switch
              value={deliveryFeeEnabled}
              onValueChange={setDeliveryFeeEnabled}
              trackColor={{ false: '#E2E8F0', true: '#A7F3D0' }}
              thumbColor={deliveryFeeEnabled ? '#059669' : '#94A3B8'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              value={baseDeliveryFee}
              onChangeText={setBaseDeliveryFee}
              keyboardType="numeric"
              style={styles.textInput}
              placeholder="30"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.inputSuffix}>per delivery</Text>
          </View>
        </View>

        {/* Packaging / Handling Fee */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="cube-outline" size={20} color="#DB2777" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Packaging / Handling Fee</Text>
                <Text style={styles.cardSub}>Restaurant packaging charge</Text>
              </View>
            </View>
            <Switch
              value={packagingFeeEnabled}
              onValueChange={setPackagingFeeEnabled}
              trackColor={{ false: '#E2E8F0', true: '#FBCFE8' }}
              thumbColor={packagingFeeEnabled ? '#DB2777' : '#94A3B8'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              value={packagingFee}
              onChangeText={setPackagingFee}
              keyboardType="numeric"
              style={styles.textInput}
              placeholder="10"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.inputSuffix}>per order</Text>
          </View>
        </View>

        {/* Surge / Rain / Rush Hour Fee */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="thunderstorm-outline" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Surge / Bad Weather Fee</Text>
                <Text style={styles.cardSub}>Peak hour or weather surcharge</Text>
              </View>
            </View>
            <Switch
              value={surgeFeeEnabled}
              onValueChange={setSurgeFeeEnabled}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={surgeFeeEnabled ? '#2563EB' : '#94A3B8'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              value={surgeFee}
              onChangeText={setSurgeFee}
              keyboardType="numeric"
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.inputSuffix}>surcharge</Text>
          </View>
        </View>

        {/* Custom / Additional Fees Section */}
        <View style={styles.card}>
          <View style={styles.customFeesHeader}>
            <View>
              <Text style={styles.cardTitle}>Custom Additional Fees</Text>
              <Text style={styles.cardSub}>Create unique charges (e.g. Late night fee)</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addCustomBtn}>
              <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.addCustomBtnText}>Add Fee</Text>
            </TouchableOpacity>
          </View>

          {customFees.length === 0 ? (
            <View style={styles.emptyCustomBox}>
              <Ionicons name="pricetag-outline" size={24} color="#94A3B8" />
              <Text style={styles.emptyCustomText}>No custom fees added yet.</Text>
            </View>
          ) : (
            customFees.map((fee, idx) => (
              <View key={idx} style={styles.customFeeRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.customFeeName}>{fee.name}</Text>
                  {fee.description ? (
                    <Text style={styles.customFeeDesc}>{fee.description}</Text>
                  ) : null}
                  <Text style={styles.customFeePrice}>₹{(fee.amount / 100).toFixed(2)}</Text>
                </View>

                <View style={styles.customFeeActions}>
                  <Switch
                    value={fee.isEnabled}
                    onValueChange={() => toggleCustomFee(idx)}
                    trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                    thumbColor={fee.isEnabled ? '#4F46E5' : '#94A3B8'}
                  />
                  <TouchableOpacity
                    onPress={() => removeCustomFee(idx)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Save Button Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleSaveAll}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.8 }]}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.saveBtnInner}>
              <Ionicons name="checkmark-done" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save & Apply Fee Changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal to Add Custom Fee */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Fee</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Fee Title</Text>
            <TextInput
              value={newFeeName}
              onChangeText={setNewFeeName}
              placeholder="e.g. Late Night Convenience Fee"
              style={styles.modalInput}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalLabel}>Amount (₹)</Text>
            <TextInput
              value={newFeeAmount}
              onChangeText={setNewFeeAmount}
              keyboardType="numeric"
              placeholder="e.g. 15"
              style={styles.modalInput}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalLabel}>Description (Optional)</Text>
            <TextInput
              value={newFeeDesc}
              onChangeText={setNewFeeDesc}
              placeholder="e.g. Applied for orders placed after 11 PM"
              style={styles.modalInput}
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity onPress={handleAddCustomFee} style={styles.modalSubmitBtn}>
              <Text style={styles.modalSubmitText}>Add to List</Text>
            </TouchableOpacity>
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
  pageTitle: { ...Typography.heading, fontSize: 19, color: '#1E293B' },
  pageSubtitle: { ...Typography.caption, fontSize: 12, color: '#64748B', marginTop: 1 },
  refreshBtn: { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 10 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: { ...Typography.title, fontSize: 15, color: '#1E293B' },
  cardSub: { ...Typography.caption, fontSize: 11, color: '#64748B', marginTop: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  currencySymbol: { ...Typography.heading, fontSize: 18, color: '#4F46E5', marginRight: 6 },
  textInput: {
    flex: 1,
    ...Typography.heading,
    fontSize: 17,
    color: '#1E293B',
    paddingVertical: 4,
  },
  inputSuffix: { ...Typography.caption, fontSize: 12, color: '#64748B', marginLeft: 8 },
  customFeesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCustomBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addCustomBtnText: { ...Typography.button, color: '#FFF', fontSize: 12 },
  emptyCustomBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCustomText: { ...Typography.caption, color: '#94A3B8', marginTop: 6 },
  customFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customFeeName: { ...Typography.title, fontSize: 14, color: '#1E293B' },
  customFeeDesc: { ...Typography.caption, fontSize: 11, color: '#64748B', marginTop: 1 },
  customFeePrice: { ...Typography.heading, fontSize: 14, color: '#4F46E5', marginTop: 2 },
  customFeeActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: { padding: 4 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center' },
  saveBtnText: { ...Typography.button, color: '#FFF', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { ...Typography.heading, fontSize: 18, color: '#1E293B' },
  modalLabel: { ...Typography.label, fontSize: 12, color: '#475569', marginTop: 12, marginBottom: 6 },
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
  modalSubmitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitText: { ...Typography.button, color: '#FFF', fontSize: 15 },
});
