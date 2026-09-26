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
    const response = await api.get<ApiResponse<Restaurant[]>>('/restaurants/nearby', {
      params,
    });
    return response.data.data;
  },

  /**
   * Search / Filter paginated restaurants
   */
  async getRestaurants(params?: RestaurantQueryParams): Promise<PaginatedData<Restaurant>> {
    const response = await api.get<ApiResponse<PaginatedData<Restaurant>>>('/restaurants', {
      params,
    });
    return response.data.data;
  },

  /**
   * Get single restaurant details by ID
   */
  async getRestaurantById(id: string): Promise<Restaurant> {
    const response = await api.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
    return response.data.data;
  },

  /**
   * Get restaurant menu items grouped by category
   */
  async getRestaurantMenu(restaurantId: string): Promise<MenuCategory[]> {
    const response = await api.get<ApiResponse<MenuItem[] | MenuCategory[]>>(`/restaurants/${restaurantId}/menu`);
    const rawData = response.data.data;

    // Check if backend returned an array of items or grouped categories
    if (Array.isArray(rawData) && rawData.length > 0 && 'category' in rawData[0] && 'items' in rawData[0]) {
      return rawData as MenuCategory[];
    }

    // Otherwise group items by category client-side
    const items = rawData as MenuItem[];
    const categoryMap = new Map<string, MenuItem[]>();

    items.forEach((item) => {
      const cat = item.category || 'Recommended';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(item);
    });

    return Array.from(categoryMap.entries()).map(([category, categoryItems]) => ({
      category,
      items: categoryItems,
    }));
  },
};
