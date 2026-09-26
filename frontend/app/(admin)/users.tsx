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
import { useAdminStore } from '../../store/admin.store';
import { User } from '../../types';

export default function AdminUsersScreen() {
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
      {/* Header */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>User Control & Moderation</Text>
          <Text style={styles.pageSubtitle}>Total Loaded: {users.length} Users</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search by name, phone or email..."
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
        {search ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Role Filter Pills */}
      <View style={styles.roleFilterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => handleRoleFilter(r)}
              style={[
                styles.rolePill,
                selectedRole === r && styles.rolePillActive,
              ]}
            >
              <Text
                style={[
                  styles.rolePillText,
                  selectedRole === r && styles.rolePillTextActive,
                ]}
              >
                {r.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
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
                          item.role === 'admin'
                            ? '#EEF2FF'
                            : item.role === 'restaurant_owner'
                            ? '#FEF3C7'
                            : item.role === 'delivery_partner'
                            ? '#DBEAFE'
                            : '#F3F4F6',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        item.role === 'admin'
                          ? 'shield'
                          : item.role === 'restaurant_owner'
                          ? 'restaurant'
                          : item.role === 'delivery_partner'
                          ? 'bicycle'
                          : 'person'
                      }
                      size={20}
                      color={
                        item.role === 'admin'
                          ? '#4F46E5'
                          : item.role === 'restaurant_owner'
                          ? '#D97706'
                          : item.role === 'delivery_partner'
                          ? '#2563EB'
                          : '#4B5563'
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPhone}>{item.phone}</Text>
                    {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}

                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{item.role.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </View>

                {/* Status Toggle */}
                <View style={styles.statusToggleContainer}>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: isActive ? '#15803D' : '#DC2626' },
                    ]}
                  >
                    {isActive ? 'ACTIVE' : 'BLOCKED'}
                  </Text>
                  <Switch
                    value={isActive}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
                    thumbColor={isActive ? '#16A34A' : '#DC2626'}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  refreshBtn: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  roleFilterWrapper: {
    marginTop: 10,
    marginBottom: 6,
  },
  roleScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rolePillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  userPhone: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  userEmail: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  roleTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  statusToggleContainer: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
});
