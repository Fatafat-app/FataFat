import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Radii, Shadows } from '../../constants/Theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'normal' | 'elevated' | 'outlined';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({
  children,
  variant = 'normal',
  style,
  onPress,
}: CardProps) {
  
  const getVariantStyle = (): StyleProp<ViewStyle> => {
    switch (variant) {
      case 'elevated':
        return [styles.elevated, Shadows.medium];
      case 'outlined':
        return styles.outlined;
      default:
        return [styles.normal, Shadows.light];
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.base, getVariantStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
    >
      {children}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  normal: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.transparent,
  },
});
