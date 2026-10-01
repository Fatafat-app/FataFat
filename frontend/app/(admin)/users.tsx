import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../store/admin.store';
import { User } from '../../types';
import { Typography, Colors } from '../../constants/Theme';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { users, isLoading, fetchUsers, toggleUserStatus } = useAdminStore();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers(selectedRole === 'ALL' ? undefined : selectedRole, search);
    setRefreshing(false);
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    fetchUsers(role === 'ALL' ? undefined : role, search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchUsers(selectedRole === 'ALL' ? undefined : selectedRole, text);
  };

  const handleToggleActive = (user: User) => {
    const nextState = !user.isActive;
    Alert.alert(
      nextState ? 'Activate User' : 'Deactivate / Block User',
      `Are you sure you want to ${nextState ? 'activate' : 'block'} account for ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextState ? 'Activate' : 'Block User',
          style: nextState ? 'default' : 'destructive',
          onPress: () => toggleUserStatus(user._id, user.isActive),
        },
      ]
    );
  };

  const roles = ['ALL', 'customer', 'restaurant_owner', 'delivery_partner', 'admin'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>User Directory</Text>
            <Text style={styles.pageSubtitle}>Total: {users.length} Platform Accounts</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search by name, phone or email..."
          style={styles.searchInput}
          placeholderTextColor={Colors.textSecondary}
        />
        {search ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.roleFilterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => handleRoleFilter(r)}
              style={[styles.rolePill, selectedRole === r && styles.rolePillActive]}
            >
              <Text style={[styles.rolePillText, selectedRole === r && styles.rolePillTextActive]}>
                {r.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtitle}>Try changing filter or search terms.</Text>
          </View>
        ) : (
          users.map((item) => {
            const isActive = item.isActive ?? true;
            return (
              <View key={item._id} style={styles.userCard}>
                <View style={styles.userCardLeft}>
                  <View
                    style={[
                      styles.avatarBox,
                      {
                        backgroundColor:
                          item.role === 'admin' ? '#EEF2FF' : item.role === 'restaurant_owner' ? '#FEF3C7' : item.role === 'delivery_partner' ? '#DBEAFE' : Colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.role === 'admin' ? 'shield' : item.role === 'restaurant_owner' ? 'restaurant' : item.role === 'delivery_partner' ? 'bicycle' : 'person'}
                      size={20}
                      color={item.role === 'admin' ? '#4F46E5' : item.role === 'restaurant_owner' ? '#D97706' : item.role === 'delivery_partner' ? '#2563EB' : Colors.textSecondary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPhone}>{item.phone}</Text>
                    {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}

                    <View style={[
                      styles.roleTag, 
                      item.role === 'admin' ? { backgroundColor: '#EEF2FF' } : 
                      item.role === 'restaurant_owner' ? { backgroundColor: '#FFFBEB' } : 
                      item.role === 'delivery_partner' ? { backgroundColor: '#EFF6FF' } : 
                      { backgroundColor: '#F0FDF4' }
                    ]}>
                      <Text style={[
                        styles.roleTagText,
                        item.role === 'admin' ? { color: '#4F46E5' } : 
                        item.role === 'restaurant_owner' ? { color: '#D97706' } : 
                        item.role === 'delivery_partner' ? { color: '#2563EB' } : 
                        { color: '#16A34A' }
                      ]}>{item.role.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statusToggleContainer}>
                  <Text style={[styles.statusLabel, { color: isActive ? Colors.success : Colors.error }]}>
                    {isActive ? 'ACTIVE' : 'BLOCKED'}
                  </Text>
                  <Switch
                    value={isActive}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                    thumbColor={isActive ? Colors.success : Colors.error}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { ...Typography.heading, fontSize: 18 },
  pageSubtitle: { ...Typography.bodySmall, fontSize: 11 },
  refreshBtn: { backgroundColor: Colors.background, padding: 8, borderRadius: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { ...Typography.bodySmall, flex: 1, fontSize: 14, color: Colors.text, marginLeft: 4 },
  roleFilterWrapper: { marginTop: 14, marginBottom: 8 },
  roleScroll: { paddingHorizontal: 16, gap: 10 },
  rolePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#E2E8F0' },
  rolePillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  rolePillText: { ...Typography.button, fontSize: 12, color: Colors.textSecondary },
  rolePillTextActive: { color: Colors.white, fontWeight: '800' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 40 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyTitle: { ...Typography.title, fontSize: 18, marginTop: 16 },
  emptySubtitle: { ...Typography.caption, textAlign: 'center', marginTop: 6, color: Colors.textSecondary },
  userCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  userCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatarBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  userName: { ...Typography.heading, fontSize: 15 },
  userPhone: { ...Typography.button, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  userEmail: { ...Typography.caption, fontSize: 11, color: '#94A3B8', marginTop: 1 },
  roleTag: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleTagText: { ...Typography.button, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusToggleContainer: { alignItems: 'center', paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
  statusLabel: { ...Typography.label, fontSize: 10, marginBottom: 4, letterSpacing: 0.5 },
});
