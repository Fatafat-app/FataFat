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
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GColors, GRadius, GSpacing, GShadow } from '../../constants/GroceryTheme';
import { GroceryCategory } from '../../constants/GroceryData';
import { groceryService } from '../../services/grocery.service';
import { useGroceryCartCount, useGroceryCartTotal } from '../../store/grocery.store';
import { GroceryTabBar } from './GroceryTabBar';


const fallbackImages = [
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', // fruits
  'https://images.unsplash.com/photo-1604803932791-72f3e82cc872?w=400&q=80', // meat
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', // drinks
  'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80', // snacks
  'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80', // household
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', // dairy
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', // bakery
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80', // organic/veg
  'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=400&q=80', // bananas
  'https://images.unsplash.com/photo-1573246123716-6b1782bfc492?w=400&q=80', // spinach
  'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=400&q=80', // apples
  'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80', // broccoli
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', // tomato
  'https://images.unsplash.com/photo-1517594422361-5e18a412072f?w=400&q=80', // jam
  'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80', // onion
  'https://images.unsplash.com/photo-1563565375-f3fdfdbefa8a?w=400&q=80', // peppers
  'https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80', // bread
  'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80', // eggs
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', // potatoes
];

const getImageForName = (name) => {
  if (!name) return fallbackImages[0];
  const lower = name.toLowerCase();
  if (lower.includes('fruit') || lower.includes('berry')) return fallbackImages[0];
  if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef')) return fallbackImages[1];
  if (lower.includes('drink') || lower.includes('juice') || lower.includes('water')) return fallbackImages[2];
  if (lower.includes('snack') || lower.includes('chip') || lower.includes('biscuit')) return fallbackImages[3];
  if (lower.includes('house') || lower.includes('clean')) return fallbackImages[4];
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese')) return fallbackImages[5];
  if (lower.includes('bake') || lower.includes('bread') || lower.includes('cake')) return fallbackImages[6];
  if (lower.includes('banana')) return fallbackImages[8];
  if (lower.includes('spinach') || lower.includes('leaf')) return fallbackImages[9];
  if (lower.includes('apple')) return fallbackImages[10];
  if (lower.includes('broccoli') || lower.includes('cabbage')) return fallbackImages[11];
  if (lower.includes('tomato')) return fallbackImages[12];
  if (lower.includes('jam') || lower.includes('preserve')) return fallbackImages[13];
  if (lower.includes('onion')) return fallbackImages[14];
  if (lower.includes('pepper') || lower.includes('capsicum')) return fallbackImages[15];
  if (lower.includes('egg')) return fallbackImages[17];
  if (lower.includes('potato')) return fallbackImages[18];
  
  // deterministic fallback based on string length and first char
  const hash = (name.length + name.charCodeAt(0)) % fallbackImages.length;
  return fallbackImages[hash];
};


const LOCAL_CATEGORIES = [
  { id: '1', name: 'Fresh Vegetables', slug: 'fresh-vegetables', emoji: '🥦', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', bg: '#F0FDF4', subtitle: 'Farm fresh daily', badge: 'FRESH', badgeType: 'lime', itemCount: '50+ items' },
  { id: '2', name: 'Fresh Fruits', slug: 'fresh-fruits', emoji: '🍎', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80', bg: '#FFF7ED', subtitle: 'Seasonal & exotic', badge: 'POPULAR', badgeType: 'lime', itemCount: '40+ items' },
  { id: '3', name: 'Dairy & Eggs', slug: 'dairy-eggs', emoji: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80', bg: '#EFF6FF', subtitle: 'Daily essentials', badge: 'TOP OFFER', badgeType: 'lime', itemCount: '30+ items' },
  { id: '4', name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', emoji: '🌾', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=300&q=80', bg: '#FEF9C3', subtitle: 'Kitchen staples', badge: 'VALUE', badgeType: 'lime', itemCount: '60+ items' },
  { id: '5', name: 'Oil & Masala', slug: 'oil-masala', emoji: '🫙', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80', bg: '#FFF7ED', subtitle: 'Spices & condiments', badge: 'DEALS', badgeType: 'pink', itemCount: '80+ items' },
  { id: '6', name: 'Snacks & Drinks', slug: 'snacks-drinks', emoji: '🥤', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80', bg: '#F0F9FF', subtitle: 'Munch any time', badge: 'HOT', badgeType: 'pink', itemCount: '70+ items' },
  { id: '7', name: 'Personal Care', slug: 'personal-care', emoji: '🧴', image: 'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=300&q=80', bg: '#F9F0FF', subtitle: 'Stay fresh & clean', badge: 'NEW', badgeType: 'grey', itemCount: '45+ items' },
  { id: '8', name: 'Household Items', slug: 'household', emoji: '🧹', image: 'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=300&q=80', bg: '#F0FDF4', subtitle: 'Home & kitchen', badge: 'TOP OFFER', badgeType: 'lime', itemCount: '55+ items' },
  { id: '9', name: 'Breakfast & Bread', slug: 'breakfast-bread', emoji: '🍞', image: 'https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=300&q=80', bg: '#FFFBEB', subtitle: 'Morning essentials', badge: 'POPULAR', badgeType: 'lime', itemCount: '35+ items' },
];

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

  const [categories, setCategories] = useState<GroceryCategory[]>(LOCAL_CATEGORIES as any);
  const [loading, setLoading] = useState(false);
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
          image: (!c.image || c.image.includes('pexels')) ? getImageForName(c.name) : c.image,
          bg: c.bg || '#F3F7F2',
          subtitle: c.subtitle || 'Essential daily staples',
          badge: c.badge || 'TOP OFFER',
          badgeType: c.badgeType || 'lime',
          itemCount: c.itemCount || '50+ items',
        }));
        setCategories(mapped);
      } else {
        // Backend has no categories seeded — use local curated list
        setCategories(LOCAL_CATEGORIES as any);
      }
    } catch (_err) {
      // On error, show local categories
      setCategories(LOCAL_CATEGORIES as any);
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
                  
                  {/* Landscape Image Container */}
                  <View style={styles.imageOval}>
                    {cat.image ? (
                      <Image
                        source={{ uri: cat.image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ fontSize: 36 }}>{cat.emoji || '🛒'}</Text>
                    )}
                  </View>

                  <View style={styles.details}>
                  {/* Title & Subtitle */}
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {cat.name}
                  </Text>
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
            <Text style={styles.cartTotalAmount}>₹{cartTotal.toFixed(0)}</Text>
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
    fontFamily: BOLD_FONT,
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
    fontFamily: BOLD_FONT,
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
    fontFamily: BOLD_FONT,
    letterSpacing: 0.2,
  },
  limitedDealText: {
    color: '#E5E7EB',
    fontSize: 11.5,
    fontFamily: STYLISH_FONT,
  },
  promoHeadline: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: BOLD_FONT,
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
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
  },
  categoriesCount: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden'
  },
  categoryCardSelected: {
    borderColor: '#16A34A',
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
    fontFamily: BOLD_FONT,
    letterSpacing: 0.2,
  },
  imageOval: {
    width: '100%',
    height: 120, // Match product card height
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    padding: 10,
  },
  cardImage: {
    width: '100%',
    height: 100, // Match product image landscape height
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  details: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#1E293B',
    textAlign: 'center',
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
    fontFamily: BOLD_FONT,
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
    fontFamily: BOLD_FONT,
  },
  cartPriceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartTotalLabel: {
    fontSize: 9.5,
    fontFamily: BOLD_FONT,
    color: '#A7C4B8',
    letterSpacing: 0.5,
  },
  cartTotalAmount: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
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
    fontFamily: BOLD_FONT,
  },
});
