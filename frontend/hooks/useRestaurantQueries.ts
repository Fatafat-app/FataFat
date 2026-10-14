import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../services/restaurant.service';
import { api } from '../services/api';
import { Restaurant, MenuItem, MenuCategory, NearbyRestaurantsQueryParams } from '../types';

/**
 * Hook to fetch and cache nearby restaurants based on coordinates
 */
export function useNearbyRestaurantsQuery(params: NearbyRestaurantsQueryParams) {
  return useQuery<Restaurant[]>({
    queryKey: ['restaurants', 'nearby', params.lat, params.lng, params.radius, params.isVeg],
    queryFn: () => restaurantService.getNearbyRestaurants(params),
    staleTime: 1000 * 60 * 4, // 4 minutes
  });
}

/**
 * Hook to fetch and cache restaurant profile by ID
 */
export function useRestaurantDetailQuery(id?: string) {
  return useQuery<Restaurant>({
    queryKey: ['restaurants', 'detail', id],
    queryFn: () => restaurantService.getRestaurantById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch and cache restaurant menu items grouped by category
 */
export function useRestaurantMenuQuery(id?: string) {
  return useQuery<MenuCategory[]>({
    queryKey: ['restaurants', 'menu', id],
    queryFn: () => restaurantService.getRestaurantMenu(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch and cache food categories list
 */
export function useFoodCategoriesQuery() {
  return useQuery<any[]>({
    queryKey: ['food', 'categories'],
    queryFn: async () => {
      const resp = await api.get('/categories');
      return resp.data?.data?.categories || [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch, cache and deduplicate Must-Try signature dishes
 */
export function useMustTryProductsQuery() {
  return useQuery<MenuItem[]>({
    queryKey: ['food', 'must-try'],
    queryFn: async () => {
      const items = await restaurantService.searchMenuItems(undefined, 30).catch(() => []);
      if (items && items.length > 0) {
        return items;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to fetch, cache and deduplicate Recommended For You dishes
 */
export function useRecommendedProductsQuery(isVeg?: boolean) {
  return useQuery<MenuItem[]>({
    queryKey: ['food', 'recommended', isVeg],
    queryFn: async () => {
      const items = await restaurantService.getRecommendedItems({ isVeg, limit: 20 }).catch(() => []);
      if (items && items.length > 0) {
        return items;
      }
      return restaurantService.searchMenuItems(undefined, 20, isVeg).catch(() => []);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to search restaurants and dishes
 */
export function useSearchDishesAndRestaurantsQuery(query: string, lat?: number, lng?: number, isVeg?: boolean) {
  return useQuery({
    queryKey: ['search', query, lat, lng, isVeg],
    queryFn: async () => {
      const [restRes, itemsRes] = await Promise.all([
        restaurantService.searchRestaurants(query, lat, lng, isVeg).catch(() => []),
        restaurantService.searchMenuItems(query, 30, isVeg).catch(() => []),
      ]);

      return {
        restaurants: restRes || [],
        menuItems: itemsRes || [],
      };
    },
    enabled: Boolean(query && query.trim().length > 0),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch items priced under ₹99 (the 99 Store)
 */
export function useUnder99ProductsQuery(isVeg?: boolean) {
  return useQuery<MenuItem[]>({
    queryKey: ['food', 'under99', isVeg],
    queryFn: async () => {
      const items = await restaurantService.getUnder99Items({ isVeg, limit: 30 }).catch(() => []);
      return items;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to fetch, cache and deduplicate Trending dishes
 */
export function useTrendingProductsQuery(isVeg?: boolean) {
  return useQuery<MenuItem[]>({
    queryKey: ['food', 'trending', isVeg],
    queryFn: async () => {
      const items = await restaurantService.getTrendingItems({ isVeg, limit: 20 }).catch(() => []);
      if (items && items.length > 0) {
        return items;
      }
      return restaurantService.getRecommendedItems({ isVeg, limit: 20 }).catch(() => []);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to fetch single food dish details by ID
 */
export function useFoodProductDetailQuery(id?: string) {
  return useQuery<MenuItem | null>({
    queryKey: ['food', 'item', id],
    queryFn: () => (id ? restaurantService.getMenuItemById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch unified home feed (All sections + Admin configuration in 1 fast cached call)
 */
export function useHomeFeedQuery(params?: { lat?: number; lng?: number; isVeg?: boolean }) {
  return useQuery({
    queryKey: ['home', 'unified-feed', params?.lat, params?.lng, params?.isVeg],
    queryFn: () => restaurantService.getHomeFeed(params),
    staleTime: 1000 * 60 * 3, // 3 minutes stale
    gcTime: 1000 * 60 * 10,   // 10 minutes cache
  });
}
