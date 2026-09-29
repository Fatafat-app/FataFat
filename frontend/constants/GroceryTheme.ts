// Grocery Design Tokens — from DESIGN.md
// Deep botanical Scandinavian minimalism + quick-commerce

export const GColors = {
  // Primary palette
  primary: '#1E3D34',        // Deep Forest Pine — CTAs, active states
  accent: '#D4F468',         // Electric Sprout Lime — active filters, badges, stepper
  tertiary: '#F4A261',       // Warm Sunset Amber — flash tags, promo

  // Surfaces
  surface: '#F8FAF7',        // Crisp Milk Foam — screen background
  card: '#FFFFFF',           // Product tile surface
  border: '#E7ECE5',         // Organic sage — search border, inactive chips

  // Text
  textPrimary: '#1E3D34',    // Same as primary for high-contrast text
  textSecondary: '#37474F',  // Inactive chip text
  textMuted: '#6C7D76',      // Inactive switcher text, helper text
  textPlaceholder: '#8A9A92',// Search placeholder
  textStrikethrough: '#9CAAA4', // Original price crossed out
  textWhite: '#FFFFFF',

  // Component-specific
  switcherBg: '#EBF0EA',     // Mode switcher pill container
  promoBg: '#EFF9D3',        // Promotional hero banner bg
  stepperBg: '#F1F5F0',      // Quantity stepper container

  // Semantic
  deal: '#F4A261',           // "40% OFF" badge
  bestSeller: '#1E3D34',     // "Best Seller" badge
  success: '#10B981',
  wishlistActive: '#EF4444',
  wishlistInactive: '#D1D5DB',
};

export const GRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const GSpacing = {
  xs: 4,
  sm: 8,
  md: 12,    // gutter-mobile
  lg: 20,    // space-lg — section rhythm
  xl: 24,
  xxl: 32,
  edgeMargin: 16,
  minTouchTarget: 44,
};

export const GShadow = {
  level1: {
    // Product tiles & category cards
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  level2: {
    // Active switcher & filter chips
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  level3: {
    // Floating cart bar
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 12,
  },
};

// Typography sizes (RN fontSize)
export const GFontSize = {
  headingXl: 24,
  headingLg: 20,
  headingMd: 18,
  bodyLg: 16,
  bodyMd: 14,
  bodySm: 12,
  labelLg: 14,
  labelMd: 12,
  labelSm: 10,
};
