// Grocery dummy data — frontend only, backend baad mein
import { Platform } from 'react-native';

export interface GroceryCategory {
  id: string | number;
  _id?: string;
  name: string;
  slug?: string;
  emoji?: string;
  image?: string;
  bg?: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'lime' | 'grey' | 'pink' | 'blue' | 'default';
  itemCount?: string;
}

export interface GroceryProduct {
  id: string | number;
  _id?: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  images?: string[];
  badge?: 'deal' | 'best_seller' | 'organic';
  discount?: string; // "40% off"
  rating?: number;
  isWishlisted?: boolean;
}

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  {
    id: 1,
    name: 'Fresh fruit',
    emoji: '🍎',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 2,
    name: 'Daily meat',
    emoji: '🥩',
    image: 'https://images.unsplash.com/photo-1604803932791-72f3e82cc872?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 3,
    name: 'Cold drinks',
    emoji: '🥤',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 4,
    name: 'Quick snacks',
    emoji: '🥐',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 5,
    name: 'Household',
    emoji: '🧴',
    image: 'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 6,
    name: 'Dairy',
    emoji: '🥛',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 7,
    name: 'Bakery',
    emoji: '🍞',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&q=80',
    bg: '#FFFFFF',
  },
  {
    id: 8,
    name: 'Organic',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80',
    bg: '#FFFFFF',
  },
];

export const GROCERY_SPECIAL_DEALS: GroceryProduct[] = [
  {
    id: 1,
    name: 'Fresh Organic Bananas',
    price: 45,
    originalPrice: 60,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=400&q=80',
    badge: 'deal',
    discount: '25% OFF',
  },
  {
    id: 2,
    name: 'Farm Fresh Spinach',
    price: 25,
    unit: '1 bunch',
    image: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc492?w=400&q=80',
    badge: 'best_seller',
    rating: 4.9,
  },
  {
    id: 3,
    name: 'Kashmiri Red Apples',
    price: 180,
    originalPrice: 220,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=400&q=80',
    badge: 'organic',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Fresh Green Broccoli',
    price: 65,
    unit: '500 g',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80',
    badge: 'organic',
  },
];

export const GROCERY_TRENDING: GroceryProduct[] = [
  {
    id: 5,
    name: 'Cherry Tomatoes',
    price: 40,
    originalPrice: 65,
    unit: '250 g',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
    discount: '40% OFF',
    badge: 'best_seller',
  },
  {
    id: 6,
    name: 'Fresh Chicken Breast',
    price: 280,
    originalPrice: 320,
    unit: '500 g',
    image: 'https://images.unsplash.com/photo-1604803932791-72f3e82cc872?w=400&q=80',
    discount: '12% OFF',
  },
  {
    id: 7,
    name: 'Strawberry Preserve Jam',
    price: 150,
    unit: '320 ml',
    image: 'https://images.unsplash.com/photo-1517594422361-5e18a412072f?w=400&q=80',
    rating: 4.5,
  },
  {
    id: 8,
    name: 'Red Onion Premium',
    price: 35,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  },
  {
    id: 9,
    name: 'Fresh Toned Milk',
    price: 32,
    originalPrice: 35,
    unit: '500 ml',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    discount: '10% OFF',
    badge: 'deal',
  },
  {
    id: 10,
    name: 'Mixed Bell Peppers',
    price: 90,
    unit: '3 pcs (Pack)',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa8a?w=400&q=80',
  },
  {
    id: 11,
    name: 'Whole Wheat Bread',
    price: 45,
    unit: '1 loaf (400g)',
    image: 'https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80',
    badge: 'organic',
  },
  {
    id: 12,
    name: 'Farm Fresh White Eggs',
    price: 75,
    originalPrice: 90,
    unit: '10 pcs',
    image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80',
    discount: '15% OFF',
  },
  {
    id: 13,
    name: 'Fresh Potatoes',
    price: 30,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    badge: 'best_seller',
  },
  {
    id: 14,
    name: 'Cheddar Cheese Block',
    price: 240,
    originalPrice: 280,
    unit: '200 g',
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
    discount: '14% OFF',
  },
  {
    id: 15,
    name: '100% Orange Juice',
    price: 110,
    unit: '1 Litre',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  },
  {
    id: 16,
    name: 'Classic Salted Chips',
    price: 50,
    unit: '150 g',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    badge: 'deal',
  },
];
