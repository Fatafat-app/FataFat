import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GRadius, GSpacing } from '../../constants/GroceryTheme';

interface GrocerySearchProps {
  onPress?: () => void;
}

export function GrocerySearch({ onPress }: GrocerySearchProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder="Search groceries, meals or essentials"
        placeholderTextColor="#9CA3AF"
        editable={false}
        pointerEvents="none"
      />
      <Ionicons name="mic-outline" size={19} color="#1E3D34" style={styles.micIcon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: GRadius.full,
    borderWidth: 1,
    borderColor: '#E5EAE3',
    height: 44,
    paddingHorizontal: 16,
    marginHorizontal: GSpacing.edgeMargin,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E3D34',
    fontWeight: '400',
  },
  micIcon: {
    marginLeft: 8,
  },
});

