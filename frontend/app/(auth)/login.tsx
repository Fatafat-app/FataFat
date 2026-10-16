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
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View as any;

const { width, height } = Dimensions.get('window');

// ─── Brand Colors ───────────────────────────────────────────────────────────
const BRAND_ORANGE = '#FF6B00';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const INPUT_BG = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

// ─── Carousel Posters (1173 x 1341 ratio) ───────────────────────────────────
// Placed vibrant Ftafat brand posters first so top status bar area is seamless & dark/red
const CAROUSEL_IMAGES = [
  require('../../assets/login screen/Everything You Need, Ftafat-2.png'),
  require('../../assets/login screen/Ftafat_ Food, Groceries & More.png'),
  require('../../assets/login screen/Ftafat_ Freshness Delivered Fast-3.png'),
  require('../../assets/login screen/Cravings Delivered in Minutes-1.png'),
  require('../../assets/login screen/Ftafat Grocery Delivery Poster.png'),
];

// ─── Hero Carousel with Top Corner Design at Status Bar / Mobile Time ───────
function FullWidthHeroBanner({ bannerH, topInset }: { bannerH: number; topInset: number }) {
  const ref = useRef<any>(null);
  const [active, setActive] = useState(0);
  const cur = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (cur.current + 1) % CAROUSEL_IMAGES.length;
      ref.current?.scrollToIndex({ index: next, animated: true });
      cur.current = next;
      setActive(next);
    }, 3400);
    return () => clearInterval(t);
  }, []);

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    cur.current = i;
    setActive(i);
  };

  const cornerTop = Math.max(topInset * 0.35, 10);

  return (
    <View style={[styles.heroContainer, { height: bannerH }]}>
      <FlatList
        ref={ref}
        data={CAROUSEL_IMAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_: any, i: number) => String(i)}
        getItemLayout={(_: any, i: number) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.slideItem, { width, height: bannerH }]}>
            <Image
              source={item}
              style={[styles.heroImage, { width, height: bannerH }]}
              resizeMode="cover"
            />
          </View>
        )}
      />

      {/* ── TOP CORNER DESIGN (Placed at the very top where the mobile time sits) ── */}
      <View style={[styles.cornerBracketLeft, { top: cornerTop }]} />
      <View style={[styles.cornerBracketRight, { top: cornerTop }]} />

      {/* Floating Dot Indicators */}
      <View style={styles.dotsRow}>
        {CAROUSEL_IMAGES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen Component ──────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const usableH = height - insets.top - insets.bottom;

  // Include top inset so the image extends behind the mobile status bar (time/clock)
  const BANNER_H = Math.min(
    Math.round(width * (1341 / 1173)),
    Math.round(usableH * 0.52)
  ) + insets.top;

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pressIn  = () => (scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }));
  const pressOut = () => (scale.value = withSpring(1,    { damping: 15, stiffness: 400 }));

  // Smooth slide-up offset so the box & button sit comfortably above the mobile keyboard
  const keyboardOffset = useSharedValue(0);
  const cardShiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardOffset.value }],
  }));

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
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10)
      return Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
    try {
      setLoading(true);
      const full = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      const res = await authService.sendOtp({ phone: full });
      setIsNewUser(!!res.isNewUser);
      setIsOtpSent(true);
      if (res.otp) {
        setOtp(String(res.otp));
        Alert.alert('🔐 Dev OTP', `Your test OTP is: ${res.otp}`, [{ text: 'Got it!' }]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4)
      return Alert.alert('Invalid OTP', 'Please enter the OTP code');
    try {
      setLoading(true);
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const full = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      const data = await authService.verifyOtp({ phone: full, otp: cleanOtp });
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

  const isPhoneValid = phone.replace(/[^0-9]/g, '').length === 10;

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }

    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, () => {
      keyboardOffset.value = withTiming(-80, { duration: 240 });
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardOffset.value = withTiming(0, { duration: 200 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="transparent"
      />

      {/* ══════════════════════════════════════════
          TOP — Full width image extending behind status bar (mobile time)
          ══════════════════════════════════════════ */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ width, height: BANNER_H }}>
          <FullWidthHeroBanner bannerH={BANNER_H} topInset={insets.top} />
        </View>
      </TouchableWithoutFeedback>

      {/* ══════════════════════════════════════════
          BOTTOM — Sign in section (Smoothly slides up on focus)
          ══════════════════════════════════════════ */}
      <AnimatedView style={[styles.kavWrap, cardShiftStyle]}>
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ── STEP 1: Phone Input ───────────────────────────────────── */}
          {!isOtpSent && (
            <AnimatedView entering={FadeIn.duration(260)}>

              {/* Title: "Sign in with phone" (Clean, NO F logo) */}
              <View style={styles.titleWrap}>
                <Text style={styles.title}>Sign in with phone</Text>
                <Text style={styles.subText}>
                  {isNewUser
                    ? 'A new account will be created for you'
                    : 'Enter your 10-digit mobile number'}
                </Text>
              </View>

              {/* Phone Input: Left Flag Box + Right Phone Box */}
              <View style={styles.phoneRow}>
                {/* Left Flag Box */}
                <View style={styles.countryBox}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                  <Ionicons name="caret-down" size={10} color="#64748B" />
                </View>

                {/* Right Phone Input Box with active Orange Focus */}
                <View
                  style={[
                    styles.phoneInputBox,
                    isPhoneFocused && styles.phoneInputBoxFocused,
                  ]}
                >
                  <Text style={styles.codeText}>+91</Text>
                  <TextInput
                    style={styles.phoneTextInput}
                    placeholder="Enter Phone Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(val: string) => setPhone(val.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    onFocus={() => {
                      setIsPhoneFocused(true);
                      keyboardOffset.value = withTiming(-80, { duration: 240 });
                    }}
                    onBlur={() => {
                      setIsPhoneFocused(false);
                      keyboardOffset.value = withTiming(0, { duration: 200 });
                    }}
                    autoFocus
                  />
                  {isPhoneValid && (
                    <Ionicons name="checkmark-circle" size={19} color="#22C55E" />
                  )}
                </View>
              </View>

              {/* Continue Button — ALWAYS Vibrant Brand Orange */}
              <AnimatedView style={[animStyle, { marginTop: 18 }]}>
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={handleSendOtp}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.continueBtnText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </AnimatedView>

            </AnimatedView>
          )}

          {/* ── STEP 2: OTP Verification ──────────────────────────────── */}
          {isOtpSent && (
            <AnimatedView entering={SlideInRight.duration(260)}>

              <View style={styles.titleWrap}>
                <Text style={styles.title}>
                  {isNewUser ? 'Create Account' : 'Verify Phone Number'}
                </Text>
                <Text style={styles.subText}>Enter 6-digit code sent to +91 {phone}</Text>
              </View>

              {/* OTP Input */}
              <View style={styles.otpInputBox}>
                <TextInput
                  style={styles.otpTextInput}
                  placeholder="• • • •"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(val: string) => setOtp(val.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  autoFocus
                  onFocus={() => {
                    keyboardOffset.value = withTiming(-80, { duration: 240 });
                  }}
                  onBlur={() => {
                    keyboardOffset.value = withTiming(0, { duration: 200 });
                  }}
                />
              </View>

              {/* Verify Button — ALWAYS Vibrant Brand Orange */}
              <AnimatedView style={animStyle}>
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={handleVerifyOtp}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.continueBtnText}>
                      {isNewUser ? 'Create Account & Continue' : 'Verify and proceed'}
                    </Text>
                  )}
                </TouchableOpacity>
              </AnimatedView>

              {/* Resend / Change Number */}
              <View style={styles.otpLinksRow}>
                <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={styles.linkBtn}>
                  <Ionicons name="refresh" size={13} color={BRAND_ORANGE} />
                  <Text style={[styles.linkText, { color: BRAND_ORANGE }]}>Resend Code</Text>
                </TouchableOpacity>
                <View style={styles.linkDot} />
                <TouchableOpacity
                  onPress={() => { setIsOtpSent(false); setOtp(''); }}
                  disabled={loading}
                  style={styles.linkBtn}
                >
                  <Ionicons name="pencil" size={13} color="#64748B" />
                  <Text style={[styles.linkText, { color: '#64748B' }]}>Change Number</Text>
                </TouchableOpacity>
              </View>

            </AnimatedView>
          )}

          {/* ── Quick Dev Test Accounts (Small helper at bottom) ──────── */}
          <View style={styles.quickDevWrap}>
            <Text style={styles.quickDevLabel}>DEV TEST ACCOUNTS</Text>
            <View style={styles.quickDevRow}>
              <TouchableOpacity
                style={styles.quickDevChip}
                onPress={() => quickLogin('+919999999999')}
                disabled={loading}
              >
                <Ionicons name="shield-checkmark" size={11} color="#EA580C" />
                <Text style={styles.quickDevText}>Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDevChip}
                onPress={() => quickLogin('+919876543210')}
                disabled={loading}
              >
                <Ionicons name="restaurant" size={11} color="#16A34A" />
                <Text style={styles.quickDevText}>Owner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDevChip}
                onPress={() => quickLogin('+919811122233')}
                disabled={loading}
              >
                <Ionicons name="bicycle" size={11} color="#DC2626" />
                <Text style={styles.quickDevText}>Rider</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDevChip}
                onPress={() => quickLogin('+919822233344')}
                disabled={loading}
              >
                <Ionicons name="person" size={11} color="#7C3AED" />
                <Text style={styles.quickDevText}>User</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Terms & Policy Footer ─────────────────────────────────── */}
          <View style={styles.termsFooter}>
            <Text style={styles.termsIntro}>By continuing, you agree to our</Text>
            <View style={styles.termsLinksRow}>
              <Text style={styles.termsLink}>Terms of Service</Text>
              <Text style={styles.termsDot}>•</Text>
              <Text style={styles.termsLink}>Privacy Policy</Text>
              <Text style={styles.termsDot}>•</Text>
              <Text style={styles.termsLink}>Content Policy</Text>
            </View>
          </View>

        </ScrollView>
      </AnimatedView>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Hero Container ────────────────────────────────────────────────────────
  heroContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  slideItem: {
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
  },
  cornerBracketLeft: {
    position: 'absolute',
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 12,
    borderColor: BRAND_ORANGE,
    zIndex: 10,
  },
  cornerBracketRight: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 12,
    borderColor: BRAND_ORANGE,
    zIndex: 10,
  },

  // ── Dot Indicators ────────────────────────────────────────────────────────
  dotsRow: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  // ── Form Wrap ─────────────────────────────────────────────────────────────
  kavWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
    paddingBottom: 90,
  },
  scrollWrap: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
  },

  // ── Title Wrap (Centered, Clean, NO F logo) ───────────────────────────────
  titleWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1C',
    letterSpacing: -0.2,
  },
  subText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Phone Row (Flag Box + Phone Input Box) ────────────────────────────────
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  countryBox: {
    width: 68,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    backgroundColor: INPUT_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  flagText: {
    fontSize: 20,
  },
  phoneInputBox: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    backgroundColor: INPUT_BG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  phoneInputBoxFocused: {
    borderColor: BRAND_ORANGE,
    backgroundColor: '#FFFFFF',
  },
  codeText: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND_ORANGE,
    marginRight: 8,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    color: TEXT_DARK,
    height: '100%',
  },

  // ── Continue Button (ALWAYS Vibrant Brand Orange) ─────────────────────────
  continueBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: BRAND_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: BRAND_ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── OTP Screen Specific ───────────────────────────────────────────────────
  otpInputBox: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND_ORANGE,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  otpTextInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 18,
    color: TEXT_DARK,
    textAlign: 'center',
    width: '100%',
  },
  otpLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  // ── Quick Dev Test Logins (Small chips at bottom) ─────────────────────────
  quickDevWrap: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  quickDevLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  quickDevRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  quickDevChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    gap: 4,
  },
  quickDevText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },

  // ── Terms & Policy Footer ─────────────────────────────────────────────────
  termsFooter: {
    alignItems: 'center',
    marginTop: 2,
    paddingBottom: 4,
  },
  termsIntro: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  termsLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 3,
  },
  termsLink: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  termsDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
