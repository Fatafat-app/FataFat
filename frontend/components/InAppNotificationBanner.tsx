import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../store/notification.store';
import { Typography, Colors } from '../constants/Theme';

export default function InAppNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeBanner = useNotificationStore((state) => state.activeBanner);
  const dismissBanner = useNotificationStore((state) => state.dismissBanner);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeBanner) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeBanner]);

  if (!activeBanner) {
    return null;
  }

  const handlePress = () => {
    const data = activeBanner.data;
    const type = activeBanner.type;
    dismissBanner();

    if (data?.orderId) {
      router.push(`/order/${data.orderId}`);
    } else {
      router.push('/notifications');
    }
  };

  const getIconAndColor = (type?: string) => {
    switch (type) {
      case 'order_status':
      case 'order':
        return { name: 'fast-food' as const, bg: '#FFEDD5', color: '#EA580C' };
      case 'grocery':
        return { name: 'basket' as const, bg: '#DCFCE7', color: '#16A34A' };
      case 'payment':
        return { name: 'checkmark-circle' as const, bg: '#DCFCE7', color: '#16A34A' };
      case 'promotion':
      case 'offer':
        return { name: 'gift' as const, bg: '#FCE7F3', color: '#DB2777' };
      case 'alert':
        return { name: 'warning' as const, bg: '#FEE2E2', color: '#DC2626' };
      default:
        return { name: 'notifications' as const, bg: '#EEF2FF', color: '#4F46E5' };
    }
  };

  const { name: iconName, bg: iconBg, color: iconColor } = getIconAndColor(activeBanner.type);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top + 6, 12),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={styles.container}
      >
        {/* Left Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {activeBanner.title}
            </Text>
            <Text style={styles.timeTag}>Now</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {activeBanner.body}
          </Text>
        </View>

        {/* Dismiss X */}
        <TouchableOpacity
          onPress={dismissBanner}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...Typography.title,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  timeTag: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  body: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
