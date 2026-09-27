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
                  <View style={styles.restImagePlaceholder}>
                    <Ionicons name="storefront" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.restName} numberOfLines={1}>{rest.name}</Text>
                      {rest.rating?.average && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={10} color="#D97706" />
                          <Text style={styles.ratingText}>{rest.rating.average.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.restAddress} numberOfLines={1}>
                      <Ionicons name="location" size={10} color={Colors.textSecondary} /> {rest.address?.street}, {rest.address?.city}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Restaurant Owner</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {(rest.owner as any)?.name || (rest.owner as any)?.phone || (typeof rest.ownerId === 'string' ? rest.ownerId : (rest.ownerId as any)?._id || 'Registered Partner')}
                    </Text>
                  </View>
                  <View style={styles.toggleCol}>
                    <Text style={[styles.statusText, { color: isActive ? Colors.success : Colors.error }]}>
                      {isActive ? 'STORE ACTIVE' : 'SUSPENDED'}
                    </Text>
                    <Switch
                      value={isActive}
                      onValueChange={() => handleToggleStatus(rest)}
                      trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
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
  restaurantCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  restImagePlaceholder: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  restName: { ...Typography.heading, fontSize: 16, flex: 1, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { ...Typography.button, fontSize: 10, color: '#92400E', marginLeft: 4 },
  restAddress: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { flex: 1, marginRight: 12 },
  infoLabel: { ...Typography.label, fontSize: 10, color: Colors.textSecondary, letterSpacing: 0.5 },
  infoValue: { ...Typography.title, fontSize: 13, marginTop: 4 },
  toggleCol: { alignItems: 'flex-end', justifyContent: 'center' },
  statusText: { ...Typography.label, fontSize: 10, marginBottom: 4, letterSpacing: 0.5 },
});
