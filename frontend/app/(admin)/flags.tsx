import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminService } from '../../services/admin.service';
import { useConfigStore } from '../../store/config.store';
import { useGroceryStore } from '../../store/grocery.store';
import { Typography, Colors } from '../../constants/Theme';

export default function AdminFeatureFlagsScreen() {
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingVertical, setUpdatingVertical] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const list = await adminService.getVerticals();
      setFlags(list || []);
    } catch (err) {
      console.warn('Could not load feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleSetVerticalMode = async (vertical: 'food' | 'grocery', mode: 'ON' | 'DRAIN' | 'OFF') => {
    Alert.alert(
      'Confirm Mode Change',
      `Are you sure you want to change ${vertical.toUpperCase()} vertical to ${mode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setUpdatingVertical(vertical);
              await adminService.setVerticalMode(vertical, {
                mode,
                reason: `Admin updated ${vertical} mode to ${mode}`,
              });
              await useConfigStore.getState().fetchBootstrap();
              if (vertical === 'grocery' && mode === 'OFF') {
                useGroceryStore.getState().setSection('food');
              } else if (vertical === 'food' && mode === 'OFF') {
                useGroceryStore.getState().setSection('grocery');
              }
              Alert.alert('Success', `${vertical.toUpperCase()} vertical mode changed to ${mode}`);
              fetchFlags();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update vertical mode');
            } finally {
              setUpdatingVertical(null);
            }
          },
        },
      ]
    );
  };

  const foodFlag = flags.find((f) => f.vertical === 'food' || f.key === 'vertical.food' || f.key === 'food') || { mode: 'ON' };
  const groceryFlag = flags.find((f) => f.vertical === 'grocery' || f.key === 'vertical.grocery' || f.key === 'grocery') || { mode: 'ON' };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>System Controls</Text>
            <Text style={styles.headerSubtitle}>Vertical Kill Switches & Flags</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchFlags} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching flag statuses...</Text>
          </View>
        ) : (
          <>
            {/* Info Banner */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={22} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>
                Changing vertical mode to DRAIN will stop accepting new orders while completing active ones. OFF immediately disables user checkout.
              </Text>
            </View>

            {/* Food Vertical Switch */}
            <View style={styles.controlCard}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.iconEmoji}>🍔</Text>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.cardTitle}>Food Delivery Vertical</Text>
                    <Text style={styles.cardSubtitle}>Current Mode: {foodFlag.mode}</Text>
                  </View>
                </View>
                {updatingVertical === 'food' && <ActivityIndicator size="small" color="#4F46E5" />}
              </View>

              <View style={styles.modeButtonGroup}>
                {(['ON', 'DRAIN', 'OFF'] as const).map((m) => {
                  const isActive = foodFlag.mode === m;
                  const btnColor = m === 'ON' ? '#16A34A' : m === 'DRAIN' ? '#D97706' : '#DC2626';
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => handleSetVerticalMode('food', m)}
                      style={[
                        styles.modeBtn,
                        isActive && { backgroundColor: btnColor, borderColor: btnColor },
                      ]}
                    >
                      <Text style={[styles.modeBtnText, isActive && styles.modeBtnTextActive]}>
                        {m === 'ON' ? '🟢 ON' : m === 'DRAIN' ? '🟡 DRAIN' : '🔴 OFF'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Grocery Vertical Switch */}
            <View style={styles.controlCard}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.iconEmoji}>🥦</Text>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.cardTitle}>Grocery Delivery Vertical</Text>
                    <Text style={styles.cardSubtitle}>Current Mode: {groceryFlag.mode}</Text>
                  </View>
                </View>
                {updatingVertical === 'grocery' && <ActivityIndicator size="small" color="#4F46E5" />}
              </View>

              <View style={styles.modeButtonGroup}>
                {(['ON', 'DRAIN', 'OFF'] as const).map((m) => {
                  const isActive = groceryFlag.mode === m;
                  const btnColor = m === 'ON' ? '#16A34A' : m === 'DRAIN' ? '#D97706' : '#DC2626';
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => handleSetVerticalMode('grocery', m)}
                      style={[
                        styles.modeBtn,
                        isActive && { backgroundColor: btnColor, borderColor: btnColor },
                      ]}
                    >
                      <Text style={[styles.modeBtnText, isActive && styles.modeBtnTextActive]}>
                        {m === 'ON' ? '🟢 ON' : m === 'DRAIN' ? '🟡 DRAIN' : '🔴 OFF'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submodule Toggles */}
            <View style={styles.controlCard}>
              <Text style={styles.cardTitle}>Subsystem Capabilities</Text>
              <Text style={styles.cardSubtitle}>Enable or pause specific background workflows</Text>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Rider Auto-Dispatch</Text>
                  <Text style={styles.toggleSubtitle}>Automated algorithmic delivery partner assignment</Text>
                </View>
                <Switch value={true} trackColor={{ false: '#CBD5E1', true: '#4F46E5' }} thumbColor="#FFFFFF" />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Online UPI / Razorpay Gateway</Text>
                  <Text style={styles.toggleSubtitle}>Accept real-time digital pre-payments</Text>
                </View>
                <Switch value={true} trackColor={{ false: '#CBD5E1', true: '#4F46E5' }} thumbColor="#FFFFFF" />
              </View>

              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Promotions & Coupons Engine</Text>
                  <Text style={styles.toggleSubtitle}>Allow users to apply discount codes at checkout</Text>
                </View>
                <Switch value={true} trackColor={{ false: '#CBD5E1', true: '#4F46E5' }} thumbColor="#FFFFFF" />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: { ...Typography.heading, fontSize: 18, color: '#0F172A' },
  headerSubtitle: { ...Typography.caption, color: '#64748B', fontSize: 11 },
  refreshBtn: { padding: 6, backgroundColor: '#EEF2FF', borderRadius: 8 },

  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { ...Typography.bodySmall, color: '#64748B', marginTop: 10 },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  infoText: { ...Typography.bodySmall, color: '#1E40AF', flex: 1, fontSize: 12, lineHeight: 18 },

  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconEmoji: { fontSize: 24 },
  cardTitle: { ...Typography.title, fontSize: 16, color: '#0F172A' },
  cardSubtitle: { ...Typography.caption, color: '#64748B', marginTop: 2, fontSize: 12 },

  modeButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: { ...Typography.button, color: '#475569', fontSize: 12 },
  modeBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleTitle: { ...Typography.subtitle, fontSize: 13, color: '#1E293B' },
  toggleSubtitle: { ...Typography.caption, color: '#64748B', fontSize: 11, marginTop: 2 },
});
