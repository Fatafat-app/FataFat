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
import { Ionicons } from '@expo/vector-icons';
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


const getCategoryColor = (name) => {
  if (!name) return '#E8F5E9';
  const lower = name.toLowerCase();
  if (lower.includes('veg') || lower.includes('fruit')) return '#E8F5E9'; // light green
  if (lower.includes('oil') || lower.includes('ghee')) return '#FFF3E0'; // light orange
  if (lower.includes('stationery') || lower.includes('school')) return '#F3E5F5'; // light purple
  if (lower.includes('snack') || lower.includes('beverage')) return '#FFEBEE'; // light red
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('egg')) return '#E3F2FD'; // light blue
  if (lower.includes('meat') || lower.includes('chicken')) return '#FFEBEE'; // light red
  const colors = ['#E8F5E9', '#FFF3E0', '#F3E5F5', '#FFEBEE', '#E3F2FD', '#E0F7FA'];
  return colors[name.length % colors.length];
};

const getCategoryIcon = (name) => {
  if (!name) return 'apps';
  const lower = name.toLowerCase();
  if (lower.includes('veg') || lower.includes('fruit')) return 'leaf';
  if (lower.includes('oil') || lower.includes('ghee')) return 'water';
  if (lower.includes('stationery') || lower.includes('school')) return 'book';
  if (lower.includes('snack') || lower.includes('beverage')) return 'fast-food';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('egg')) return 'pint';
  if (lower.includes('meat') || lower.includes('chicken')) return 'restaurant';
  return 'apps';
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
        .catch(() => { });
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
          const imageSource = { uri: getFallbackGroceryImage(cat.name) };
          const bgColor = getCategoryColor(cat.name);
          const iconName = getCategoryIcon(cat.name);
          
          return (
            <TouchableOpacity
              key={cat.id || cat._id}
              style={[styles.categoryCard, { backgroundColor: bgColor }, isActive && styles.categoryCardActive]}
              onPress={() => {
                const nextId = isActive ? null : cat.id;
                setInternalActiveId(nextId);
                onCategoryPress?.(cat);
              }}
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <Image source={imageSource} style={styles.categoryImage} resizeMode="cover" />
              </View>
              <View style={[styles.iconWrapper, { borderColor: bgColor }]}>
                <Ionicons name={iconName} size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#1E3D34" style={styles.arrowIcon} />
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


  // Pastel Card Design matching screenshot
  categoryCard: {
    width: 96,
    height: 145,
    borderRadius: 16,
    marginRight: 14,
    alignItems: 'center',
    paddingBottom: 10,
  },
  categoryCardActive: {
    borderWidth: 1.5,
    borderColor: '#1E3D34',
  },
  imageContainer: {
    width: '100%',
    height: 65,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2E5041',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginTop: -15, // overlaps the image
    marginBottom: 6,
  },
  categoryName: {
    fontFamily: BOLD_FONT,
    fontSize: 11.5,
    color: '#1F2937',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 14,
    height: 28,
  },
  arrowIcon: {
    marginTop: 4,
  }
});
