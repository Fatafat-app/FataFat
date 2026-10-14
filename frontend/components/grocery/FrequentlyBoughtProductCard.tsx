import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GroceryProduct } from '../../constants/GroceryData';
import { useGroceryStore } from '../../store/grocery.store';
import { getImageForName } from './GroceryProductCard';

const CARD_WIDTH = Math.min(Dimensions.get('window').width * 0.43, 188);

interface FrequentlyBoughtProductCardProps {
  product: GroceryProduct;
}

export function FrequentlyBoughtProductCard({ product }: FrequentlyBoughtProductCardProps) {
  const router = useRouter();
  const { addToCart, incrementQty, decrementQty, toggleWishlist, wishlist, cart } = useGroceryStore();
  const [imageFailed, setImageFailed] = useState(false);
  const productId = product._id || product.id;
  const cartItem = cart.find((item) => (item.product._id || item.product.id) === productId);
  const quantity = cartItem?.quantity ?? 0;
  const isWishlisted = wishlist.includes(productId);
  const imageUri = !imageFailed && product.image && !product.image.includes('pexels')
    ? product.image
    : getImageForName(product.name);

  const openDetails = () => {
    router.push({
      pathname: '/grocery/product/[idOrSlug]',
      params: { idOrSlug: product.slug || String(productId) },
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={openDetails} style={styles.card}>
      <View style={styles.imageFrame}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
        {product.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}</Text>
          </View>
        ) : product.badge ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {product.badge === 'best_seller' ? 'BESTSELLER' : product.badge === 'organic' ? 'ORGANIC' : 'POPULAR'}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onPress={(event) => {
            event.stopPropagation();
            toggleWishlist(productId);
          }}
          activeOpacity={0.8}
          style={styles.wishlistButton}
          hitSlop={6}
        >
          <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={17} color={isWishlisted ? '#E45858' : '#47534A'} />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit} numberOfLines={1}>{product.unit}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>₹{product.price.toFixed(0)}</Text>
            {product.originalPrice ? (
              <Text style={styles.originalPrice}>₹{product.originalPrice.toFixed(0)}</Text>
            ) : null}
          </View>
          {quantity > 0 ? (
            <View style={styles.quantityControl}>
              <TouchableOpacity onPress={(event) => { event.stopPropagation(); decrementQty(productId); }} hitSlop={6}>
                <Ionicons name="remove" size={17} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity onPress={(event) => { event.stopPropagation(); incrementQty(productId); }} hitSlop={6}>
                <Ionicons name="add" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              accessibilityLabel={`Add ${product.name} to cart`}
              style={styles.addButton}
              onPress={(event) => {
                event.stopPropagation();
                addToCart(product);
              }}
              activeOpacity={0.82}
              hitSlop={6}
            >
              <Text style={styles.addText}>ADD</Text>
              <Ionicons name="add" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF0E9',
    shadowColor: '#263523',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 3,
  },
  imageFrame: {
    height: 138,
    backgroundColor: '#F4F6EF',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: '#426B38',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: BOLD_FONT,
    letterSpacing: 0.2,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 11,
  },
  name: {
    height: 36,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: BOLD_FONT,
    color: '#263523',
  },
  unit: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: STYLISH_FONT,
    color: '#8A9385',
    marginTop: 3,
  },
  bottomRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  priceBlock: {
    flexShrink: 1,
  },
  price: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#263523',
  },
  originalPrice: {
    fontSize: 10,
    fontFamily: STYLISH_FONT,
    color: '#9CA39A',
    textDecorationLine: 'line-through',
  },
  addButton: {
    minWidth: 58,
    height: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#426B38',
    borderRadius: 10,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: BOLD_FONT,
    marginRight: 2,
  },
  quantityControl: {
    minWidth: 68,
    height: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#426B38',
    borderRadius: 10,
    marginLeft: 4,
  },
  quantity: {
    minWidth: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: BOLD_FONT,
  },
});
