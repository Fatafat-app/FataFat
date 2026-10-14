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
  async searchRestaurants(q: string, lat?: number, lng?: number, isVeg?: boolean): Promise<Restaurant[]> {
    const params: Record<string, any> = { q, lat, lng };
    if (isVeg !== undefined) {
      params.isVeg = isVeg;
    }
    const response = await api.get<ApiResponse<any>>('/search/restaurants', {
      params,
    });
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.restaurants)) {
      return data.restaurants;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  },

  /**
   * Search menu items by query
   */
  async searchMenuItems(q?: string, limit: number = 30, isVeg?: boolean): Promise<MenuItem[]> {
    const params: Record<string, any> = { limit };
    if (q && q.trim()) {
      params.q = q.trim();
    }
    if (isVeg !== undefined) {
      params.isVeg = isVeg;
    }
    const response = await api.get<ApiResponse<any>>('/search/items', { params });
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (data && Array.isArray(data.menuItems)) {
      return data.menuItems;
    }
    return [];
  },

  /**
   * Get curated recommended dishes
   */
  async getRecommendedItems(params?: { isVeg?: boolean; limit?: number }): Promise<MenuItem[]> {
    const response = await api.get<ApiResponse<any>>('/search/recommended', { params });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.products)) return data.products;
    return [];
  },

  /**
   * Get menu items priced under ₹99
   */
  async getUnder99Items(params?: { isVeg?: boolean; limit?: number }): Promise<MenuItem[]> {
    const response = await api.get<ApiResponse<any>>('/search/under99', { params });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.products)) return data.products;
    return [];
  },

  /**
   * Get trending dishes
   */
  async getTrendingItems(params?: { isVeg?: boolean; limit?: number }): Promise<MenuItem[]> {
    const response = await api.get<ApiResponse<any>>('/search/trending', { params });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.products)) return data.products;
    return [];
  },

  /**
   * Get single menu item / dish by ID
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const response = await api.get<ApiResponse<any>>(`/search/items/${id}`);
    const data = response.data.data;
    return data?.item || data?.menuItem || null;
  },

  /**
   * Get unified home feed (All sections + Admin configuration in 1 single cached call)
   */
  async getHomeFeed(params?: { lat?: number; lng?: number; isVeg?: boolean }): Promise<HomeFeedData> {
    const response = await api.get<ApiResponse<HomeFeedData>>('/feed/home', { params });
    return response.data.data;
  },
};

export interface SectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  limit: number;
  sortOrder: number;
}

export interface HomeFeedData {
  config: {
    heroBanners?: SectionConfig;
    categories?: SectionConfig;
    recommended?: SectionConfig;
    stealDeals?: SectionConfig;
    under99?: SectionConfig;
    restaurants?: SectionConfig;
    trending?: SectionConfig;
    frequentlyBought?: SectionConfig;
    spotlight?: SectionConfig;
    mustTry?: SectionConfig;
    [key: string]: SectionConfig | undefined;
  };
  heroBanners: any[];
  categories: any[];
  recommended: MenuItem[];
  stealDeals: any[];
  under99: MenuItem[];
  restaurants: Restaurant[];
  trending: MenuItem[];
  frequentlyBought: any[];
  spotlight: any[];
  mustTry: MenuItem[];
  timestamp: number;
}
