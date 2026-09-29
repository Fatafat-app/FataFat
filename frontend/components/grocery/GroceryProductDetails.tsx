import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GColors, GRadius, GSpacing, GShadow } from '../../constants/GroceryTheme';
import { GroceryProduct } from '../../constants/GroceryData';
import { groceryService, BackendGroceryProduct } from '../../services/grocery.service';
import { useGroceryStore } from '../../store/grocery.store';

const { width } = Dimensions.get('window');

export function GroceryProductDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ idOrSlug?: string; slug?: string }>();

  const productIdOrSlug = params.idOrSlug || params.slug || 'fresh-salmon-fillet';

  const { addToCart, incrementQty, decrementQty, toggleWishlist, wishlist, cart } = useGroceryStore();

  const [product, setProduct] = useState<BackendGroceryProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<GroceryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [localQty, setLocalQty] = useState(1);

  const fetchProductData = useCallback(async () => {
    try {
      const [prod, allProdsRes] = await Promise.all([
        groceryService.getProduct(productIdOrSlug),
        groceryService.getProducts({ limit: 4 }),
      ]);

      if (prod) {
        setProduct(prod);
      }

      if (allProdsRes && allProdsRes.products) {
        const otherProds = allProdsRes.products
          .filter((p) => p.slug !== productIdOrSlug && p._id !== productIdOrSlug)
          .slice(0, 2)
          .map((p) => ({
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
                : 'https://images.pexels.com/photos/1414110/pexels-photo-1414110.jpeg?auto=compress&cs=tinysrgb&w=300',
            rating: p.rating,
          }));
        setRelatedProducts(otherProds);
      }
    } catch (_err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [productIdOrSlug]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const prodId = product?._id || product?.slug || productIdOrSlug;
  const cartItem = cart.find((i) => (i.product._id || i.product.id) === prodId);
  const qty = cartItem?.quantity ?? localQty;

  const handleIncrement = () => {
    if (cartItem) {
      incrementQty(prodId);
    } else {
      setLocalQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      decrementQty(prodId);
    } else {
      setLocalQty((prev) => (prev > 1 ? prev - 1 : 1));
    }
  };

  const handleAddToCart = () => {
    if (product) {
      const groceryProd: GroceryProduct = {
        id: product._id || product.slug,
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        unit: product.unit,
        image: product.images?.[0] || 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=800',
        rating: product.rating,
      };

      for (let i = 0; i < (cartItem ? 1 : localQty); i++) {
        addToCart(groceryProd);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3D34" />
      </View>
    );
  }

  const name = product?.name || 'Fresh Salmon Fillet';
  const price = product?.price ?? 2.4;
  const unit = product?.unit || '/pack';
  const weightInfo = product?.weightInfo || 'Approx. 200g - 250g | Wild Caught';
  const estimatedDelivery = product?.estimatedDelivery || 'Today 5–6PM';
  const rating = product?.rating || 4.9;
  const ratingCount = product?.ratingCount || 128;
  const description =
    product?.description ||
    'Rich in protein and omega-3, this premium cut is not only nutritious but also delicious. Perfect for grilling, pan-searing, or baking with herbs and citrus.';
  const mainImage =
    product?.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=800';

  const highlights = product?.highlights && product.highlights.length > 0
    ? product.highlights
    : [
        { label: 'High protein', type: 'lime', icon: 'barbell-outline' },
        { label: 'Omega-3 rich', type: 'blue', icon: 'water-outline' },
        { label: 'Organic', type: 'grey', icon: 'leaf-outline' },
      ];

  const totalItemPrice = price * qty;

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1E3D34" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Product Details</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setIsBookmarked((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color="#1E3D34"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Main Product Image Container */}
        <View style={styles.imageCard}>
          <Image source={{ uri: mainImage }} style={styles.productImage} resizeMode="cover" />

          {/* Rating Badge on top right of image */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} ({ratingCount})
            </Text>
          </View>
        </View>

        {/* Title, Subtitle, Price & Unit */}
        <View style={styles.titlePriceRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.productTitle}>{name}</Text>
            <Text style={styles.weightSubtitle}>{weightInfo}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.priceText}>${price.toFixed(2)}</Text>
            <Text style={styles.unitText}>{unit}</Text>
          </View>
        </View>

        {/* Estimated Delivery Pill */}
        <View style={styles.deliveryPill}>
          <Ionicons name="bus-outline" size={16} color="#1E3D34" style={{ marginRight: 8 }} />
          <Text style={styles.deliveryLabel}>Estimated delivery: </Text>
          <Text style={styles.deliveryValue}>{estimatedDelivery}</Text>
        </View>

        {/* Highlight Feature Badges */}
        <View style={styles.highlightsRow}>
          {highlights.map((h, i) => {
            let bg = '#F3F4F6';
            let border = '#E5E7EB';
            let textColor = '#1E3D34';
            let iconColor = '#1E3D34';

            if (h.type === 'lime') {
              bg = '#D4F468';
              border = '#D4F468';
              textColor = '#1E3D34';
              iconColor = '#1E3D34';
            } else if (h.type === 'blue') {
              bg = '#E0F2FE';
              border = '#BAE6FD';
              textColor = '#0284C7';
              iconColor = '#0284C7';
            }

            return (
              <View key={i} style={[styles.highlightChip, { backgroundColor: bg, borderColor: border }]}>
                <Ionicons
                  name={(h.icon || 'checkmark-circle-outline') as any}
                  size={14}
                  color={iconColor}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.highlightText, { color: textColor }]}>{h.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Description Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descriptionBody}>{description}</Text>
        </View>

        {/* Related Products Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.relatedHeaderRow}>
            <Text style={styles.sectionHeading}>Related products</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.relatedGrid}>
            {relatedProducts.map((rel) => {
              const relProdId = rel._id || rel.id;
              return (
                <View key={relProdId} style={styles.relatedCard}>
                  <View style={styles.relatedImgCircle}>
                    <Image source={{ uri: rel.image }} style={styles.relatedImg} resizeMode="contain" />
                  </View>

                  <TouchableOpacity
                    style={styles.relatedAddBtn}
                    onPress={() => addToCart(rel)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  <Text style={styles.relatedName} numberOfLines={1}>
                    {rel.name}
                  </Text>
                  <Text style={styles.relatedPrice}>
                    ${rel.price.toFixed(2)}
                    <Text style={styles.relatedPriceUnit}>{rel.unit || '/each'}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom spacer for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Quantity Stepper Pill */}
        <View style={styles.stepperPill}>
          <TouchableOpacity style={styles.stepperBtn} onPress={handleDecrement} activeOpacity={0.7}>
            <Text style={styles.stepperMinusText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.stepperQtyText}>{qty}</Text>

          <TouchableOpacity style={styles.stepperPlusCircle} onPress={handleIncrement} activeOpacity={0.8}>
            <Text style={styles.stepperPlusText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Big Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart} activeOpacity={0.9}>
          <Ionicons name="bag-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addToCartBtnText}>Add to Cart</Text>
          <Text style={styles.addToCartDot}>•</Text>
          <Text style={styles.addToCartPrice}>${totalItemPrice.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#1E3D34',
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  // Main Image Card
  imageCard: {
    width: '100%',
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3D34',
  },

  // Title & Price
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3D34',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  weightSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3D34',
  },
  unitText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Delivery Pill
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F4',
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  deliveryLabel: {
    fontSize: 12.5,
    color: '#4B5563',
  },
  deliveryValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3D34',
  },

  // Highlights Row
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Section Blocks
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3D34',
    marginBottom: 8,
  },
  descriptionBody: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 21,
  },

  // Related Products
  relatedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3D34',
  },
  relatedGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  relatedCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    padding: 12,
    position: 'relative',
  },
  relatedImgCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  relatedImg: {
    width: 44,
    height: 44,
  },
  relatedAddBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#162E27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3D34',
    marginBottom: 2,
  },
  relatedPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3D34',
  },
  relatedPriceUnit: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#6B7280',
  },

  // Bottom Sticky Action Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F4',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMinusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3D34',
  },
  stepperQtyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3D34',
    paddingHorizontal: 10,
  },
  stepperPlusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D4F468',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3D34',
  },

  addToCartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#162E27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addToCartBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addToCartDot: {
    color: '#A7C4B8',
    marginHorizontal: 8,
    fontSize: 14,
  },
  addToCartPrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
