import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radii, Typography } from '../../constants/Theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  
  const getBackgroundColor = () => {
    if (disabled) return Colors.borderDark;
    if (variant === 'primary') return Colors.primary;
    if (variant === 'secondary') return Colors.primaryLight;
    return Colors.transparent;
  };

  const getTextColor = () => {
    if (disabled) return Colors.textSecondary;
    if (variant === 'primary') return Colors.white;
    if (variant === 'secondary') return Colors.primaryDark;
    if (variant === 'outline') return Colors.primary;
    return Colors.text;
  };

  const getBorderColor = () => {
    if (disabled) return Colors.borderDark;
    if (variant === 'outline') return Colors.borderDark;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
          <Text style={[Typography.button, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.lg,
    gap: 8,
  },
});
