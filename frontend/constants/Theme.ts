export const Colors = {
  primary: '#FF6000',      // Ftafat Orange
  primaryDark: '#D95300',
  primaryLight: '#FFEDD5', // Very light orange/peach for backgrounds
  cream: '#FFF5F0',        // Warm cream
  background: '#F9FAFB',   // App background
  surface: '#FFFFFF',      // Card background
  text: '#111827',         // Primary text
  textSecondary: '#6B7280',// Secondary text
  border: '#F3F4F6',       // Light border
  borderDark: '#E5E7EB',   // Slightly darker border
  success: '#10B981',      // Subtle green
  error: '#EF4444',        // Subtle red
  warning: '#F59E0B',      // Yellow
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
  ios: 'Georgia',
  android: 'serif',
  default: 'System',
});

export const BOLD_FONT = Platform.select({
  ios: 'Georgia-Bold',
  android: 'serif',
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
