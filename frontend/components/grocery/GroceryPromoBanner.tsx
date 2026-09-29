import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { GRadius, GSpacing } from '../../constants/GroceryTheme';
import { BackendGroceryBanner, groceryService } from '../../services/grocery.service';

interface GroceryPromoBannerProps {
  banners?: BackendGroceryBanner[];
  onBannerPress?: (banner: BackendGroceryBanner) => void;
}

export function GroceryPromoBanner({ banners: propBanners, onBannerPress }: GroceryPromoBannerProps) {
  const [banner, setBanner] = useState<BackendGroceryBanner | null>(
    propBanners && propBanners.length > 0 ? propBanners[0] : null
  );

  useEffect(() => {
    if (propBanners && propBanners.length > 0) {
      setBanner(propBanners[0]);
    } else if (!propBanners) {
      groceryService
        .getBanners()
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setBanner(fetched[0]);
          }
        })
        .catch(() => {
          // Banner error handling
        });
    }
  }, [propBanners]);

  if (!banner) {
    return null;
  }

  const title = banner.title;
  const subtitle = banner.subtitle || 'Shop now';
  const imageUrl = banner.image;

  return (
    <View style={styles.container}>
      {/* Text side */}
      <View style={styles.textSide}>
        <Text style={styles.highlight}>{title}</Text>
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => onBannerPress?.(banner)}
        >
          <Text style={styles.ctaText}>{banner.code ? `Use ${banner.code}` : subtitle}</Text>
        </TouchableOpacity>
      </View>

      {/* Image side */}
      <View style={styles.imageSide}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8F1D0',
    borderRadius: 22,
    marginHorizontal: GSpacing.edgeMargin,
    marginBottom: GSpacing.lg,
    height: 150,
    overflow: 'hidden',
  },
  textSide: {
    flex: 1.2,
    padding: 18,
    justifyContent: 'center',
  },
  highlight: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3D34',
    letterSpacing: -0.4,
    lineHeight: 24,
    marginBottom: 14,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3D34',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: GRadius.full,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  imageSide: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
