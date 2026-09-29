import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GColors, GRadius, GSpacing, GShadow } from '../../constants/GroceryTheme';
import { GroceryCategory } from '../../constants/GroceryData';
import { groceryService } from '../../services/grocery.service';
import { useGroceryCartCount, useGroceryCartTotal } from '../../store/grocery.store';
import { GroceryTabBar } from './GroceryTabBar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 2 - 12) / 2;

interface GroceryAllCategoriesProps {
  onBack?: () => void;
  onSelectCategory?: (category: GroceryCategory) => void;
}

export function GroceryAllCategories({ onBack, onSelectCategory }: GroceryAllCategoriesProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cartCount = useGroceryCartCount();
  const cartTotal = useGroceryCartTotal();

  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await groceryService.getCategories();
      if (data && data.length > 0) {
        const mapped: GroceryCategory[] = data.map((c) => ({
          id: c._id || c.slug,
          _id: c._id,
          name: c.name,
          slug: c.slug,
          emoji: c.emoji || '🛒',
          image: c.image,
          bg: c.bg || '#F3F7F2',
          subtitle: c.subtitle || 'Essential daily staples',
          badge: c.badge || 'TOP OFFER',
          badgeType: c.badgeType || 'lime',
          itemCount: c.itemCount || '50+ items',
        }));
        setCategories(mapped);
      }
    } catch (_err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBadge = (badge?: string, badgeType?: string) => {
    if (!badge) return null;

    let bg = '#D4F468';
    let textColor = '#1E3D34';

    if (badgeType === 'pink') {
      bg = '#FEE2E2';
      textColor = '#DC2626';
    } else if (badgeType === 'grey') {
      bg = '#F3F4F6';
      textColor = '#4B5563';
    }

    return (
      <View style={[styles.cardBadge, { backgroundColor: bg }]}>
        <Text style={[styles.cardBadgeText, { color: textColor }]}>{badge}</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onBack ? onBack : () => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1E3D34" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>All Categories</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.7}
        >
          <Ionicons name="bag-outline" size={22} color="#1E3D34" />
          {cartCount > 0 && (
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E3D34']}
            tintColor="#1E3D34"
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories, items..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="mic-outline" size={19} color="#1E3D34" />
          </TouchableOpacity>
        </View>

        {/* Promo / Limited Deal Card */}
        <TouchableOpacity style={styles.promoCard} activeOpacity={0.9}>
          <View style={styles.promoTagCircle}>
            <Ionicons name="pricetag" size={16} color="#D4F468" />
          </View>
          <View style={styles.promoTextContent}>
            <View style={styles.promoBadgeRow}>
              <View style={styles.todayOnlyBadge}>
                <Text style={styles.todayOnlyText}>TODAY ONLY</Text>
              </View>
              <Text style={styles.limitedDealText}>Limited Deal</Text>
            </View>
            <Text style={styles.promoHeadline}>
              Flat 20% off on pantry & cooking essentials
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A7C4B8" />
        </TouchableOpacity>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Browse All Departments</Text>
          <Text style={styles.categoriesCount}>
            {filteredCategories.length} Categories
          </Text>
        </View>

        {/* 2-Column Grid */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1E3D34" />
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCategories.map((cat) => {
              const isSelected = activeCategorySlug === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.id || cat._id}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  onPress={() => {
                    const slug = cat.slug || String(cat.id);
                    setActiveCategorySlug(slug);
                    if (onSelectCategory) {
                      onSelectCategory(cat);
                    } else {
                      router.push({
                        pathname: '/grocery/category/[slug]',
                        params: { slug, name: cat.name },
                      });
                    }
                  }}
                  activeOpacity={0.85}
                >
                  {/* Top Row: Badge + Chevron */}
                  <View style={styles.cardTopRow}>
                    {renderBadge(cat.badge, cat.badgeType)}
                    <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                  </View>

                  {/* Centered Image in Oval / Circle container */}
                  <View style={[styles.imageOval, { backgroundColor: cat.bg || '#F3F7F2' }]}>
                    {cat.image ? (
                      <Image
                        source={{ uri: cat.image }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 36 }}>{cat.emoji || '🛒'}</Text>
                    )}
                  </View>

                  {/* Title & Subtitle */}
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={styles.categorySubtitle} numberOfLines={1}>
                    {cat.subtitle || 'Everyday fresh quality'}
                  </Text>

                  {/* Bottom Row: Item Count + Arrow Button */}
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.itemCountText}>{cat.itemCount || '50+ items'}</Text>
                    <View
                      style={[
                        styles.arrowCircle,
                        isSelected && { backgroundColor: '#1E3D34' },
                      ]}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={isSelected ? '#FFFFFF' : '#1E3D34'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: cartCount > 0 ? 170 : 110 }} />
      </ScrollView>

      {/* Floating Cart Bar (Matching Reference) */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCartBar, GShadow.level3]}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartCountCircle}>
            <Text style={styles.cartCountCircleText}>{cartCount}</Text>
          </View>

          <View style={styles.cartPriceInfo}>
            <Text style={styles.cartTotalLabel}>CART TOTAL</Text>
            <Text style={styles.cartTotalAmount}>${cartTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.viewCartBtn}>
            <Text style={styles.viewCartBtnText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={14} color="#1E3D34" style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Tab Bar */}
      <GroceryTabBar activeTab="categories" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF7',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#F8FAF7',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3D34',
  },
  headerCartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#D4F468',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerCartBadgeText: {
    color: '#1E3D34',
    fontSize: 9,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: GRadius.full,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    height: 46,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E3D34',
    fontWeight: '400',
  },

  // Promo Card
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162E27',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#162E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  promoTagCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 244, 104, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 244, 104, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promoTextContent: {
    flex: 1,
  },
  promoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  todayOnlyBadge: {
    backgroundColor: '#D4F468',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayOnlyText: {
    color: '#1E3D34',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  limitedDealText: {
    color: '#E5E7EB',
    fontSize: 11.5,
    fontWeight: '600',
  },
  promoHeadline: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3D34',
  },
  categoriesCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // 2-Col Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    padding: 12,
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardSelected: {
    borderColor: '#1E3D34',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 20,
  },
  cardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  imageOval: {
    width: '100%',
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: 80,
    height: 80,
  },
  categoryName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E3D34',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  itemCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3D34',
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating Cart
  floatingCartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 82 : 72,
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#162E27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 900,
    shadowColor: '#162E27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cartCountCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D4F468',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountCircleText: {
    color: '#1E3D34',
    fontSize: 14,
    fontWeight: '800',
  },
  cartPriceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartTotalLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#A7C4B8',
    letterSpacing: 0.5,
  },
  cartTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4F468',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewCartBtnText: {
    color: '#1E3D34',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
