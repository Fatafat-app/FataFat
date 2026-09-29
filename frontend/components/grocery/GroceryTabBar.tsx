import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GColors, GRadius, GFontSize } from '../../constants/GroceryTheme';
import { useGroceryCartCount } from '../../store/grocery.store';

type TabId = 'home' | 'categories' | 'cart' | 'orders' | 'profile';

interface TabItem {
  id: TabId;
  label: string;
  icon: string;
  iconFocused: string;
}

const TABS: TabItem[] = [
  { id: 'home',       label: 'Home',       icon: 'home-outline',     iconFocused: 'home' },
  { id: 'categories', label: 'Categories', icon: 'grid-outline',      iconFocused: 'grid' },
  { id: 'cart',       label: 'Cart',       icon: 'bag-outline',       iconFocused: 'bag' },
  { id: 'orders',     label: 'Orders',     icon: 'receipt-outline',   iconFocused: 'receipt' },
  { id: 'profile',    label: 'Profile',    icon: 'person-outline',    iconFocused: 'person' },
];

interface GroceryTabBarProps {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
}

export function GroceryTabBar({ activeTab = 'home', onTabPress }: GroceryTabBarProps) {
  const router = useRouter();
  const groceryCartCount = useGroceryCartCount();

  const handlePress = (tab: TabItem) => {
    onTabPress?.(tab.id);
    switch (tab.id) {
      case 'home':
        router.push('/(tabs)');
        break;
      case 'categories':
        router.push('/grocery/categories');
        break;
      case 'cart':
        router.push('/(tabs)/cart');
        break;
      case 'orders':
        router.push('/(tabs)/orders');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const focused = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => handlePress(tab)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons
                  name={(focused ? tab.iconFocused : tab.icon) as any}
                  size={20}
                  color={focused ? GColors.primary : '#94A3B8'}
                />
                {/* Cart badge */}
                {tab.id === 'cart' && groceryCartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {groceryCartCount > 9 ? '9+' : groceryCartCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: focused ? GColors.primary : '#94A3B8' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    // push above system home indicator on iOS
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    marginHorizontal: 28,
    marginBottom: Platform.OS === 'ios' ? 0 : 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1.5,
    borderColor: GColors.border,
    shadowColor: GColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconContainer: {
    width: 36,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: GColors.switcherBg, // #EBF0EA — light green tint
  },
  label: {
    fontSize: GFontSize.labelSm,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -2,
    backgroundColor: GColors.accent,   // #D4F468 lime
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
    color: GColors.primary,             // dark green on lime
    fontSize: 8,
    fontWeight: '800',
  },
});
