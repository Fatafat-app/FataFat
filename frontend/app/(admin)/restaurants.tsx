import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/admin.service';
import { Restaurant } from '../../types';
import { Typography, Colors } from '../../constants/Theme';

export default function AdminRestaurantsScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await adminService.listAllRestaurants();
      setRestaurants(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const handleToggleStatus = (rest: Restaurant) => {
    const nextState = !rest.isActive;
    Alert.alert(
      nextState ? 'Activate Restaurant' : 'Suspend Restaurant',
      `Are you sure you want to ${nextState ? 'activate' : 'suspend'} ${rest.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextState ? 'Activate' : 'Suspend',
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const updated = await adminService.updateRestaurantStatus(rest._id, { isActive: nextState });
              setRestaurants(prev => prev.map(r => r._id === updated._id ? updated : r));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not update restaurant status');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Restaurant Control</Text>
          <Text style={styles.pageSubtitle}>Total: {restaurants.length} Partners</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {restaurants.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Restaurants Found</Text>
          </View>
        ) : (
          restaurants.map((rest) => {
            const isActive = rest.isActive ?? true;
            return (
              <View key={rest._id} style={styles.restaurantCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.restName}>{rest.name}</Text>
                    <Text style={styles.restAddress}>
                      {rest.address?.street}, {rest.address?.city}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#D97706" />
                    <Text style={styles.ratingText}>{rest.rating?.average?.toFixed(1) || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Owner</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {(rest.owner as any)?.name || (rest.owner as any)?.phone || (typeof rest.ownerId === 'string' ? rest.ownerId : (rest.ownerId as any)?._id || 'Registered Partner')}
                    </Text>
                  </View>
                  <View style={styles.toggleCol}>
                    <Text style={[styles.statusText, { color: isActive ? Colors.success : Colors.error }]}>
                      {isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </Text>
                    <Switch
                      value={isActive}
                      onValueChange={() => handleToggleStatus(rest)}
                      trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
                      thumbColor={isActive ? Colors.success : Colors.error}
                    />
                  </View>
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
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { ...Typography.heading, fontSize: 18 },
  pageSubtitle: { ...Typography.bodySmall, fontSize: 11 },
  refreshBtn: { backgroundColor: Colors.background, padding: 8, borderRadius: 10 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 36, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  restaurantCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restName: { ...Typography.title, fontSize: 16 },
  restAddress: { ...Typography.caption, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { ...Typography.button, fontSize: 11, color: '#92400E', marginLeft: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { flex: 1, marginRight: 8 },
  infoLabel: { ...Typography.label, fontSize: 10, color: Colors.textSecondary },
  infoValue: { ...Typography.button, fontSize: 11, marginTop: 2 },
  toggleCol: { alignItems: 'flex-end' },
  statusText: { ...Typography.label, fontSize: 9, marginBottom: 2 },
});
