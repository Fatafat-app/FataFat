import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { GColors, GSpacing } from '../../constants/GroceryTheme';
import { useRouter } from 'expo-router';
import { GroceryCategory } from '../../constants/GroceryData';
import { groceryService } from '../../services/grocery.service';

interface GroceryCategoriesProps {
  categories?: GroceryCategory[];
  activeCategoryId?: string | number | null;
  onCategoryPress?: (category: GroceryCategory) => void;
}

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
        .catch(() => {
          // Handle category fetch error
        });
    }
  }, [propCategories]);

  const currentActiveId = activeCategoryId !== undefined ? activeCategoryId : internalActiveId;

  const router = useRouter();

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => router.push('/grocery/categories')} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = currentActiveId === cat.id || (cat._id && currentActiveId === cat._id);
          return (
            <TouchableOpacity
              key={cat.id || cat._id}
              style={styles.chipWrapper}
              onPress={() => {
                const nextId = isActive ? null : cat.id;
                setInternalActiveId(nextId);
                onCategoryPress?.(cat);
              }}
              activeOpacity={0.8}
            >
              {/* White rounded card with image */}
              <View
                style={[
                  styles.cardBox,
                  isActive && styles.cardBoxActive,
                ]}
              >
                {cat.image ? (
                  <Image source={{ uri: cat.image }} style={styles.catImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.emoji}>{cat.emoji}</Text>
                )}
              </View>
              {/* Category Name below */}
              <Text
                style={[
                  styles.nameText,
                  { color: isActive ? GColors.primary : '#4B5563', fontWeight: isActive ? '700' : '500' },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
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
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GSpacing.edgeMargin,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3D34',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6C7D76',
  },
  scrollContent: {
    paddingHorizontal: GSpacing.edgeMargin,
    gap: 12,
  },
  chipWrapper: {
    alignItems: 'center',
    width: 68,
  },
  cardBox: {
    width: 64,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE6',
    shadowColor: '#1E3D34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 6,
    overflow: 'hidden',
    padding: 6,
  },
  cardBoxActive: {
    borderColor: '#1E3D34',
    backgroundColor: '#F3F7F2',
  },
  catImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  emoji: {
    fontSize: 26,
  },
  nameText: {
    fontSize: 11.5,
    textAlign: 'center',
  },
});
