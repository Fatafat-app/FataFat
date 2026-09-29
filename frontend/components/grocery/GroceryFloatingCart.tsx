import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GColors, GRadius, GSpacing, GShadow, GFontSize } from '../../constants/GroceryTheme';
import { useGroceryCartCount, useGroceryCartTotal } from '../../store/grocery.store';

const { width } = Dimensions.get('window');

export function GroceryFloatingCart() {
  const count = useGroceryCartCount();
  const total = useGroceryCartTotal();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: count > 0 ? 1 : 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [count]);

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.bar, GShadow.level3]}
        onPress={() => router.push('/(tabs)/cart')}
        activeOpacity={0.9}
      >
        {/* Left: count badge + price */}
        <View style={styles.leftRow}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
          <Text style={styles.totalText}>${total.toFixed(2)} Total</Text>
        </View>

        {/* Right: View Cart */}
        <View style={styles.rightRow}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={16} color={GColors.textWhite} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 96,   // above grocery tab bar (64px height + 16px gap + 16px margin)
    left: GSpacing.edgeMargin,
    right: GSpacing.edgeMargin,
    zIndex: 200,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GColors.primary,
    borderRadius: GRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    height: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    backgroundColor: GColors.accent,
    borderRadius: GRadius.full,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: GColors.primary,
    fontSize: GFontSize.labelSm,
    fontWeight: '800',
  },
  totalText: {
    color: GColors.textWhite,
    fontSize: GFontSize.labelLg,
    fontWeight: '700',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    color: GColors.textWhite,
    fontSize: GFontSize.labelLg,
    fontWeight: '700',
  },
});
