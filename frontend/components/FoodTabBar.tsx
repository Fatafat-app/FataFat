import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '../constants/Theme';
import { useCartStore } from '../store/cart.store';

// ─── Food tab items ───────────────────────────────────────────────────────────
const FOOD_TABS = [
  { id: 'index',   route: '/(tabs)',          label: 'Home',    icon: 'home-outline',    iconFocused: 'home' },
  { id: 'cart',    route: '/(tabs)/cart',     label: 'Cart',    icon: 'bag-outline',     iconFocused: 'bag' },
  { id: 'orders',  route: '/(tabs)/orders',   label: 'Orders',  icon: 'receipt-outline', iconFocused: 'receipt' },
  { id: 'profile', route: '/(tabs)/profile',  label: 'Profile', icon: 'person-outline',  iconFocused: 'person' },
] as const;

type FoodTabId = typeof FOOD_TABS[number]['id'];

export function FoodTabBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const cartCount = useCartStore((s: any) => s.items.reduce((sum: number, i: any) => sum + i.quantity, 0));

  const getActive = (): FoodTabId => {
    if (pathname === '/' || pathname === '/index' || pathname === '') return 'index';
    if (pathname.includes('/cart'))    return 'cart';
    if (pathname.includes('/orders'))  return 'orders';
    if (pathname.includes('/profile')) return 'profile';
    return 'index';
  };

  const activeId = getActive();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {FOOD_TABS.map((tab) => {
          const focused = tab.id === activeId;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.75}
            >
              {/* Icon */}
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons
                  name={(focused ? tab.iconFocused : tab.icon) as any}
                  size={20}
                  color={focused ? Colors.primary : '#94A3B8'}
                />
                {/* Cart badge */}
                {tab.id === 'cart' && cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[styles.label, { color: focused ? Colors.primary : '#94A3B8' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles — pixel-perfect match with GroceryTabBar ─────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    marginHorizontal: 28,                            // same as GroceryTabBar
    marginBottom: Platform.OS === 'ios' ? 0 : 16,   // same
    height: 64,                                      // same
    borderRadius: 32,                                // same
    backgroundColor: 'rgba(255, 255, 255, 0.98)',    // same
    borderWidth: 1.5,                                // same
    borderColor: '#E7ECE5',                          // same sage border
    shadowColor: Colors.primary,                     // orange brand shadow
    shadowOffset: { width: 0, height: 6 },           // same
    shadowOpacity: 0.12,                             // same
    shadowRadius: 16,                                // same
    elevation: 12,                                   // same
    alignItems: 'center',                            // same
    paddingHorizontal: 8,                            // same
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,                                   // same
  },
  iconContainer: {
    width: 36,                                       // same
    height: 26,                                      // same
    borderRadius: 13,                                // same
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: '#FFF0E6',                      // food: light orange tint
  },
  label: {
    fontSize: 10,                                    // same
    fontWeight: '700',                               // same
    marginTop: 2,                                    // same
    letterSpacing: 0.1,                              // same
  },
  badge: {
    position: 'absolute',
    top: -3,                                         // same
    right: -2,                                       // same
    backgroundColor: Colors.primary,                 // orange fill
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
});
