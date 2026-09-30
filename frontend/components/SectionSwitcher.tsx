import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GColors, GRadius, GShadow } from '../constants/GroceryTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GROCERY_COLOR = '#1E3D34'; // Deep Forest Pine
const FOOD_COLOR = '#D94E1B';    // Deep Brand Orange

interface SectionSwitcherProps {
  activeSection: 'food' | 'grocery';
  onSwitch: (section: 'food' | 'grocery') => void;
  style?: any;
}

export function SectionSwitcher({ activeSection, onSwitch, style }: SectionSwitcherProps) {
  // 0 = food (left), 1 = grocery (right)
  const slideAnim = useRef(
    new Animated.Value(activeSection === 'food' ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeSection === 'food' ? 0 : 1,
      tension: 90,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [activeSection]);

  const PILL_WIDTH = (SCREEN_WIDTH - 32 - 8) / 2;

  // Indicator slides between Food (0, left) and Grocery (1, right)
  const indicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, PILL_WIDTH + 4],
  });

  const indicatorColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FOOD_COLOR, GROCERY_COLOR],
  });

  const isFood = activeSection === 'food';
  const isGrocery = activeSection === 'grocery';

  return (
    <View style={[styles.container, style]}>
      {/* Animated sliding background pill */}
      <Animated.View
        style={[
          styles.indicator,
          {
            left: indicatorLeft,
            width: PILL_WIDTH,
            backgroundColor: indicatorColor,
          },
          GShadow.level2,
        ]}
      />

      {/* 1. Food Delivery Segment (First / Left) */}
      <TouchableOpacity
        style={styles.segment}
        onPress={() => onSwitch('food')}
        activeOpacity={0.85}
      >
        <Ionicons
          name="fast-food"
          size={16}
          color={isFood ? '#FFFFFF' : '#4B5563'}
          style={styles.icon}
        />
        <Text style={[styles.segmentText, { color: isFood ? '#FFFFFF' : '#4B5563' }]}>
          Food Delivery
        </Text>
      </TouchableOpacity>

      {/* 2. Grocery Segment (Second / Right) */}
      <TouchableOpacity
        style={styles.segment}
        onPress={() => onSwitch('grocery')}
        activeOpacity={0.85}
      >
        <Ionicons
          name="bag-handle"
          size={15}
          color={isGrocery ? '#D4F468' : '#5A6E65'}
          style={styles.icon}
        />
        <Text style={[styles.segmentText, { color: isGrocery ? '#FFFFFF' : '#4B5563' }]}>
          Grocery
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: GRadius.full,
    padding: 4,
    marginHorizontal: 16,
    position: 'relative',
    height: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: GRadius.full,
    zIndex: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: '100%',
  },
  icon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

