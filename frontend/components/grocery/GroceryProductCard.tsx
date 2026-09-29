import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GColors, GRadius, GSpacing, GShadow, GFontSize } from '../../constants/GroceryTheme';
import { GroceryProduct } from '../../constants/GroceryData';
import { useGroceryStore } from '../../store/grocery.store';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - GSpacing.edgeMargin * 2 - GSpacing.md) / 2;

interface GroceryProductCardProps {
  product: GroceryProduct;
  style?: any;
}

export function GroceryProductCard({ product, style }: GroceryProductCardProps) {
  const router = useRouter();
  const { addToCart, incrementQty, decrementQty, toggleWishlist, wishlist, cart } = useGroceryStore();
  const prodId = product._id || product.id;
  const cartItem = cart.find((i) => (i.product._id || i.product.id) === prodId);
  const qty = cartItem?.quantity ?? 0;
  const isWishlisted = wishlist.includes(prodId);

  // Stepper expand animation
  const stepperWidth = useRef(new Animated.Value(36)).current;
  const [stepperOpen, setStepperOpen] = useState(false);

  const openStepper = () => {
    addToCart(product);
    setStepperOpen(true);
    Animated.spring(stepperWidth, {
      toValue: 100,
      tension: 80,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  const handleDecrement = () => {
    decrementQty(prodId);
    if (qty <= 1) {
      setStepperOpen(false);
      Animated.spring(stepperWidth, {
        toValue: 36,
        tension: 80,
        friction: 10,
        useNativeDriver: false,
      }).start();
    }
  };

  const getBadgeStyle = () => {
    switch (product.badge) {
      case 'deal': return { bg: GColors.tertiary, text: 'Deal' };
      case 'best_seller': return { bg: GColors.primary, text: 'Best Seller' };
      case 'organic': return { bg: '#10B981', text: 'Organic' };
      default: return null;
    }
  };

  const badge = getBadgeStyle();

  const handleCardPress = () => {
    const slug = product.slug || String(prodId);
    router.push({
      pathname: '/grocery/product/[idOrSlug]',
      params: { idOrSlug: slug },
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, GShadow.level1, style]}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Image container */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              product.image ||
              product.images?.[0] ||
              'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
          }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Discount badge */}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}</Text>
          </View>
        )}

        {/* Named badge */}
        {badge && !product.discount && (
          <View style={[styles.namedBadge, { backgroundColor: badge.bg }]}>
            <Text style={styles.namedBadgeText}>{badge.text}</Text>
          </View>
        )}

        {/* Rating */}
        {product.rating && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FCD34D" />
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
        )}

        {/* Wishlist */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(prodId)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={16}
            color={isWishlisted ? GColors.wishlistActive : GColors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
          </View>

          {/* Add / Stepper button */}
          <Animated.View style={[styles.stepperContainer, { width: stepperWidth }]}>
            {stepperOpen && qty > 0 ? (
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={handleDecrement}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnActive]}
                  onPress={() => incrementQty(product.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.stepBtnText, { color: GColors.primary }]}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={openStepper} activeOpacity={0.85}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GColors.card,
    borderRadius: GRadius.xl,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: GColors.tertiary,
    borderRadius: GRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: '#FFF',
    fontSize: GFontSize.labelSm,
    fontWeight: '700',
  },
  namedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: GRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  namedBadgeText: {
    color: '#FFF',
    fontSize: GFontSize.labelSm,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: GRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: GRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    padding: 10,
  },
  name: {
    fontSize: GFontSize.bodyMd,
    fontWeight: '700',
    color: GColors.textPrimary,
    marginBottom: 2,
    lineHeight: 19,
  },
  unit: {
    fontSize: GFontSize.bodySm,
    fontWeight: '400',
    color: GColors.textMuted,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: GFontSize.labelLg,
    fontWeight: '700',
    color: GColors.primary,
  },
  originalPrice: {
    fontSize: GFontSize.bodySm,
    fontWeight: '400',
    color: GColors.textStrikethrough,
    textDecorationLine: 'line-through',
  },
  stepperContainer: {
    height: 36,
    overflow: 'hidden',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: GRadius.full,
    backgroundColor: GColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: GColors.textWhite,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GColors.stepperBg,
    borderRadius: GRadius.full,
    height: 36,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    flex: 1,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: GRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnActive: {
    backgroundColor: GColors.accent,
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: GColors.textPrimary,
    lineHeight: 18,
  },
  qtyText: {
    fontSize: GFontSize.bodyMd,
    fontWeight: '700',
    color: GColors.textPrimary,
  },
});
