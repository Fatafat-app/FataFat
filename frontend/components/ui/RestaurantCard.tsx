import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Typography } from '../../constants/Theme';
import { Card } from './Card';

interface RestaurantCardProps {
  name: string;
  imageUri: string;
  cuisines: string;
  rating: number;
  deliveryTime: string;
  distance?: string;
  offerBadge?: string;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
}

export function RestaurantCard({
  name,
  imageUri,
  cuisines,
  rating,
  deliveryTime,
  distance,
  offerBadge,
  isFavorite = false,
  onPress,
  onFavoritePress,
}: RestaurantCardProps) {
  return (
    <Card style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        {offerBadge && (
          <View style={styles.offerBadge}>
            <Text style={styles.offerText}>{offerBadge}</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.favoriteBtn} onPress={onFavoritePress}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? Colors.error : Colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating}</Text>
            <Ionicons name="star" size={10} color={Colors.white} style={styles.starIcon} />
          </View>
        </View>
        
        <Text style={styles.cuisines} numberOfLines={1}>{cuisines}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{deliveryTime}</Text>
          </View>
          
          {distance && (
            <>
              <View style={styles.dot} />
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{distance}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: Radii.xl,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
  },
  offerBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.9)', // Blue accent for offers
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: Radii.lg,
  },
  offerText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...Typography.title,
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  ratingText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  starIcon: {
    marginLeft: 2,
  },
  cuisines: {
    ...Typography.bodySmall,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...Typography.caption,
    marginLeft: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 8,
  },
});
