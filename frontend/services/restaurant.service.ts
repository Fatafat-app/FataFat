import { api } from './api';
import {
  ApiResponse,
  PaginatedData,
  Restaurant,
  RestaurantQueryParams,
  NearbyRestaurantsQueryParams,
  MenuItem,
  MenuCategory,
} from '../types';

export const restaurantService = {
  /**
   * Fetch nearby active restaurants sorted by distance
   */
  async getNearbyRestaurants(params: NearbyRestaurantsQueryParams): Promise<Restaurant[]> {
    const response = await api.get<ApiResponse<any>>('/restaurants/nearby', {
      params,
    });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.restaurants)) return data.restaurants;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  },

  /**
   * Search / Filter paginated restaurants
   */
  async getRestaurants(params?: RestaurantQueryParams): Promise<PaginatedData<Restaurant>> {
    const response = await api.get<ApiResponse<any>>('/restaurants', {
      params,
    });
    const data = response.data.data;
    if (data && data.restaurants && Array.isArray(data.restaurants)) {
      return {
        items: data.restaurants,
        total: data.meta?.total || data.restaurants.length,
        page: data.meta?.page || 1,
        limit: data.meta?.limit || data.restaurants.length,
        hasMore: false,
      };
    }
    return data;
  },

  /**
   * Get single restaurant details by ID
   */
  async getRestaurantById(id: string): Promise<Restaurant> {
    const response = await api.get<ApiResponse<any>>(`/restaurants/${id}`);
    const data = response.data.data;
    return data?.restaurant || data;
  },

  /**
   * Get restaurant menu items grouped by category
   */
  async getRestaurantMenu(restaurantId: string): Promise<MenuCategory[]> {
    const response = await api.get<ApiResponse<any>>(`/restaurants/${restaurantId}/menu`);
    const rawData = response.data.data;

    // Backend returns { menu: [...] } shape
    const data = rawData?.menu ?? rawData;

    if (!Array.isArray(data)) return [];

    // Already grouped with category+items shape
    if (data.length > 0 && 'items' in data[0]) {
      return data as MenuCategory[];
    }

    // Flat items array — group client-side
    const items = data as MenuItem[];
    const categoryMap = new Map<string, MenuItem[]>();
    items.forEach((item) => {
      const cat = item.category || 'Recommended';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(item);
    });
    return Array.from(categoryMap.entries()).map(([category, categoryItems]) => ({
      category,
      items: categoryItems,
    })) as unknown as MenuCategory[];
  },

  /**
   * Search for restaurants by query and location
   */
  async searchRestaurants(q: string, lat?: number, lng?: number): Promise<Restaurant[]> {
    const response = await api.get<ApiResponse<Restaurant[] | PaginatedData<Restaurant>>>('/search/restaurants', {
      params: { q, lat, lng },
    });
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    return (data as PaginatedData<Restaurant>).items || [];
  },

  /**
   * Search menu items by query
   */
  async searchMenuItems(q: string): Promise<MenuItem[]> {
    const response = await api.get<ApiResponse<MenuItem[] | PaginatedData<MenuItem>>>('/search/items', {
      params: { q },
    });
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    return (data as PaginatedData<MenuItem>).items || [];
  }
};
