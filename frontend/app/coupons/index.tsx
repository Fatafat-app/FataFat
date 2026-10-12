import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { couponService } from '../../services/coupon.service';
import { Coupon } from '../../types';
import { formatPaise } from '../../utils/formatters';
import { Typography, Colors } from '../../constants/Theme';

export default function CouponsOffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      const data = await couponService.getActiveCoupons();
      setCoupons(data || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoupons();
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Coupon Selected 🎉', `Coupon code "${code}" selected! You can now apply it during checkout to save.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Coupons & Offers</Text>
          <Text style={styles.headerSubtitle}>Save big on food & grocery orders</Text>
        </View>
      </View>

      {/* Search / Filter Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search coupon or discount..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCapitalize="characters"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching available offers...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {filteredCoupons.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="pricetags-outline" size={42} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Offers Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'No coupons matched your search.' : 'Check back soon for festive discounts and cashback codes!'}
              </Text>
            </View>
          ) : (
            filteredCoupons.map((coupon) => {
              const isPercent = coupon.discountType === 'percent' || coupon.discountType === 'percentage';
              const discountVal = coupon.value ?? coupon.discountValue ?? 0;
              const minVal = coupon.minOrderAmount ?? coupon.minOrderValue ?? 0;
              const maxCap = coupon.maxDiscount ?? coupon.maxDiscountAmount ?? 0;
              const isCopied = copiedCode === coupon.code;

              return (
                <View key={coupon._id} style={styles.couponCard}>
                  {/* Left Accent Strip */}
                  <View style={styles.couponLeftStrip} />

                  <View style={styles.cardInner}>
                    {/* Top Row: Tag & Copy Button */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.tagWrapper}>
                        <Ionicons name="pricetag" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                        <Text style={styles.codeText}>{coupon.code}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                        onPress={() => handleCopyCode(coupon.code)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark' : 'copy-outline'}
                          size={13}
                          color={isCopied ? '#FFF' : Colors.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextSuccess]}>
                          {isCopied ? 'COPIED' : 'COPY CODE'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Offer Title */}
                    <Text style={styles.offerTitle}>
                      {isPercent ? `Get ${discountVal}% OFF` : `Flat ${formatPaise(discountVal)} OFF`}
                    </Text>

                    {/* Description */}
                    {coupon.description ? (
                      <Text style={styles.couponDesc}>{coupon.description}</Text>
                    ) : null}

                    {/* Dashed Separator */}
                    <View style={styles.dashedDivider} />

                    {/* Bottom Meta Terms */}
                    <View style={styles.termsRow}>
                      <View style={styles.termItem}>
                        <Ionicons name="cart-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.termText}>
                          {minVal > 0 ? `Min order: ${formatPaise(minVal)}` : 'No minimum order'}
                        </Text>
                      </View>

                      {isPercent && maxCap > 0 ? (
                        <View style={styles.termItem}>
                          <Ionicons name="shield-checkmark-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.termText}>Max discount: {formatPaise(maxCap)}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Expiry / Validity */}
                    {(coupon.expiresAt || coupon.validUntil) ? (
                      <View style={styles.expiryRow}>
                        <Ionicons name="time-outline" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text style={styles.expiryText}>
                          Valid till {new Date(coupon.expiresAt || coupon.validUntil || '').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: '#64748B',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    ...Typography.body,
    marginTop: 12,
    color: '#64748B',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.subtitle,
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  couponLeftStrip: {
    width: 6,
    backgroundColor: '#16A34A',
  },
  cardInner: {
    flex: 1,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#16A34A',
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  copyBtnSuccess: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  copyBtnTextSuccess: {
    color: '#FFFFFF',
  },
  offerTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  couponDesc: {
    ...Typography.body,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 0.8,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  termText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  expiryText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
