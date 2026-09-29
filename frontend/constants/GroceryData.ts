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
    image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 2,
    name: 'Daily meat',
    emoji: '🥩',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 3,
    name: 'Cold drinks',
    emoji: '🥤',
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 4,
    name: 'Quick snacks',
    emoji: '🥐',
    image: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 5,
    name: 'Household',
    emoji: '🧴',
    image: 'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 6,
    name: 'Dairy',
    emoji: '🥛',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 7,
    name: 'Bakery',
    emoji: '🍞',
    image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
  {
    id: 8,
    name: 'Organic',
    emoji: '🌿',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=150',
    bg: '#FFFFFF',
  },
];

export const GROCERY_SPECIAL_DEALS: GroceryProduct[] = [
  {
    id: 1,
    name: 'Organic Banana',
    price: 1.50,
    unit: '/bunch',
    image: 'https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: 'deal',
  },
  {
    id: 2,
    name: 'Baby Spinach Fresh',
    price: 3.40,
    unit: '/bunch',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: 'best_seller',
    rating: 4.9,
  },
  {
    id: 3,
    name: 'Red Apples',
    price: 2.80,
    unit: '/kg',
    image: 'https://images.pexels.com/photos/672101/pexels-photo-672101.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: 'organic',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Fresh Broccoli',
    price: 1.90,
    unit: '/piece',
    image: 'https://images.pexels.com/photos/1078018/pexels-photo-1078018.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: 'organic',
  },
];

export const GROCERY_TRENDING: GroceryProduct[] = [
  {
    id: 5,
    name: 'Cherry Tomatoes',
    price: 0.22,
    originalPrice: 1.45,
    unit: '290g pack',
    image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
    discount: '40% off',
  },
  {
    id: 6,
    name: 'Chicken Fillet Fresh',
    price: 8.22,
    originalPrice: 14.22,
    unit: '500g',
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400',
    discount: '40% off',
  },
  {
    id: 7,
    name: 'Strawberry Jam',
    price: 1.22,
    unit: '320ml jar',
    image: 'https://images.pexels.com/photos/5765/food-red-sweet-fruit.jpg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 8,
    name: 'Red Cabbage Premium',
    price: 4.10,
    unit: '1 pc',
    image: 'https://images.pexels.com/photos/2893635/pexels-photo-2893635.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 9,
    name: 'Greek Yogurt',
    price: 2.50,
    originalPrice: 3.80,
    unit: '400g',
    image: 'https://images.pexels.com/photos/1394085/pexels-photo-1394085.jpeg?auto=compress&cs=tinysrgb&w=400',
    discount: '35% off',
  },
  {
    id: 10,
    name: 'Mixed Bell Peppers',
    price: 1.80,
    unit: '3 pack',
    image: 'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];
