import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Typography } from '../../constants/Theme';
import { Card } from './Card';

interface FoodCardProps {
  name: string;
  price: string;
  imageUri: string;
  description?: string;
  rating?: number;
  isVeg?: boolean;
  offerBadge?: string;
  onAdd?: () => void;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function FoodCard({
  name,
  price,
  imageUri,
  description,
  rating,
  isVeg,
  offerBadge,
  onAdd,
  quantity = 0,
  onIncrement,
  onDecrement,
}: FoodCardProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.infoContainer}>
          {isVeg !== undefined && (
            <View style={styles.vegBadge}>
              <View style={[styles.vegDot, { backgroundColor: isVeg ? Colors.success : Colors.error }]} />
            </View>
          )}
          
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.price}>{price}</Text>
          
          {rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
          
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          
          {offerBadge && (
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{offerBadge}</Text>
            </View>
          )}
          
          <View style={styles.actionContainer}>
            {quantity > 0 ? (
              <View style={styles.quantityControls}>
                <TouchableOpacity onPress={onDecrement} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={onIncrement} style={styles.qtyBtn}>
                  <Ionicons name="add" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
                <Text style={styles.addText}>ADD</Text>
                <Ionicons name="add" size={16} color={Colors.primary} style={styles.addIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
    paddingRight: 16,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 2,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    ...Typography.title,
    fontSize: 16,
    marginBottom: 4,
  },
  price: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 4,
  },
  description: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  imageContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
  },
  image: {
    width: 130,
    height: 110,
    borderRadius: Radii.lg,
  },
  offerBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  offerText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    ...Shadows.medium,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
  },
  addText: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  addIcon: {
    position: 'absolute',
    right: 4,
    top: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    height: 36,
  },
  qtyBtn: {
    width: 32,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 14,
    width: 24,
    textAlign: 'center',
  },
});
