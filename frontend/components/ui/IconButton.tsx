import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows } from '../../constants/Theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps {
  icon: IoniconsName;
  onPress: () => void;
  variant?: 'normal' | 'filled' | 'outlined';
  color?: string;
  size?: number;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  variant = 'normal',
  color = Colors.text,
  size = 24,
  disabled = false,
  loading = false,
  style,
}: IconButtonProps) {
  
  const getBackgroundColor = () => {
    if (variant === 'filled') return Colors.surface;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'outlined') return Colors.border;
    return 'transparent';
  };

  const shadowStyle = variant === 'filled' ? Shadows.light : {};

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        shadowStyle,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={size} color={disabled ? Colors.textSecondary : color} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: Radii.full,
  },
});
