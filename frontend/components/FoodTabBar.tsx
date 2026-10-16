import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '../constants/Theme';
import { useCartStore } from '../store/cart.store';

const CART_BTN_SIZE = 62;
const BAR_HEIGHT = 70;

// ─── Food tab items ────────────────────────────────────────────────────────────
const FOOD_TABS = [
  { id: 'index', route: '/(tabs)', label: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { id: 'orders', route: '/(tabs)/orders', label: 'Orders', icon: 'receipt-outline', iconFocused: 'receipt' },
  { id: 'cart', route: '/(tabs)/cart', label: 'Cart', icon: 'bag-handle-outline', iconFocused: 'bag-handle', isCenter: true },
  { id: 'under99', route: '/(tabs)/under99', label: '99 Store', icon: 'storefront-outline', iconFocused: 'storefront' },
  { id: 'profile', route: '/(tabs)/profile', label: 'Profile', icon: 'person-outline', iconFocused: 'person' },
] as const;

// ─── Animated Cart Center Button ───────────────────────────────────────────────
function CenterCartButton({ onPress, cartCount, isFocused }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, friction: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  return (
    <View style={styles.centerTabWrapper}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.centerTouchArea}
      >
        <Animated.View style={[styles.centerScale, { transform: [{ scale: scaleAnim }] }]}>

          <LinearGradient
            colors={['#8B5CF6', '#6D28D9', '#4C1D95']}
            style={styles.centerGradientCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Inner highlight arc */}
            <View style={styles.innerHighlight} />
            {/* Icon */}
            <Ionicons name="bag-handle" size={26} color="#FFFFFF" />
          </LinearGradient>

          {/* Cart Count Badge — hidden when on cart page, shown otherwise */}
          {cartCount > 0 && !isFocused && (
            <View style={styles.centerBadge}>
              <Text style={styles.centerBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Text style={[styles.centerLabel, isFocused && styles.centerLabelActive]}>
        Cart
      </Text>
    </View>
  );
}

// ─── Normal Tab Item ───────────────────────────────────────────────────────────
function TabItem({ tab, isFocused, onPress, cartCount }: any) {
  const animatedScale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedScale, {
      toValue: isFocused ? 1 : 0,
      friction: 6, tension: 60, useNativeDriver: true,
    }).start();
  }, [isFocused]);

  if (tab.isCenter) {
    return <CenterCartButton onPress={onPress} cartCount={cartCount} isFocused={isFocused} />;
  }

  const translateY = animatedScale.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const dotScale = animatedScale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const is99Tab = tab.id === 'under99';
  const activeColor = is99Tab ? '#0D9488' : Colors.primary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tabItem}>
      <Animated.View style={[styles.iconWrapper, { transform: [{ translateY }] }]}>
        <Ionicons
          name={isFocused ? tab.iconFocused : tab.icon}
          size={22}
          color={isFocused ? activeColor : '#94A3B8'}
        />
        {is99Tab && (
          <View style={styles.dealBadge}>
            <Text style={styles.dealBadgeText}>99</Text>
          </View>
        )}
        <Animated.View
          style={[
            styles.activeDot,
            {
              transform: [{ scale: dotScale }],
              backgroundColor: activeColor,
            },
          ]}
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          isFocused && (is99Tab ? { color: '#0D9488', fontWeight: '800' } : styles.labelActive),
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main FoodTabBar ──────────────────────────────────────────────────────────
export function FoodTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartStore((s: any) => s.items.reduce((sum: number, i: any) => sum + i.quantity, 0));

  const getActiveIndex = () => {
    if (pathname.includes('/orders')) return 1;
    if (pathname.includes('/cart')) return 2;
    if (pathname.includes('/under99')) return 3;
    if (pathname.includes('/profile')) return 4;
    return 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Notch cutout illusion: screen-BG colored circle at top-center of bar */}
        <View style={styles.notchCutout} />
        {FOOD_TABS.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isFocused={activeIndex === index}
            onPress={() => router.push(tab.route as any)}
            cartCount={cartCount}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'visible',
  },
  // Screen-BG colored circle creates the curved notch illusion
  notchCutout: {
    position: 'absolute',
    top: -(CART_BTN_SIZE / 2) - 4,
    left: '50%',
    marginLeft: -(CART_BTN_SIZE / 2 + 8),
    width: CART_BTN_SIZE + 16,
    height: CART_BTN_SIZE + 16,
    borderRadius: (CART_BTN_SIZE + 16) / 2,
    backgroundColor: '#F4F6F8', // Same as screen background
    zIndex: 5,
  },

  // Normal tabs
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 14, // Pill shape instead of dot
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  dealBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#0D9488',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dealBadgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
    includeFontPadding: false,
  },

  // Center Cart button
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 20,
  },
  centerTouchArea: {
    position: 'absolute',
    top: -34, // Float above the bar
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    height: 84,
  },
  centerScale: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    height: 84,
  },
  haloRing: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(109, 40, 217, 0.15)', // Soft violet glow
  },
  rotatingRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: '#8B5CF6', // Violet color for dots
  },
  centerGradientCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#6D28D9', // Violet shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 4,
    left: 8,
    width: 28,
    height: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Sheen effect
    transform: [{ rotate: '-20deg' }],
  },
  centerBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: '#F97316',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  centerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  centerLabel: {
    position: 'absolute',
    bottom: 8,
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  centerLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
