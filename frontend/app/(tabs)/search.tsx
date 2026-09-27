import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { restaurantService } from '../../services/restaurant.service';
import { useLocationStore } from '../../store';
import { Restaurant } from '../../types';
import { RestaurantCard } from '../../components/ui/RestaurantCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Loading } from '../../components/ui/Loading';

const ORANGE = '#FF6000';

const formatDistance = (meters?: number) => {
  if (!meters) return '';
  return `${(meters / 1000).toFixed(1)} km`;
};

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q || '';
  
  const { currentLocation } = useLocationStore();
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update query when params.q changes (e.g. clicking a category from Home)
  useEffect(() => {
    if (params.q) {
      const newQuery = Array.isArray(params.q) ? params.q[0] : params.q;
      setQuery(newQuery);
      setDebouncedQuery(newQuery);
    }
  }, [params.q]);
  
  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch logic
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        const data = await restaurantService.searchRestaurants(
          debouncedQuery, 
          currentLocation?.latitude, 
          currentLocation?.longitude
        );
        setResults(data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to search restaurants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [debouncedQuery, currentLocation]);

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    Keyboard.dismiss();
  };
  
  const popularTags = ['Pizza', 'Burger', 'Biryani', 'Healthy', 'Desserts', 'North Indian'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for restaurants, cuisines..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            autoFocus={!initialQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!debouncedQuery.trim() ? (
          <View style={styles.popularSection}>
            <Text style={styles.sectionTitle}>Popular Cuisines</Text>
            <View style={styles.tagsContainer}>
              {popularTags.map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={styles.tagBtn}
                  onPress={() => setQuery(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : loading ? (
          <View style={styles.centerContent}>
            <Loading size="large" color={ORANGE} />
            <Text style={styles.loadingText}>Searching for "{debouncedQuery}"...</Text>
          </View>
        ) : error ? (
          <ErrorState 
            title="Search Failed" 
            message={error} 
            onRetry={() => setDebouncedQuery(query)} // trigger re-fetch
          />
        ) : results.length === 0 ? (
          <EmptyState 
            icon="search-outline" 
            title="No matches found" 
            message={`We couldn't find any restaurants matching "${debouncedQuery}"`} 
          />
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsCount}>{results.length} results found</Text>
            {results.map(r => (
              <RestaurantCard
                key={r._id}
                name={r.name}
                imageUri={r.images?.[0] || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg'}
                cuisines={r.cuisines?.join(', ')}
                rating={r.rating?.average || 0}
                deliveryTime={`${r.estimatedDeliveryTime || 30} min`}
                distance={formatDistance(r.distance)}
                onPress={() => router.push(`/restaurant/${r._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  popularSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF0E6',
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
  },
  tagText: {
    color: ORANGE,
    fontWeight: '600',
    fontSize: 13,
  },
  resultsContainer: {
    paddingBottom: 20,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  }
});
