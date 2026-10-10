import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoritesStore, FavoriteItem } from '../../store/favorites.store';
import { useCartStore } from '../../store/cart.store';
import { Typography, BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const { addItem, cartRestaurant, clearCart } = useCartStore();

  const [activeTab, setActiveTab] = useState<'all' | 'product' | 'restaurant'>('all');

  const filtered = activeTab === 'all'
    ? favorites
    : favorites.filter((f) => f.type === activeTab);

  const handleAddToCart = (item: FavoriteItem) => {
    const mockRestaurant = {
      _id: 'ftft-kitchen-favorites',
      name: 'FataFat Favorites Kitchen',
      image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80',
      address: { street: 'Local Kitchen' },
    };

    const formattedItem = {
      _id: item._id,
      name: item.name,
      price: typeof item.price === 'string' ? parseInt(item.price) : item.price,
      description: 'Your favorite dish!',
      images: item.images || (item.image ? [item.image] : []),
      isVeg: item.isVeg !== false,
    };

    const success = addItem(formattedItem as any, mockRestaurant as any, []);
    if (!success) {
      Alert.alert(
        'Replace cart items?',
        `Your cart contains dishes from ${cartRestaurant?.name || 'another restaurant'}. Replace?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Replace',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(formattedItem as any, mockRestaurant as any, []);
            },
          },
        ]
      );
    }
  };

  const handleRemove = (item: FavoriteItem) => {
    Alert.alert('Remove Favorite', `Remove "${item.name}" from favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeFavorite(item._id),
      },
    ]);
  };

  const getTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryLight, '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Favorites</Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
            </Text>
          </View>
          {favorites.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Clear All?', 'Remove all favorites?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear All', style: 'destructive', onPress: clearFavorites },
                ])
              }
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'product', 'restaurant'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'all' ? 'All' : tab === 'product' ? '🍕 Products' : '🏪 Restaurants';
            const count =
              tab === 'all'
                ? favorites.length
                : favorites.filter((f) => f.type === tab).length;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the ♡ on any product or restaurant to save them here for quick access!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              style={styles.browseBtn}
            >
              <Text style={styles.browseBtnText}>Browse Food</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((item, idx) => (
            <View key={item._id + '-' + idx} style={styles.card}>
              {/* Image */}
              <View style={styles.cardImageWrap}>
                <Image
                  source={{
                    uri:
                      item.images?.[0] ||
                      item.image ||
                      'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80',
                  }}
                  style={styles.cardImage}
                />
                {/* Type Badge */}
                <View style={styles.typeBadge}>
                  <Ionicons
                    name={item.type === 'restaurant' ? 'storefront' : 'fast-food'}
                    size={10}
                    color="#FFF"
                  />
                  <Text style={styles.typeBadgeText}>
                    {item.type === 'restaurant' ? 'Restaurant' : 'Product'}
                  </Text>
                </View>
                {/* Veg/Non-Veg */}
                {item.type === 'product' && (
                  <View style={styles.vegBadge}>
                    <View
                      style={[
                        styles.vegSquare,
                        { borderColor: item.isVeg !== false ? '#16A34A' : '#DC2626' },
                      ]}
                    >
                      <View
                        style={[
                          styles.vegDot,
                          { backgroundColor: item.isVeg !== false ? '#16A34A' : '#DC2626' },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  {item.tag && (
                    <Text style={styles.tagLabel}>{item.tag}</Text>
                  )}
                </View>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.cuisine && (
                  <Text style={styles.cuisineText}>{item.cuisine}</Text>
                )}
                <View style={styles.cardBottom}>
                  {item.type === 'product' && (
                    <Text style={styles.priceText}>₹{item.price}</Text>
                  )}
                  {item.rating && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  )}
                  <Text style={styles.timeAgo}>{getTimeAgo(item.addedAt)}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {item.type === 'product' && (
                    <TouchableOpacity
                      onPress={() => handleAddToCart(item)}
                      style={styles.addCartBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cart-outline" size={14} color="#FFF" />
                      <Text style={styles.addCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                  {item.type === 'restaurant' && (
                    <TouchableOpacity
                      onPress={() => router.push(`/restaurant/${item._id}`)}
                      style={[styles.addCartBtn, { backgroundColor: '#0B7A75' }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="restaurant-outline" size={14} color="#FFF" />
                      <Text style={styles.addCartText}>View Menu</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleRemove(item)}
                    style={styles.removeBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="heart-dislike-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Spacer for TabBar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerGradient: { paddingBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -1,
  },
  clearBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clearText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#EF4444',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontFamily: BOLD_FONT,
    fontSize: 12,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: STYLISH_FONT,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  browseBtnText: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#FFFFFF',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageWrap: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  typeBadgeText: {
    fontFamily: BOLD_FONT,
    fontSize: 8,
    color: '#FFF',
  },
  vegBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 3,
    borderRadius: 4,
  },
  vegSquare: {
    width: 10,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  tagLabel: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardName: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  cuisineText: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priceText: {
    fontFamily: BOLD_FONT,
    fontSize: 15,
    color: Colors.primary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontFamily: BOLD_FONT,
    fontSize: 10,
    color: '#92400E',
  },
  timeAgo: {
    fontFamily: STYLISH_FONT,
    fontSize: 10,
    color: '#9CA3AF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  addCartText: {
    fontFamily: BOLD_FONT,
    fontSize: 11,
    color: '#FFFFFF',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
