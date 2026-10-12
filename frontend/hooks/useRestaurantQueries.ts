import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../services/restaurant.service';
import { api } from '../services/api';
import { Restaurant, MenuItem, MenuCategory, NearbyRestaurantsQueryParams } from '../types';

/**
 * Hook to fetch and cache nearby restaurants based on coordinates
 */
export function useNearbyRestaurantsQuery(params: NearbyRestaurantsQueryParams) {
  return useQuery<Restaurant[]>({
    queryKey: ['restaurants', 'nearby', params.lat, params.lng, params.radius],
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
 * Hook to search restaurants and dishes
 */
export function useSearchDishesAndRestaurantsQuery(query: string, lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['search', query, lat, lng],
    queryFn: async () => {
      const [restRes, itemsRes] = await Promise.all([
        restaurantService.searchRestaurants(query, lat, lng).catch(() => []),
        restaurantService.searchMenuItems(query).catch(() => []),
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
