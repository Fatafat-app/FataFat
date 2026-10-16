import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { useConfigStore } from '../store/config.store';
import { socketService } from '../services/socket.service';

const { width } = Dimensions.get('window');

// ─── Rotating High-Energy Taglines ──────────────────────────────────────────
const TAGLINES = [
  { text: 'Bhook lagi h? Ftafat aa rha h!', icon: 'flash' },
  { text: 'Cravings & Groceries in 10 minutes!', icon: 'bicycle' },
  { text: 'Pet pooja sabse badi pooja 🙏', icon: 'restaurant' },
  { text: 'Kyunki khana khud chalke nahi aata! 🏃', icon: 'flame' },
  { text: 'Ghar ka har saman, Ftafat aapke dwar! 🛍️', icon: 'basket' },
];
const chosenTagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { fetchBootstrap } = useConfigStore();
  const [showSplash, setShowSplash] = useState(true);

  // ── Animation Values ──────────────────────────────────────────────────────
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Android translucent status bar
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }

    // 2. Fetch live system configuration & vertical statuses
    fetchBootstrap();

    // 3. Initialize live socket connection
    socketService.connect().catch(() => {});

    // 4. Orchestrated Splash Animation
    Animated.parallel([
      // A. Logo springs in smoothly
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),

      // B. Taglines slide up smoothly
      Animated.sequence([
        Animated.delay(240),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.spring(contentTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // C. Progress line fills smoothly
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1750,
        useNativeDriver: false,
      }),
    ]).start();

    // 5. Hold and smoothly fade transition out to app
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isLoading) {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ── Vibrant & Bright Ftafat Gradient (Lighter, energetic, non-dark) ── */}
        <LinearGradient
          colors={['#E8331A', '#F75B10', '#FF7A00', '#FFA826']}
          start={{ x: 0.15, y: 0.05 }}
          end={{ x: 0.85, y: 0.95 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* ── Main Center Content ─────────────────────────────────────────── */}
        <View style={styles.centerBlock}>

          {/* Logo — Transparent Full Name "Ftafat" 3D Logo (from assets full Name Ftafat) */}
          <Animated.View
            style={[
              styles.logoTextWrap,
              {
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <Image
              source={require('../assets/logo/ftafat_full_name_transparent.png')}
              style={styles.logoTextImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Tagline & Progress ───────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* Dynamic Slogan */}
            <Text style={styles.taglineText}>{chosenTagline.text}</Text>

            {/* Sub-tagline */}
            <Text style={styles.subTagline}>Food • Groceries • Daily Essentials</Text>

            {/* Glowing Slim Progress Pill */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
          </Animated.View>

        </View>

        {/* ── Elegant Bottom Branding ─────────────────────────────────────── */}
        <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.footerText}>100% Safe & Contactless Delivery</Text>
          </View>
          <Text style={styles.copyrightText}>ftafat.com • Made with ❤️ in India</Text>
        </Animated.View>

      </Animated.View>
    );
  }

  // ── Auth & Role-Based Navigation ──────────────────────────────────────────
  if (!isAuthenticated || !user) return <Redirect href="/(auth)/login" />;

  const role = user.role;
  if (['admin', 'super_admin', 'ops_admin', 'catalog_admin', 'finance_admin', 'support_admin'].includes(role)) {
    return <Redirect href="/(admin)/dashboard" />;
  }
  if (['restaurant_owner', 'merchant_owner', 'merchant_staff'].includes(role)) {
    return <Redirect href="/(owner)/dashboard" />;
  }
  if (['delivery_partner', 'rider'].includes(role)) {
    return <Redirect href="/(rider)/dashboard" />;
  }

  return <Redirect href="/(tabs)" />;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8331A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // ── Center Content ────────────────────────────────────────────────────────
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingHorizontal: 24,
  },

  // ── Transparent Logo Text ─────────────────────────────────────────────────
  logoTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  logoTextImage: {
    width: width * 0.78,
    height: Math.round(width * 0.78 * (925 / 1177)),
  },

  // ── Tagline & Details ─────────────────────────────────────────────────────
  textContainer: {
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 26,
  },

  // ── Progress Bar ──────────────────────────────────────────────────────────
  progressTrack: {
    width: 130,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    gap: 4,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.78)',
    letterSpacing: 0.2,
  },
  copyrightText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.52)',
  },
});
