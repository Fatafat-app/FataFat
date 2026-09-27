import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { userService } from '../../services/user.service';
import { Typography, Colors, BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';
import { Button } from '../../components/ui/Button';

export default function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const initAuth = useAuthStore((state) => state.initAuth);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hold on!', 'Please enter your full name.');
      return;
    }

    try {
      setLoading(true);
      await userService.updateProfile({ name, email });
      await initAuth(); // Refresh user profile using initAuth instead of non-existent fetchProfile
      Alert.alert('Awesome!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      Alert.alert('Oops!', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Premium Header */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} /> {/* For centering */}
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
              )}
              {/* Fake camera button for premium look */}
              <TouchableOpacity style={styles.cameraBtn} onPress={() => Alert.alert('Avatar', 'Avatar upload coming in next update!')}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.phoneBadge}>
              <Ionicons name="call" size={14} color="#D94E1B" style={{ marginRight: 6 }} />
              <Text style={styles.phoneText}>{user?.phone}</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionHeader}>Personal Details</Text>

            <View style={[styles.inputGroup, focusedInput === 'name' && styles.inputGroupFocused]}>
              <Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? '#D94E1B' : '#9CA3AF'} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="e.g. Rahul Kumar"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, focusedInput === 'email' && styles.inputGroupFocused]}>
              <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? '#D94E1B' : '#9CA3AF'} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address (Optional)</Text>
                <TextInput 
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="e.g. rahul@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

        </ScrollView>
        
        {/* Sticky Bottom Action */}
        <View style={styles.bottomFooter}>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FDF2E3' // Premium Ftafat Warm Cream
  },
  navbar: { 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#FDF2E3',
  },
  backButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  navTitle: { 
    fontFamily: BOLD_FONT, 
    fontSize: 18,
    color: '#3E2723',
    letterSpacing: 0.2,
  },
  scrollContainer: { 
    flex: 1,
    backgroundColor: '#F3F4F6', // Off-white for body
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: 10,
  },
  scrollContent: { 
    padding: 24,
    paddingBottom: 40,
  },
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: 32, 
    marginTop: 10 
  },
  avatarCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#FFEDD5', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16, 
    borderWidth: 4, 
    borderColor: '#FFF', 
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  avatarImage: { 
    width: '100%', 
    height: '100%',
    borderRadius: 50,
  },
  avatarText: { 
    fontFamily: BOLD_FONT, 
    color: '#D94E1B', 
    fontSize: 36 
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D94E1B',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  phoneBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  phoneText: { 
    fontFamily: BOLD_FONT, 
    color: '#4B5563', 
    fontSize: 14,
    letterSpacing: 1,
  },
  formContainer: { 
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    fontFamily: BOLD_FONT,
    fontSize: 16,
    color: '#3E2723',
    marginBottom: 20,
  },
  inputGroup: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  inputGroupFocused: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FDBA74',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: { 
    fontFamily: BOLD_FONT, 
    color: '#9CA3AF', 
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  input: { 
    fontFamily: STYLISH_FONT, 
    fontSize: 15,
    color: '#1F2937', 
    padding: 0,
    height: 24,
  },
  bottomFooter: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: '#D94E1B',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#D94E1B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#FCA5A5',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontFamily: BOLD_FONT,
    color: '#FFF',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});
