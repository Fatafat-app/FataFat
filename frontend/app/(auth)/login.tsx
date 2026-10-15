import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import Animated, {
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CAROUSEL_IMAGES = [
  require('../../assets/login screen/Cravings Delivered in Minutes-1.png'),
  require('../../assets/login screen/Everything You Need, Ftafat-2.png'),
  require('../../assets/login screen/Ftafat Grocery Delivery Poster.png'),
  require('../../assets/login screen/Ftafat_ Food, Groceries & More.png'),
  require('../../assets/login screen/Ftafat_ Freshness Delivered Fast-3.png'),
];

const WAVE_HEIGHT = 44; // white wave that overlaps carousel bottom

// ─── Image Carousel with wave ─────────────────────────────────────────────────
function ImageCarousel({ imgH }: { imgH: number }) {
  const ref = useRef<FlatList>(null);
  const [active, setActive] = useState(0);
  const cur = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (cur.current + 1) % CAROUSEL_IMAGES.length;
      ref.current?.scrollToIndex({ index: next, animated: true });
      cur.current = next;
      setActive(next);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    cur.current = i;
    setActive(i);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={ref}
        data={CAROUSEL_IMAGES}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Image source={item} style={{ width, height: imgH }} resizeMode="cover" />
        )}
      />

      {/* Dots — sit above the wave */}
      <View style={[styles.dotsRow, { bottom: WAVE_HEIGHT + 10 }]}>
        {CAROUSEL_IMAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>

      {/* ── White wave mask at carousel bottom ── */}
      <View style={styles.waveMask} />
    </View>
  );
}

// ─── Quick account badge ──────────────────────────────────────────────────────
function QuickBadge({
  label, icon, color, onPress, disabled,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <TouchableOpacity style={styles.quickBadge} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.quickText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const usableH = height - insets.top - insets.bottom;
  const CAROUSEL_H = usableH * 0.52; // 52% — full image, no top cut

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pressIn  = () => (scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }));
  const pressOut = () => (scale.value = withSpring(1,    { damping: 15, stiffness: 400 }));

  const goHome = (role?: string) => {
    if (['admin','super_admin','ops_admin','catalog_admin','finance_admin','support_admin'].includes(role ?? ''))
      return router.replace('/(admin)/dashboard');
    if (['restaurant_owner','merchant_owner','merchant_staff'].includes(role ?? ''))
      return router.replace('/(owner)/dashboard');
    if (['delivery_partner','rider'].includes(role ?? ''))
      return router.replace('/(rider)/dashboard');
    router.replace('/(tabs)');
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10)
      return Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
    try {
      setLoading(true);
      const full = phone.startsWith('+') ? phone : `+91${phone}`;
      const res = await authService.sendOtp({ phone: full });
      setIsNewUser(!!res.isNewUser);
      setIsOtpSent(true);
      if (res.otp)
        Alert.alert('🔐 Dev OTP', `Your test OTP is: ${res.otp}`, [{ text: 'Got it!' }]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4)
      return Alert.alert('Invalid OTP', 'Please enter the OTP code');
    try {
      setLoading(true);
      const full = phone.startsWith('+') ? phone : `+91${phone}`;
      const data = await authService.verifyOtp({ phone: full, otp });
      setUser(data.user);
      data.isNewUser ? router.replace('/(auth)/onboarding') : goHome(data.user?.role);
    } catch (e: any) {
      Alert.alert('Verification Failed', e.response?.data?.message ?? 'Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  const quickLogin = async (p: string) => {
    try {
      setLoading(true);
      const data = await authService.loginWithPassword({ phone: p, password: 'Password@123' });
      setUser(data.user);
      goHome(data.user?.role);
    } catch (e: any) {
      Alert.alert('Login Error', e.response?.data?.message ?? 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ══════════════════════════════════════════
          TOP — Scrolling carousel  (FIXED, never moves)
          ══════════════════════════════════════════ */}
      <View style={[styles.carouselBox, { height: CAROUSEL_H }]}>
        <ImageCarousel imgH={CAROUSEL_H} />
      </View>

      {/* ══════════════════════════════════════════
          BOTTOM — Sign in card  (keyboard-aware)
          Overlaps carousel by WAVE_HEIGHT - 8
          ══════════════════════════════════════════ */}
      <KeyboardAvoidingView
        style={[styles.kavWrap, { marginTop: -(WAVE_HEIGHT - 8) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ── STEP 1: Phone ─────────────────────────────────────────── */}
          {!isOtpSent && (
            <Animated.View entering={FadeIn.duration(300)}>

              {/* Logo + title */}
              <View style={styles.titleRow}>
                <View style={styles.logoBox}>
                  <Image
                    source={require('../../assets/logo/Ftafat logo.jpeg')}
                    style={styles.logoImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Sign in with phone</Text>
                  <Text style={styles.sub}>
                    {isNewUser
                      ? 'A new account will be created for you'
                      : "We'll send you a verification code"}
                  </Text>
                </View>
              </View>

              {isNewUser && (
                <View style={styles.badge}>
                  <Ionicons name="sparkles" size={13} color="#D97706" />
                  <Text style={styles.badgeText}>New account will be created for you!</Text>
                </View>
              )}

              {/* Phone input */}
              <View style={styles.inputBox}>
                <View style={styles.countryWrap}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={styles.cc}>+91</Text>
                  <Ionicons name="caret-down" size={10} color="#9CA3AF" />
                </View>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.inputText}
                  placeholder="Phone number"
                  placeholderTextColor="#B0B8C1"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  autoFocus
                />
                {phone.length === 10 && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ marginRight: 14 }} />
                )}
              </View>

              <Animated.View style={animStyle}>
                <TouchableOpacity
                  style={styles.mainBtn}
                  onPress={handleSendOtp}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  activeOpacity={1}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.mainBtnText}>Send OTP</Text>
                      <View style={styles.mainBtnCircle}>
                        <Ionicons name="arrow-forward" size={20} color="#FF6B00" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

            </Animated.View>
          )}

          {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
          {isOtpSent && (
            <Animated.View entering={SlideInRight.duration(300)}>

              <View style={styles.titleRow}>
                <View style={styles.logoBox}>
                  <Image
                    source={require('../../assets/logo/Ftafat logo.jpeg')}
                    style={styles.logoImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {isNewUser ? 'Create Account' : 'Verify Phone Number'}
                  </Text>
                  <Text style={styles.sub}>Enter code sent to +91 {phone}</Text>
                </View>
              </View>

              {isNewUser && (
                <View style={styles.badge}>
                  <Ionicons name="sparkles" size={13} color="#D97706" />
                  <Text style={styles.badgeText}>Verify to get started 🎉</Text>
                </View>
              )}

              <View style={[styles.inputBox, { justifyContent: 'center' }]}>
                <TextInput
                  style={[styles.inputText, styles.otpText]}
                  placeholder="• • • •"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                  autoFocus
                />
              </View>

              <Animated.View style={animStyle}>
                <TouchableOpacity
                  style={styles.mainBtn}
                  onPress={handleVerifyOtp}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  activeOpacity={1}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.mainBtnText}>
                        {isNewUser ? 'Verify & Create Account' : 'Verify & Sign In'}
                      </Text>
                      <View style={styles.mainBtnCircle}>
                        <Ionicons name="checkmark" size={20} color="#FF6B00" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.otpLinks}>
                <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={styles.linkBtn}>
                  <Ionicons name="refresh" size={13} color="#FF6B00" />
                  <Text style={styles.linkOrange}>Resend Code</Text>
                </TouchableOpacity>
                <View style={styles.linkDot} />
                <TouchableOpacity
                  onPress={() => { setIsOtpSent(false); setOtp(''); }}
                  disabled={loading}
                  style={styles.linkBtn}
                >
                  <Ionicons name="pencil" size={13} color="#6B7280" />
                  <Text style={styles.linkGray}>Change Number</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          )}

          {/* ── Quick Test Accounts ────────────────────────────────────── */}
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>Quick test accounts</Text>
            <View style={styles.quickRow}>
              <QuickBadge label="Admin" icon="person-circle-outline" color="#FF6B00"
                onPress={() => quickLogin('+919999999999')} disabled={loading} />
              <QuickBadge label="Owner" icon="ribbon-outline" color="#16A34A"
                onPress={() => quickLogin('+919876543210')} disabled={loading} />
              <QuickBadge label="Rider" icon="bicycle-outline" color="#DC2626"
                onPress={() => quickLogin('+919811122233')} disabled={loading} />
              <QuickBadge label="User" icon="people-outline" color="#7C3AED"
                onPress={() => quickLogin('+919822233344')} disabled={loading} />
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to Ftafat's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Bottom decoration */}
          <View style={styles.bottomDecor}>
            <View style={styles.decorLine} />
            <Ionicons name="heart" size={14} color="#FF6B00" />
            <View style={styles.decorLine} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Carousel ──────────────────────────────────────────────────────────────
  carouselBox: {
    width: '100%',
    flexShrink: 0,
    overflow: 'visible',
  },
  dotsRow: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { height: 7, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: '#FFFFFF' },
  dotInactive: { width: 7, backgroundColor: 'rgba(255,255,255,0.5)' },

  // White wave mask — sits at bottom of carousel
  waveMask: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: WAVE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },

  // ── KAV + scroll ──────────────────────────────────────────────────────────
  kavWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollWrap: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 16,
  },

  // ── Title row ─────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 18,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImg: { width: 48, height: 48 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 7,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: { fontSize: 12.5, color: '#92400E', fontWeight: '500', flex: 1 },

  // ── Phone input ───────────────────────────────────────────────────────────
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: '100%',
    gap: 5,
  },
  flag: { fontSize: 19 },
  cc: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  inputDivider: { width: 1.5, height: 26, backgroundColor: '#E5E7EB' },
  inputText: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    height: '100%',
  },
  otpText: {
    textAlign: 'center',
    letterSpacing: 18,
    fontSize: 26,
    fontWeight: '800',
  },

  // ── Main button ───────────────────────────────────────────────────────────
  mainBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 50,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  mainBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mainBtnCircle: {
    position: 'absolute',
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── OTP links ─────────────────────────────────────────────────────────────
  otpLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 14,
  },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  linkOrange: { color: '#FF6B00', fontWeight: '700', fontSize: 13 },
  linkGray: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  linkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },

  // ── Quick test accounts ───────────────────────────────────────────────────
  quickSection: {
    marginTop: 22,
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  quickBadge: {
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    minWidth: 68,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  // ── Terms ─────────────────────────────────────────────────────────────────
  terms: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 14,
    lineHeight: 17,
  },
  termsLink: { color: '#FF6B00', fontWeight: '600' },

  // ── Bottom decoration ─────────────────────────────────────────────────────
  bottomDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  decorLine: {
    width: 40,
    height: 1.5,
    backgroundColor: '#FFD4B0',
    borderRadius: 1,
  },
});
