import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Text, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

const { width } = Dimensions.get('window');

const BOLD_FONT = Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'System' });
const REG_FONT  = Platform.select({ ios: 'Georgia', android: 'serif', default: 'System' });

// Rotating funny taglines
const TAGLINES = [
  "Kyunki khana khud nahi chalke aata! 🏃",
  "Pet pooja sabse badi pooja 🙏🍛",
  "Bhaiya delivery pe hain... chai mat banana! ☕",
  "Ghar ka dard door, Ftafat hazir! 🛵💨",
  "Ek click, aur bhooka kaun? 😏",
];
const randomTagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  const logoScale    = useRef(new Animated.Value(0.3)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo bounce in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      // Text fades in after logo
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Hold
      Animated.delay(1400),
      // Fade out everything
      Animated.timing(containerOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(() => setShowSplash(false));
  }, []);

  if (showSplash || isLoading) {
    return (
      <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
        {/* Decorative bg circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Logo with bounce */}
        <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, alignItems: 'center' }}>
          {/* Wrapper zooms image to crop white JPEG border */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/app_icon.jpeg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Funny tagline fades in */}
        <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
          <Text style={styles.tagline}>{randomTagline}</Text>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, { opacity: 1 }]} />
            <View style={[styles.dot, { opacity: 0.6 }]} />
            <View style={[styles.dot, { opacity: 0.3 }]} />
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  if (!isAuthenticated || !user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'admin') return <Redirect href="/(admin)/dashboard" />;
  if (user.role === 'restaurant_owner') return <Redirect href="/(owner)/dashboard" />;
  if (user.role === 'delivery_partner') return <Redirect href="/(rider)/dashboard" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -width * 0.6,
    right: -width * 0.5,
  },
  circle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(0,0,0,0.07)',
    bottom: -width * 0.5,
    left: -width * 0.4,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255,200,0,0.12)',
    bottom: width * 0.1,
    right: -width * 0.1,
  },

  // Logo — wrapper clips the white JPEG border by zooming image 120%
  logoWrapper: {
    width: width * 0.56,
    height: width * 0.56,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#FF6000', // fallback same as bg
    marginBottom: 36,
  },
  logoImage: {
    width: '120%',   // 120% zooms in → white border gets cropped
    height: '120%',
    left: '-10%',    // re-center after zoom
    top: '-10%',
  },

  // Text block
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tagline: {
    fontFamily: BOLD_FONT,
    fontSize: 17,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
});
