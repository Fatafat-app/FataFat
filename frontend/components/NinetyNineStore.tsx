import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BOLD_FONT, STYLISH_FONT } from '../constants/Theme';

const FALLBACK_PRODUCTS = [
  {
    _id: 'u99-1',
    name: 'Veg Nikku Singh Burger',
    price: 4900,
    isVeg: true,
    rating: { average: 3.9, count: 26 },
    images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'],
    restaurant: { name: 'Burger Singh' },
  },
  {
    _id: 'u99-2',
    name: 'White Sauce Pasta',
    price: 9500,
    isVeg: true,
    rating: { average: 3.2, count: 58 },
    images: ['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80'],
    restaurant: { name: 'Delicious Paharganj' },
  },
  {
    _id: 'u99-3',
    name: 'Veggie Roll',
    price: 8900,
    isVeg: true,
    rating: { average: 4.4, count: 754 },
    images: ['https://images.unsplash.com/photo-1626804475297-41609ae0f4dc?w=400&q=80'],
    restaurant: { name: 'Baap Of Rolls' },
  },
  {
    _id: 'u99-4',
    name: 'Tomato Pizza',
    price: 9900,
    isVeg: true,
    rating: { average: 4.1, count: 188 },
    images: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80'],
    restaurant: { name: "La Pino'z Pizza" },
  },
  {
    _id: 'u99-5',
    name: 'Masala Dosa',
    price: 7900,
    isVeg: true,
    rating: { average: 4.6, count: 201 },
    images: ['https://images.unsplash.com/photo-1668236543090-982473d4d69c?w=400&q=80'],
    restaurant: { name: 'South Spice' },
  },
];

type StoreProduct = {
  _id?: string;
  name: string;
  price: number;
  isVeg?: boolean;
  rating?: { average?: number; count?: number };
  images?: string[];
  image?: string;
  restaurant?: { _id?: string; name?: string } | string;
};

type Props = {
  products: StoreProduct[];
  getDishImage: (prod: StoreProduct) => string;
  getQty: (id: string) => number;
  onAdd: (prod: StoreProduct) => void;
  onChangeQty: (id: string, delta: number) => void;
  onOpenRestaurant: (id: string) => void;
  onViewAll: () => void;
};

function getRestaurant(prod: StoreProduct) {
  const raw = prod.restaurant;
  const id = typeof raw === 'object' && raw?._id ? raw._id : typeof raw === 'string' ? raw : null;
  const name = typeof raw === 'object' && raw?.name ? raw.name : 'Kitchen Special';
  return { id, name };
}

function getPrice(prod: StoreProduct, idx: number) {
  const raw = Number(prod.price) || 0;
  const paise = raw >= 100 ? raw : raw * 100;
  const rupees = Math.round(paise / 100);
  const mrp = Math.round(rupees * (1.22 + (idx % 3) * 0.06));
  const off = mrp > rupees ? Math.round(((mrp - rupees) / mrp) * 100) : 0;
  return { rupees, mrp, off };
}

export function NinetyNineStoreSection({
  products,
  getDishImage,
  getQty,
  onAdd,
  onChangeQty,
  onOpenRestaurant,
  onViewAll,
}: Props) {
  const list = products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={['#E7F8F4', '#F4FBFA', '#FFFFFF']}
        locations={[0, 0.42, 1]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logo99}>99</Text>
            </View>
            <Text style={styles.logoStore}>store</Text>
          </View>

          <View style={styles.subRow}>
            <View style={styles.offerLeft}>
              <View style={styles.check}>
                <Ionicons name="checkmark" size={11} color="#FFF" />
              </View>
              <Text style={styles.offerText}>
                Meals at ₹99 +{' '}
                <Text style={styles.freeDelivery}>Free Delivery</Text>
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onViewAll} style={styles.viewAll} hitSlop={8}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={15} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 12}
          contentContainerStyle={styles.scroller}
        >
          {list.map((prod, idx) => {
            const prodId = prod._id || `u99-${idx}`;
            const { id: restId, name: restaurantName } = getRestaurant(prod);
            const { rupees, mrp, off } = getPrice(prod, idx);
            const qty = getQty(prodId);
            const isVeg = prod.isVeg !== false;
            const ratingAvg = prod.rating?.average ? prod.rating.average.toFixed(1) : null;
            const ratingCount = prod.rating?.count ? String(prod.rating.count) : null;

            return (
              <TouchableOpacity
                key={prodId}
                activeOpacity={0.92}
                onPress={() => {
                  if (restId) onOpenRestaurant(restId);
                  else onAdd(prod);
                }}
                style={styles.card}
              >
                <View style={styles.imageWrap}>
                  <Image source={{ uri: getDishImage(prod) }} style={styles.image} />
                  {off >= 15 && (
                    <View style={styles.offBadge}>
                      <Text style={styles.offText}>{off}% OFF</Text>
                    </View>
                  )}
                  {qty > 0 ? (
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          onChangeQty(prodId, -1);
                        }}
                      >
                        <Ionicons name="remove" size={15} color="#16A34A" />
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{qty}</Text>
                      <TouchableOpacity
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          onChangeQty(prodId, 1);
                        }}
                      >
                        <Ionicons name="add" size={15} color="#16A34A" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={(e) => {
                        e.stopPropagation();
                        onAdd(prod);
                      }}
                      style={styles.addBtn}
                    >
                      <Ionicons name="add" size={20} color="#16A34A" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.meta}>
                  <View style={styles.nameRow}>
                    <View style={[styles.vegBox, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                      <View style={[styles.vegDot, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
                    </View>
                    <Text style={styles.name} numberOfLines={2}>
                      {prod.name}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.mrp}>₹{mrp}</Text>
                    <View style={styles.pricePill}>
                      <Text style={styles.price}>₹{rupees}</Text>
                    </View>
                  </View>

                  {ratingAvg ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={11} color="#0D9488" />
                      <Text style={styles.rating}>{ratingAvg}</Text>
                      {ratingCount ? <Text style={styles.ratingCount}>({ratingCount})</Text> : null}
                    </View>
                  ) : (
                    <View style={styles.ratingRow}>
                      <Text style={styles.newLabel}>New on Ftafat</Text>
                    </View>
                  )}

                  <View style={styles.divider} />
                  <Text style={styles.restaurant} numberOfLines={1}>
                    {restaurantName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const CARD_WIDTH = 138;

const styles = StyleSheet.create({
  shell: {
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 14,
    borderRadius: 28,
    backgroundColor: '#E7F8F4',
    overflow: 'hidden',
    shadowColor: '#0B7A75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  gradient: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  logoMark: {
    backgroundColor: '#1C1917',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
    transform: [{ rotate: '-6deg' }],
  },
  logo99: {
    fontFamily: BOLD_FONT,
    fontSize: 22,
    fontWeight: '800',
    color: '#FBBF24',
    lineHeight: 26,
  },
  logoStore: {
    fontFamily: BOLD_FONT,
    fontSize: 26,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1C1917',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerText: {
    fontFamily: STYLISH_FONT,
    fontSize: 13.5,
    color: '#292524',
    flexShrink: 1,
  },
  freeDelivery: {
    fontFamily: BOLD_FONT,
    fontWeight: '700',
    color: '#D97706',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  scroller: {
    paddingLeft: 16,
    paddingRight: 20,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  imageWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F5F5F4',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  offBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15,23,42,0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  offText: {
    fontFamily: BOLD_FONT,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },
  stepper: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    paddingHorizontal: 7,
    height: 34,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  stepperQty: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    minWidth: 12,
    textAlign: 'center',
  },
  meta: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    minHeight: 36,
  },
  vegBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontFamily: BOLD_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C1917',
    lineHeight: 18,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  mrp: {
    fontFamily: STYLISH_FONT,
    fontSize: 12,
    color: '#A8A29E',
    textDecorationLine: 'line-through',
  },
  pricePill: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  price: {
    fontFamily: BOLD_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
    minHeight: 16,
  },
  rating: {
    fontFamily: BOLD_FONT,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  ratingCount: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#78716C',
  },
  newLabel: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#0B7A75',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E7E5E4',
    marginTop: 7,
    marginBottom: 6,
  },
  restaurant: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#A8A29E',
  },
});
