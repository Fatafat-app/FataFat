import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { GColors, GRadius, GSpacing, GFontSize } from '../../constants/GroceryTheme';

export type FilterId = 'price' | 'popularity' | 'deals' | 'organic';

interface FilterItem {
  id: FilterId;
  label: string;
  hasChevron?: boolean;
}

const FILTERS: FilterItem[] = [
  { id: 'price', label: 'Price', hasChevron: true },
  { id: 'popularity', label: 'Popularity' },
  { id: 'deals', label: 'Deals' },
  { id: 'organic', label: 'Organic' },
];

interface GroceryFiltersProps {
  active: FilterId;
  onSelect: (id: FilterId) => void;
}

export function GroceryFilters({ active, onSelect }: GroceryFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {FILTERS.map((f) => {
        const isActive = f.id === active;
        return (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => onSelect(f.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                { color: isActive ? '#1E3D34' : '#374151' },
              ]}
            >
              {f.label}
            </Text>
            {f.hasChevron && (
              <Ionicons
                name="chevron-down"
                size={14}
                color={isActive ? '#1E3D34' : '#374151'}
                style={{ marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: GSpacing.lg,
  },
  container: {
    paddingHorizontal: GSpacing.edgeMargin,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: GRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#D4F468',
    borderColor: '#D4F468',
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    fontFamily: STYLISH_FONT,
  },
});

