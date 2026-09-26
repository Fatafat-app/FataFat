import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [phone, setPhone] = useState('+919822233344');
  const [password, setPassword] = useState('Password@123');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setUser = useAuthStore((state) => state.setUser);

  const handlePasswordLogin = async () => {
    if (!phone || !password) {
      setErrorMessage('Please enter both phone and password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const data = await authService.loginWithPassword({
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        password,
      });
      setUser(data.user);
      const userRole = data.user?.role;
      if (userRole === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (userRole === 'restaurant_owner') {
        router.replace('/(owner)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || 'Login failed. Please check credentials.';
      setErrorMessage(msg);
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const res = await authService.sendOtp({ phone: fullPhone });
      setIsOtpSent(true);
      Alert.alert(
        'OTP Sent',
        res.otp
          ? `Dev OTP: ${res.otp}`
          : 'Verification code has been sent to your phone number.'
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setErrorMessage('Please enter valid OTP');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const data = await authService.verifyOtp({ phone: fullPhone, otp });
      setUser(data.user);
      const userRole = data.user?.role;
      if (userRole === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (userRole === 'restaurant_owner') {
        router.replace('/(owner)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP';
      setErrorMessage(msg);
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillPreset = (pPhone: string, pPass: string) => {
    setPhone(pPhone);
    setPassword(pPass);
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.header}>
          <Text style={styles.logoTitle}>Ftafat</Text>
          <Text style={styles.subTitle}>Bhook lagi? 🍔</Text>
          <Text style={styles.tagline}>Ftafat delivery at your doorstep!</Text>

          {/* Value Props */}
          <View style={styles.featuresRow}>
            <FeatureIcon icon="flash-outline" text={'Lightning\nFast'} />
            <FeatureIcon icon="restaurant-outline" text={'Top\nRestaurants'} />
            <FeatureIcon icon="shield-checkmark-outline" text={'Live\nTracking'} />
          </View>
        </View>

        {/* Auth Box */}
        <View style={styles.card}>
          {/* Mode Switch Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, authMode === 'password' && styles.tabButtonActive]}
              onPress={() => {
                setAuthMode('password');
                setIsOtpSent(false);
              }}
            >
              <Text style={[styles.tabText, authMode === 'password' && styles.tabTextActive]}>
                Password Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, authMode === 'otp' && styles.tabButtonActive]}
              onPress={() => {
                setAuthMode('otp');
              }}
            >
              <Text style={[styles.tabText, authMode === 'otp' && styles.tabTextActive]}>
                OTP Login
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Phone Input */}
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>🇮🇳</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+919822233344"
              style={styles.textInput}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Password Mode Fields */}
          {authMode === 'password' && (
            <>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  style={styles.textInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                disabled={loading}
                onPress={handlePasswordLogin}
              >
                {loading ? (
                  <ActivityIndicator color="#713F12" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.primaryButtonText}>Login Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#713F12" />
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* OTP Mode Fields */}
          {authMode === 'otp' && (
            <>
              {isOtpSent ? (
                <>
                  <Text style={styles.inputLabel}>Enter OTP Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="key-outline" size={18} color="#6B7280" />
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="6-digit OTP code"
                      keyboardType="number-pad"
                      style={[styles.textInput, { letterSpacing: 4 }]}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    disabled={loading}
                    onPress={handleVerifyOtp}
                  >
                    {loading ? (
                      <ActivityIndicator color="#713F12" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendOtp}
                    style={{ paddingVertical: 10, alignItems: 'center' }}
                    disabled={loading}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#A16207' }}>
                      Resend OTP Code
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  disabled={loading}
                  onPress={handleSendOtp}
                >
                  {loading ? (
                    <ActivityIndicator color="#713F12" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.primaryButtonText}>Get OTP</Text>
                      <Ionicons name="phone-portrait-outline" size={18} color="#713F12" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Quick Demo Test Logins */}
          <View style={styles.presetSection}>
            <Text style={styles.presetTitle}>⚡ Quick Test Accounts</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                onPress={() => fillPreset('+919999999999', 'Password@123')}
                style={[styles.presetBadge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
              >
                <Text style={[styles.presetText, { color: '#4F46E5', fontWeight: '800' }]}>👑 Super Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => fillPreset('+919876543210', 'Password@123')}
                style={styles.presetBadge}
              >
                <Text style={styles.presetText}>Owner (Rajesh)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => fillPreset('+919822233344', 'Password@123')}
                style={styles.presetBadge}
              >
                <Text style={styles.presetText}>Customer (Priya)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => fillPreset('+919811122233', 'Password@123')}
                style={styles.presetBadge}
              >
                <Text style={styles.presetText}>Rider (Amit)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureIcon({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureCircle}>
        <Ionicons name={icon} size={22} color="#854D0E" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEFCE8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#4A2B11',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8C5E35',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CA8A04',
    marginBottom: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A2B11',
    textAlign: 'center',
    lineHeight: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FACC15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854D0E',
  },
  tabTextActive: {
    color: '#713F12',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#FACC15',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#713F12',
    marginRight: 6,
  },
  presetSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
});
