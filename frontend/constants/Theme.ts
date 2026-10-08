export const Colors = {
  primary: '#0D9488',      // Deep Teal
  primaryDark: '#0F766E',  // Darker Teal
  primaryLight: '#F0FDFA', // Mint Background
  cream: '#FFFBEB',        // Warm Amber tint
  background: '#F9FAFB',   // App background
  surface: '#FFFFFF',      // Card background
  text: '#1C1C1C',         // Primary text
  textSecondary: '#7A7A7A',// Secondary text
  border: '#F0F0F0',       // Light border
  borderDark: '#EBEBEB',   // Slightly darker border
  success: '#059669',      // Green (Veg, Success)
  error: '#DC2626',        // Red (Non-Veg, Error)
  warning: '#F59E0B',      // Amber (Offers, Badges)
  accent: '#7C3AED',       // Rich Purple (Rating, Special)
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

import { Platform } from 'react-native';

export const STYLISH_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const BOLD_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const Typography = {
  heading: { fontFamily: BOLD_FONT, fontSize: 24, fontWeight: '900' as const, color: Colors.text },
  title: { fontFamily: BOLD_FONT, fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  subtitle: { fontFamily: BOLD_FONT, fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  body: { fontFamily: STYLISH_FONT, fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  bodySmall: { fontFamily: STYLISH_FONT, fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  caption: { fontFamily: STYLISH_FONT, fontSize: 10, fontWeight: '600' as const, color: Colors.textSecondary },
  button: { fontFamily: BOLD_FONT, fontSize: 15, fontWeight: '800' as const, color: Colors.white },
  price: { fontFamily: BOLD_FONT, fontSize: 16, fontWeight: '800' as const, color: Colors.primary },
  label: { fontFamily: BOLD_FONT, fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },
};

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  }
};
