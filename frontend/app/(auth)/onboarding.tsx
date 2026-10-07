import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const BOLD_FONT = Platform.select({
  ios: 'Georgia-Bold',
  android: 'serif',
  default: 'System',
});
const REG_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'System',
});

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSaveName = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter your name (at least 2 characters)');
      return;
    }

    try {
      setLoading(true);
      const response = await api.patch('/users/me', { name: trimmedName });
      const updatedUser = response.data?.data?.user || response.data?.data;

      // Update store with new name
      if (user) {
        setUser({ ...user, name: trimmedName });
      }

      // Navigate based on role
      const role = user?.role || 'customer';
      if (['admin', 'super_admin', 'ops_admin', 'catalog_admin', 'finance_admin', 'support_admin'].includes(role)) {
        router.replace('/(admin)/dashboard');
      } else if (['restaurant_owner', 'merchant_owner', 'merchant_staff'].includes(role)) {
        router.replace('/(owner)/dashboard');
      } else if (['delivery_partner', 'rider'].includes(role)) {
        router.replace('/(rider)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save your name. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const role = user?.role || 'customer';
    if (['admin', 'super_admin'].includes(role)) {
      router.replace('/(admin)/dashboard');
    } else if (['restaurant_owner', 'merchant_owner'].includes(role)) {
      router.replace('/(owner)/dashboard');
    } else if (['delivery_partner', 'rider'].includes(role)) {
      router.replace('/(rider)/dashboard');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/login_bg_food.jpeg')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', padding: 24 }}
        >
          {/* Logo */}
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.logoWrap}>
            <Image
              source={require('../../assets/images/logo_transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInUp.duration(700).delay(200).springify()} style={styles.card}>
            {/* Welcome header */}
            <View style={styles.welcomeIconWrap}>
              <Text style={styles.waveEmoji}>👋</Text>
            </View>
            <Text style={styles.title}>Welcome to Ftafat!</Text>
            <Text style={styles.subtitle}>
              Your phone is verified! What should we call you?
            </Text>

            {/* Name input */}
            <View style={styles.inputWrap}>
              <View style={styles.inputIconBox}>
                <Ionicons name="person-outline" size={20} color="#D94E1B" />
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                maxLength={50}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
            </View>

            {/* Continue button */}
            <Animated.View style={buttonAnimStyle}>
              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.8 }]}
                onPress={handleSaveName}
                onPressIn={() => { buttonScale.value = withSpring(0.94, { damping: 10, stiffness: 400 }); }}
                onPressOut={() => { buttonScale.value = withSpring(1, { damping: 10, stiffness: 400 }); }}
                disabled={loading}
                activeOpacity={1}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Get Started 🚀</Text>
                    <View style={styles.btnArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#D94E1B" />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Skip */}
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} disabled={loading}>
              <Text style={styles.skipText}>Skip for now →</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#FDF2E3',
  },
  bgImage: {
    resizeMode: 'stretch',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: width * 0.6,
    height: 60,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
  },
  welcomeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFEDD5',
  },
  waveEmoji: {
    fontSize: 36,
  },
  title: {
    fontFamily: BOLD_FONT,
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: REG_FONT,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 18,
    height: 60,
    backgroundColor: '#fff',
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
  },
  inputIconBox: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#FFF5F0',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: REG_FONT,
    fontWeight: '600',
    color: '#1F2937',
  },
  btn: {
    backgroundColor: '#D94E1B',
    borderRadius: 18,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48 - 56,
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    paddingHorizontal: 20,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: BOLD_FONT,
    flex: 1,
    textAlign: 'center',
  },
  btnArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    marginTop: 18,
    padding: 8,
  },
  skipText: {
    fontFamily: REG_FONT,
    fontSize: 13,
    color: '#9CA3AF',
  },
});
