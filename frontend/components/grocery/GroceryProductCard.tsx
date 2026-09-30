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
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GColors, GRadius, GSpacing, GShadow, GFontSize } from '../../constants/GroceryTheme';
import { GroceryProduct } from '../../constants/GroceryData';
import { useGroceryStore } from '../../store/grocery.store';


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
  if (lower.includes('spinach') || lower.includes('leaf') || lower.includes('veg')) return fallbackImages[9];
  if (lower.includes('apple')) return fallbackImages[10];
  if (lower.includes('broccoli') || lower.includes('cabbage')) return fallbackImages[11];
  if (lower.includes('tomato')) return fallbackImages[12];
  if (lower.includes('jam') || lower.includes('preserve')) return fallbackImages[13];
  if (lower.includes('onion')) return fallbackImages[14];
  if (lower.includes('pepper') || lower.includes('capsicum')) return fallbackImages[15];
  if (lower.includes('egg')) return fallbackImages[17];
  if (lower.includes('potato')) return fallbackImages[18];

  const hash = (name.length + name.charCodeAt(0)) % fallbackImages.length;
  return fallbackImages[hash];
};

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

  // Image error handling
  const [imgError, setImgError] = useState(false);
  const img = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
  const imageUrl = imgError || !img || img.includes('pexels') ? getImageForName(product.name) : img;

  // Stepper height animation for full-width button
  const stepperHeight = useRef(new Animated.Value(0)).current;
  const [stepperOpen, setStepperOpen] = useState(qty > 0);

  const openStepper = () => {
    addToCart(product);
    setStepperOpen(true);
  };

  const handleDecrement = () => {
    decrementQty(prodId);
    if (qty <= 1) {
      setStepperOpen(false);
    }
  };

  const getBadgeStyle = () => {
    switch (product.badge) {
      case 'deal': return { bg: '#8B5CF6', text: 'Mega Deal' };
      case 'best_seller': return { bg: '#F59E0B', text: 'Best Seller' };
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
      style={[styles.card, style]}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Image container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />

        {/* Discount badge */}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}</Text>
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
            color={isWishlisted ? '#EF4444' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.timeTag}>
          <Ionicons name="time-outline" size={10} color="#6B7280" />
          <Text style={styles.timeTagText}>8 MINS</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price.toFixed(0)}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>₹{product.originalPrice.toFixed(0)}</Text>
          )}
        </View>

        {/* Bottom Add/Stepper Button */}
        <View style={{ marginTop: 12 }}>
          {stepperOpen && qty > 0 ? (
            <View style={styles.fullWidthStepper}>
              <TouchableOpacity style={styles.fullStepBtn} onPress={handleDecrement} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.fullStepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.fullQtyText}>{qty}</Text>
              <TouchableOpacity style={styles.fullStepBtn} onPress={() => incrementQty(product.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.fullStepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.fullWidthAddBtn} onPress={openStepper} activeOpacity={0.85}>
              <Text style={styles.fullWidthAddText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: CARD_WIDTH,
    marginBottom: 16,
    // Soft shadow like Instamart
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF', // Clean white background
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    padding: 10, // Margin around the landscape image
  },
  image: {
    width: '100%',
    height: 100, // Fixed height to enforce landscape ratio (approx 140x100 = 1.4 landscape)
    borderRadius: 10, // Rounded corners on the image itself
    backgroundColor: '#F9FAFB', // Slight background if image is transparent
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 8,
    backgroundColor: '#3B82F6', 
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: BOLD_FONT,
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Full Width Bottom Button Styles
  fullWidthAddBtn: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDF4', // Light green tint
    borderWidth: 1,
    borderColor: '#22C55E', // Standard green border
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthAddText: {
    color: '#16A34A', // Darker green for text
    fontSize: 13,
    fontFamily: BOLD_FONT,
    letterSpacing: 0.5,
  },
  fullWidthStepper: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    backgroundColor: '#16A34A', // Solid green when items are added
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  fullStepBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullStepBtnText: {
    fontSize: 18,
    fontFamily: BOLD_FONT,
    color: '#FFFFFF',
  },
  fullQtyText: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#FFFFFF',
  },

  details: {
    padding: 12,
    paddingTop: 12, // Restored normal padding since button is no longer overlapping
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  timeTagText: {
    fontSize: 8,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
    marginLeft: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
    marginBottom: 2,
    lineHeight: 18,
    height: 36, // Force exactly 2 lines height
  },
  unit: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    marginBottom: 10,
    height: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#111827',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
});
