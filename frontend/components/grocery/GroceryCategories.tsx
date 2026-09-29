import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GColors, GSpacing } from '../../constants/GroceryTheme';
import { useRouter } from 'expo-router';
import { GroceryCategory } from '../../constants/GroceryData';
import { groceryService } from '../../services/grocery.service';

interface GroceryCategoriesProps {
  categories?: GroceryCategory[];
  activeCategoryId?: string | number | null;
  onCategoryPress?: (category: GroceryCategory) => void;
}

const getFallbackGroceryImage = (name: string) => {
  if (!name) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
  const lower = name.toLowerCase();
  
  // New Set of Vibrant & Clean Images
  if (lower.includes('veg') || lower.includes('tomato') || lower.includes('onion')) 
    return 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&q=80'; // Mixed Vegetables
  
  if (lower.includes('fruit') || lower.includes('apple') || lower.includes('banana')) 
    return 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80'; // Pineapples / Vibrant Fruits
  
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('egg') || lower.includes('cheese')) 
    return 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=400&q=80'; // Dairy/Milk cooking
  
  if (lower.includes('snack') || lower.includes('chip') || lower.includes('biscuit')) 
    return 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80'; // Chips and snacks
  
  if (lower.includes('meat') || lower.includes('chicken') || lower.includes('fish') || lower.includes('mutton')) 
    return 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&q=80'; // Raw meat steak
  
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('cola')) 
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'; // Soft drinks
  
  if (lower.includes('bakery') || lower.includes('bread') || lower.includes('cake')) 
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'; // Bread bakery
  
  if (lower.includes('sweet') || lower.includes('candy') || lower.includes('chocolate')) 
    return 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80'; // Candies
  
  if (lower.includes('personal') || lower.includes('care') || lower.includes('bath') || lower.includes('shampoo')) 
    return 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80'; // Personal care products

  if (lower.includes('clean') || lower.includes('home') || lower.includes('wash')) 
    return 'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'; // Cleaning supplies
  
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'; // Fallback Supermarket
};

export function GroceryCategories({
  categories: propCategories,
  activeCategoryId,
  onCategoryPress,
}: GroceryCategoriesProps) {
  const [categories, setCategories] = useState<GroceryCategory[]>(propCategories || []);
  const [internalActiveId, setInternalActiveId] = useState<string | number | null>(null);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    } else if (!propCategories) {
      groceryService
        .getCategories()
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            const mapped: GroceryCategory[] = fetched.map((c) => ({
              id: c._id || c.slug,
              _id: c._id,
              name: c.name,
              slug: c.slug,
              emoji: c.emoji || '🛒',
              image: c.image,
              bg: c.bg || '#FFFFFF',
            }));
            setCategories(mapped);
          }
        })
        .catch(() => {});
    }
  }, [propCategories]);

  const currentActiveId = activeCategoryId !== undefined ? activeCategoryId : internalActiveId;
  const router = useRouter();

  if (categories.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={() => router.push('/grocery/categories')} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Explore All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = currentActiveId === cat.id || (cat._id && currentActiveId === cat._id);
          
          // Force use of our highly curated working images to guarantee aesthetic look
          const imageSource = { uri: getFallbackGroceryImage(cat.name) };

          return (
            <TouchableOpacity
              key={cat.id || cat._id}
              style={[styles.categoryItemWrapper, isActive && styles.categoryItemWrapperActive]}
              onPress={() => {
                const nextId = isActive ? null : cat.id;
                setInternalActiveId(nextId);
                onCategoryPress?.(cat);
              }}
              activeOpacity={0.9}
            >
              <View style={styles.categoryItemInner}>
                <Image source={imageSource} style={styles.categoryImage} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                  style={styles.categoryGradientOverlay}
                >
                  <Text style={[styles.categoryName, isActive && styles.categoryNameActive]} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: GSpacing.lg,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GSpacing.edgeMargin,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: BOLD_FONT,
    color: '#1E3D34',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#4ADE80',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: GSpacing.edgeMargin,
    gap: 14,
    paddingBottom: 16,
  },
  

  // Immersive Card Design
  categoryItemWrapper: {
    marginRight: 16,
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  categoryItemWrapperActive: {
    shadowColor: '#4ADE80',
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ translateY: -4 }],
  },
  categoryItemInner: {
    width: 105, 
    height: 140,
    borderRadius: 24,
    overflow: 'hidden', 
    backgroundColor: '#F3F4F6',
  },
  categoryImage: { 
    width: '100%', 
    height: '100%', 
    position: 'absolute' 
  },
  categoryGradientOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '65%',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 14,
  },
  categoryName: { 
    fontFamily: BOLD_FONT, 
    fontSize: 14.5, 
    color: '#FFFFFF', 
    textAlign: 'center', 
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  categoryNameActive: {
    color: '#4ADE80',
  },
});
