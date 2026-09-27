import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { userService } from '../../services/user.service';
import { Typography, Colors } from '../../constants/Theme';
import { Button } from '../../components/ui/Button';

export default function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    try {
      setLoading(true);
      await userService.updateProfile({ name, email });
      await fetchProfile(); // refresh auth store
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Edit Profile</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
              )}
              {/* Note: Avatar upload is supported in backend but requires image picker which needs extra dependency. Using simple layout for now. */}
            </View>
            <Text style={styles.phoneText}>{user?.phone}</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              style={styles.input}
              placeholderTextColor={Colors.borderDark}
            />

            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput 
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={Colors.borderDark}
            />
          </View>

          <View style={styles.spacer} />
          
          <Button 
            title="Save Changes" 
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  navTitle: { ...Typography.title, fontSize: 17 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF08A', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FACC15', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { ...Typography.heading, color: Colors.primary, fontSize: 32 },
  phoneText: { ...Typography.title, color: Colors.textSecondary, fontSize: 15 },
  formSection: { gap: 8 },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 4, marginTop: 12 },
  input: { ...Typography.body, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: Colors.text },
  spacer: { height: 32 },
});
