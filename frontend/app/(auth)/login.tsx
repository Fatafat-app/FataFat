import React, { useState, useEffect } from 'react';
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
  ImageBackground,
  Image,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

// Stylish Font Family Selection
const STYLISH_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'System',
});

const BOLD_FONT = Platform.select({
  ios: 'Georgia-Bold',
  android: 'serif',
  default: 'System',
});

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '392432738097-bs54bnjhhjg873ufvdgi2g84vsuoei3p.apps.googleusercontent.com';
  const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // makeRedirectUri automatically generates the correct URI for both Expo Go and APK builds
  const redirectUri = makeRedirectUri({
    scheme: 'com.ftafat.app',
    path: 'auth/google',
  });

  // Expo Google Auth Request Hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (request?.redirectUri) {
      console.log('[Google Auth Redirect URI]:', request.redirectUri);
      console.log('[Google Auth Client ID]:', request.clientId);
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      handleGoogleAuthSuccess(response.authentication.accessToken, response.authentication.idToken);
    } else if (response?.type === 'error') {
      console.log('[Google Auth Error]:', response.error);
      Alert.alert('Google Sign-In Failed', response.error?.message || 'Authentication was cancelled or failed. Please try again.');
    } else if (response?.type === 'dismiss') {
      console.log('[Google Auth Dismissed]');
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (accessToken?: string, idToken?: string) => {
    try {
      setGoogleLoading(true);
      let email = '';
      let name = '';
      let avatar = '';
      let googleId = '';

      if (accessToken) {
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const userInfo = await userInfoRes.json();
          email = userInfo.email;
          name = userInfo.name;
          avatar = userInfo.picture;
          googleId = userInfo.id;
        } catch (e) {
          console.log('[Google User Info Fetch Error]', e);
        }
      }

      if (!email && !idToken) {
        Alert.alert('Google Sign-In', 'Could not retrieve your Google account details.');
        return;
      }

      const data = await authService.loginWithGoogle({
        idToken,
        email,
        name: name || (email ? email.split('@')[0] : 'Google User'),
        avatar,
        googleId: googleId || ('google_' + email.replace(/[^a-zA-Z0-9]/g, '_')),
      });
      setUser(data.user);
      navigateBasedOnRole(data.user?.role);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Google Sign-In failed.';
      Alert.alert('Google Sign-In Error', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      if (request) {
        await promptAsync();
      } else {
        Alert.alert('Google Sign-In', 'Google Auth is initializing. Please tap again.');
      }
    } catch (error: any) {
      console.log('[Google login error]', error);
      Alert.alert('Google Sign-In', error.message || 'Failed to open Google Sign-In');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Reanimated Button Scale
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const animatePressIn = () => {
    buttonScale.value = withSpring(0.92, { damping: 10, stiffness: 400 });
  };
  const animatePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  const navigateBasedOnRole = (userRole?: string) => {
    if (userRole === 'admin') {
      router.replace('/(admin)/dashboard');
    } else if (userRole === 'restaurant_owner') {
      router.replace('/(owner)/dashboard');
    } else if (userRole === 'delivery_partner') {
      router.replace('/(rider)/dashboard');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handlePasswordLogin = async () => {
    if (!phone || phone.length < 10 || !password) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number and password');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const data = await authService.loginWithPassword({ phone: fullPhone, password });
      setUser(data.user);
      navigateBasedOnRole(data.user?.role);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const res = await authService.sendOtp({ phone: fullPhone });
      setIsOtpSent(true);
      if (res.otp) {
        Alert.alert('Dev OTP', `Your test OTP is: ${res.otp}`);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid OTP code');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const data = await authService.verifyOtp({ phone: fullPhone, otp });
      setUser(data.user);
      navigateBasedOnRole(data.user?.role);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillPreset = (pPhone: string, pPass: string) => {
    setPhone(pPhone);
    setPassword(pPass);
    setAuthMode('password');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/login_bg_food.jpeg')}
      style={styles.fullScreenBg}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* BRANDING SECTION */}
            <View style={styles.brandingWrapper}>
              <Animated.View entering={FadeInDown.duration(800).springify()} style={{ alignItems: 'center' }}>
                <View style={styles.logoRow}>
                  <Image source={require('../../assets/images/logo_transparent.png')} style={styles.brandImage} resizeMode="contain" />
                </View>

                <Text style={styles.bhookLagi}>Bhook lagi?</Text>
                <Text style={styles.tagline}>Ftafat aa raha hai!</Text>

                <View style={styles.featuresRow}>
                  <FeatureIcon icon="restaurant-outline" text="Wide Variety" delay={200} />
                  <FeatureIcon icon="bicycle-outline" text="Fast Delivery" delay={300} />
                  <FeatureIcon icon="star-outline" text="Great Offers" delay={400} />
                </View>
              </Animated.View>
            </View>

            {/* LOGIN CARD */}
            <View style={styles.cardWrapper}>
              <Animated.View
                entering={FadeInUp.duration(800).delay(300).springify()}
                style={styles.card}
              >

                {authMode === 'password' && !isOtpSent && (
                  <Animated.View entering={FadeIn}>
                    <View style={styles.inputContainer}>
                      <View style={styles.countryCodeBox}>
                        <Text style={styles.flag}>🇮🇳</Text>
                        <Text style={styles.countryCodeText}>+91</Text>
                        <Ionicons name="caret-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
                      </View>
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Phone number"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={10}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <View style={styles.countryCodeBox}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                      </View>
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>

                    <Animated.View style={buttonAnimatedStyle}>
                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handlePasswordLogin}
                        onPressIn={animatePressIn}
                        onPressOut={animatePressOut}
                        disabled={loading}
                        activeOpacity={1}
                      >
                        <Text style={styles.continueButtonText}>Login Now</Text>
                        {loading ? (
                          <ActivityIndicator color="#FF6000" style={styles.arrowCircle} />
                        ) : (
                          <View style={styles.arrowCircle}>
                            <Ionicons name="arrow-forward" size={20} color="#D94E1B" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity onPress={() => setAuthMode('otp')} style={styles.toggleAuthBtn}>
                      <Text style={styles.toggleAuthText}>Or login with OTP instead</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {authMode === 'otp' && !isOtpSent && (
                  <Animated.View entering={FadeIn}>
                    <View style={styles.inputContainer}>
                      <View style={styles.countryCodeBox}>
                        <Text style={styles.flag}>🇮🇳</Text>
                        <Text style={styles.countryCodeText}>+91</Text>
                        <Ionicons name="caret-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
                      </View>
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Phone number"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={10}
                      />
                    </View>

                    <Animated.View style={buttonAnimatedStyle}>
                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleSendOtp}
                        onPressIn={animatePressIn}
                        onPressOut={animatePressOut}
                        disabled={loading}
                        activeOpacity={1}
                      >
                        <Text style={styles.continueButtonText}>Get OTP</Text>
                        {loading ? (
                          <ActivityIndicator color="#FF6000" style={styles.arrowCircle} />
                        ) : (
                          <View style={styles.arrowCircle}>
                            <Ionicons name="phone-portrait-outline" size={20} color="#D94E1B" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity onPress={() => setAuthMode('password')} style={styles.toggleAuthBtn}>
                      <Text style={styles.toggleAuthText}>Or login with Password instead</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {isOtpSent && (
                  <Animated.View entering={FadeIn}>
                    <Text style={styles.otpHeader}>Verify Number</Text>
                    <Text style={styles.otpSub}>OTP sent to +91 {phone}</Text>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.textInput, { textAlign: 'center', letterSpacing: 10, fontSize: 24 }]}
                        placeholder="••••"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={setOtp}
                        maxLength={6}
                        autoFocus
                      />
                    </View>

                    <Animated.View style={buttonAnimatedStyle}>
                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleVerifyOtp}
                        onPressIn={animatePressIn}
                        onPressOut={animatePressOut}
                        disabled={loading}
                        activeOpacity={1}
                      >
                        <Text style={styles.continueButtonText}>Verify & Login</Text>
                        {loading ? (
                          <ActivityIndicator color="#FF6000" style={styles.arrowCircle} />
                        ) : (
                          <View style={styles.arrowCircle}>
                            <Ionicons name="checkmark-done" size={20} color="#D94E1B" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 16 }}>
                      <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                        <Text style={{ color: '#D94E1B', fontWeight: 'bold', fontFamily: STYLISH_FONT }}>Resend Code</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsOtpSent(false)} disabled={loading}>
                        <Text style={{ color: '#6B7280', fontFamily: STYLISH_FONT }}>Change Number</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}

                {/* Google Sign-In Option */}
                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR CONTINUE WITH</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#4285F4" size="small" />
                  ) : (
                    <>
                      <View style={styles.googleIconCircle}>
                        <Ionicons name="logo-google" size={18} color="#EA4335" />
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Quick Demo Logins */}
                <View style={styles.presetSection}>
                  <Text style={styles.presetTitle}>⚡ Quick Test Accounts</Text>
                  <View style={styles.presetRow}>
                    <TouchableOpacity onPress={() => fillPreset('+919999999999', 'Password@123')} style={[styles.presetBadge, { backgroundColor: '#FFF5F0', borderColor: '#FFEDD5' }]}>
                      <Text style={[styles.presetText, { color: '#D94E1B' }]}>Admin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fillPreset('+919876543210', 'Password@123')} style={styles.presetBadge}>
                      <Text style={styles.presetText}>Owner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fillPreset('+919811122233', 'Password@123')} style={styles.presetBadge}>
                      <Text style={styles.presetText}>Rider</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fillPreset('+919822233344', 'Password@123')} style={styles.presetBadge}>
                      <Text style={styles.presetText}>User</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function FeatureIcon({ icon, text, delay }: { icon: keyof typeof Ionicons.glyphMap; text: string; delay: number }) {
  return (
    <Animated.View entering={BounceIn.delay(delay).springify()} style={styles.featureBox}>
      <View style={styles.featureCircle}>
        <Ionicons name={icon} size={22} color="#D94E1B" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullScreenBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FDF2E3',
  },
  backgroundImage: {
    resizeMode: 'stretch',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    justifyContent: 'center', // Centers the content beautifully vertically
  },
  brandingWrapper: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandImage: {
    width: 220,
    height: 70,
  },
  logoText: {
    fontSize: 48,
    fontFamily: BOLD_FONT,
    color: '#3E2723',
    marginLeft: 8,
    letterSpacing: -1,
  },
  bhookLagi: {
    fontSize: 22,
    fontFamily: BOLD_FONT,
    color: '#3E2723',
    textAlign: 'center',
    marginTop: 4,
  },
  tagline: {
    fontSize: 24,
    fontFamily: BOLD_FONT,
    color: '#D94E1B',
    textAlign: 'center',
    marginBottom: 28,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  featureBox: {
    alignItems: 'center',
    width: width * 0.22,
  },
  featureCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureText: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    fontWeight: '700',
    color: '#3E2723',
    textAlign: 'center',
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 18,
    marginBottom: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
    backgroundColor: '#F9FAFB',
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#374151',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: STYLISH_FONT,
    fontWeight: '600',
    color: '#1F2937',
    height: '100%',
  },
  continueButton: {
    backgroundColor: '#D94E1B',
    borderRadius: 18,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: BOLD_FONT,
  },
  arrowCircle: {
    position: 'absolute',
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleAuthBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  toggleAuthText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: STYLISH_FONT,
    fontWeight: '600',
  },
  otpHeader: {
    fontSize: 20,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  otpSub: {
    fontSize: 14,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  presetSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  presetTitle: {
    fontSize: 11,
    fontFamily: BOLD_FONT,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetBadge: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  presetText: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    fontWeight: '700',
    color: '#4B5563',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    fontSize: 11,
    fontFamily: BOLD_FONT,
    color: '#9CA3AF',
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    height: 54,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  googleIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  googleModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  googleModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  googleModalTitle: {
    fontSize: 20,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
    textAlign: 'center',
  },
  googleModalSubtitle: {
    fontSize: 13,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  googleAccountList: {
    gap: 10,
    marginBottom: 16,
  },
  googleAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: BOLD_FONT,
  },
  accountName: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#1F2937',
  },
  accountEmail: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    marginTop: 1,
  },
  orDividerRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  orTextModal: {
    fontSize: 10,
    fontFamily: BOLD_FONT,
    color: '#9CA3AF',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    fontFamily: STYLISH_FONT,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#6B7280',
  },
  modalSubmitButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA4335',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSubmitText: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#FFFFFF',
  },
});
