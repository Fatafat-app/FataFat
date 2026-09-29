import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { GColors, GSpacing, GFontSize } from '../../constants/GroceryTheme';
import { GroceryCategories } from './GroceryCategories';
import { GroceryPromoBanner } from './GroceryPromoBanner';
import { GroceryFilters } from './GroceryFilters';
import { GroceryProductCard } from './GroceryProductCard';
import { GroceryFloatingCart } from './GroceryFloatingCart';
import { GroceryCategory, GroceryProduct } from '../../constants/GroceryData';
import { useGroceryStore } from '../../store/grocery.store';
import {
  groceryService,
  BackendGroceryProduct,
  BackendGroceryBanner,
} from '../../services/grocery.service';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
  );
}

function mapBackendProduct(p: BackendGroceryProduct): GroceryProduct {
  return {
    id: p._id || p.slug,
    _id: p._id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    originalPrice: p.originalPrice,
    unit: p.unit,
    image:
      p.images && p.images.length > 0
        ? p.images[0]
        : 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
    images: p.images,
    badge: p.badge || undefined,
    discount: p.discount || (p.discountPercentage ? `${p.discountPercentage}% off` : undefined),
    rating: p.rating,
  };
}

export function GroceryHome() {
  const { activeFilter, setFilter } = useGroceryStore();
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [banners, setBanners] = useState<BackendGroceryBanner[]>([]);
  const [specialDeals, setSpecialDeals] = useState<GroceryProduct[]>([]);
  const [trending, setTrending] = useState<GroceryProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Load from Live Backend
  const fetchHomeData = useCallback(async () => {
    setError(null);
    try {
      const data = await groceryService.getHomeFeed();
      if (data) {
        if (data.categories) {
          setCategories(
            data.categories.map((c) => ({
              id: c._id || c.slug,
              _id: c._id,
              name: c.name,
              slug: c.slug,
              emoji: c.emoji || '🛒',
              image: c.image,
              bg: c.bg || '#FFFFFF',
            }))
          );
        }
        if (data.banners) {
          setBanners(data.banners);
        }
        if (data.specialDeals) {
          setSpecialDeals(data.specialDeals.map(mapBackendProduct));
        }
        if (data.trending) {
          setTrending(data.trending.map(mapBackendProduct));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to grocery backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Refetch products when filter or category changes
  useEffect(() => {
    let isMounted = true;
    async function filterProducts() {
      if (!selectedCategory && activeFilter === 'popularity' && !loading) {
        return;
      }

      setLoadingFilter(true);
      try {
        const queryParams: any = {
          filter: activeFilter,
        };
        if (selectedCategory) {
          queryParams.category = selectedCategory.slug || selectedCategory.id;
        }

        const res = await groceryService.getProducts(queryParams);
        if (isMounted && res.products) {
          setTrending(res.products.map(mapBackendProduct));
        }
      } catch (_err) {
        // Handle filter error
      } finally {
        if (isMounted) setLoadingFilter(false);
      }
    }

    if (!loading) {
      filterProducts();
    }
    return () => {
      isMounted = false;
    };
  }, [activeFilter, selectedCategory, loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: GroceryCategory) => {
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GColors.primary} />
        <Text style={styles.loadingText}>Loading fresh groceries...</Text>
      </View>
    );
  }

  if (error && categories.length === 0 && specialDeals.length === 0 && trending.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchHomeData} activeOpacity={0.8}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[GColors.primary]}
            tintColor={GColors.primary}
          />
        }
      >
        {/* Categories Carousel */}
        {categories.length > 0 && (
          <GroceryCategories
            categories={categories}
            activeCategoryId={selectedCategory?.id}
            onCategoryPress={handleCategoryPress}
          />
        )}

        {/* Promo Banner */}
        {banners.length > 0 && <GroceryPromoBanner banners={banners} />}

        {/* Filters */}
        <GroceryFilters
          active={activeFilter}
          onSelect={(filter) => {
            setFilter(filter);
          }}
        />

        {/* Today's Special Deals — horizontal scroll */}
        {specialDeals.length > 0 && (
          <>
            <SectionHeader title="Today's Special Deals" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              style={styles.horizontalScrollView}
            >
              {specialDeals.map((product) => (
                <GroceryProductCard
                  key={product.id || product._id}
                  product={product}
                  style={styles.horizontalCard}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Trending in Your Area / Filtered items — 2-col grid */}
        <SectionHeader
          title={
            selectedCategory
              ? `${selectedCategory.name}`
              : activeFilter === 'deals'
              ? 'Top Deals'
              : activeFilter === 'organic'
              ? '100% Organic Essentials'
              : 'Trending in Your Area'
          }
        />

        {loadingFilter ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={GColors.primary} />
          </View>
        ) : trending.length > 0 ? (
          <View style={styles.grid}>
            {trending.map((product) => (
              <GroceryProductCard
                key={product.id || product._id}
                product={product}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found in this category.</Text>
          </View>
        )}

        {/* Bottom padding for floating cart + tab bar */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Floating Cart */}
      <GroceryFloatingCart />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    minHeight: 350,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3D34',
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1E3D34',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GSpacing.edgeMargin,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: GFontSize.headingMd,
    fontWeight: '700',
    color: GColors.textPrimary,
  },
  seeAll: {
    fontSize: GFontSize.labelLg,
    fontWeight: '600',
    color: GColors.primary,
  },

  // Horizontal deals scroll
  horizontalScrollView: {
    marginBottom: GSpacing.lg,
  },
  horizontalScroll: {
    paddingHorizontal: GSpacing.edgeMargin,
    gap: GSpacing.md,
  },
  horizontalCard: {
    width: 160,
  },

  // 2-column grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GSpacing.edgeMargin,
    gap: GSpacing.md,
    marginBottom: GSpacing.lg,
  },
  loaderContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
});
