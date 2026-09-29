import { api } from './api';
import { ApiResponse } from '../types';

export interface BackendGroceryCategory {
  _id: string;
  name: string;
  slug: string;
  emoji?: string;
  image?: string;
  bg?: string;
  description?: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'lime' | 'grey' | 'pink' | 'blue' | 'default';
  itemCount?: string;
  sortOrder: number;
}

export interface BackendGroceryProduct {
  _id: string;
  name: string;
  slug: string;
  category: BackendGroceryCategory | string;
  price: number;
  originalPrice?: number;
  unit: string;
  images: string[];
  badge?: 'deal' | 'best_seller' | 'organic' | null;
  discount?: string;
  discountPercentage?: number;
  rating?: number;
  ratingCount?: number;
  stockQuantity: number;
  isAvailable: boolean;
  isOrganic?: boolean;
  isSpecialDeal?: boolean;
  isTrending?: boolean;
  tags?: string[];
  description?: string;
  weightInfo?: string;
  estimatedDelivery?: string;
  highlights?: Array<{
    label: string;
    type?: 'lime' | 'blue' | 'grey' | 'pink' | 'default';
    icon?: string;
  }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface BackendGroceryBanner {
  _id: string;
  title: string;
  subtitle?: string;
  code?: string;
  image: string;
  bgGradient?: { from: string; to: string };
  linkType?: string;
  targetId?: string;
}

export interface GroceryHomeFeedResponse {
  banners: BackendGroceryBanner[];
  categories: BackendGroceryCategory[];
  specialDeals: BackendGroceryProduct[];
  trending: BackendGroceryProduct[];
}

export interface GroceryProductQueryParams {
  category?: string;
  filter?: 'price' | 'popularity' | 'deals' | 'organic';
  badge?: 'deal' | 'best_seller' | 'organic';
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'popularity' | 'rating' | 'newest';
  isOrganic?: boolean;
  isSpecialDeal?: boolean;
  isTrending?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const groceryService = {
  /**
   * Fetch complete home feed (Banners + Categories + Special Deals + Trending)
   */
  async getHomeFeed(): Promise<GroceryHomeFeedResponse> {
    const response = await api.get<ApiResponse<GroceryHomeFeedResponse>>('/grocery/home');
    return response.data.data;
  },

  /**
   * Fetch categories list
   */
  async getCategories(): Promise<BackendGroceryCategory[]> {
    const response = await api.get<ApiResponse<{ categories: BackendGroceryCategory[] }>>('/grocery/categories');
    return response.data.data?.categories || [];
  },

  /**
   * Fetch filtered and paginated products
   */
  async getProducts(params?: GroceryProductQueryParams): Promise<{
    products: BackendGroceryProduct[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    const response = await api.get<ApiResponse<{ products: BackendGroceryProduct[] }>>('/grocery/products', {
      params,
    });
    return {
      products: response.data.data?.products || [],
      total: response.data.meta?.total || 0,
      totalPages: response.data.meta?.totalPages || 1,
      page: response.data.meta?.page || 1,
    };
  },

  /**
   * Fetch single product details
   */
  async getProduct(idOrSlug: string): Promise<BackendGroceryProduct> {
    const response = await api.get<ApiResponse<{ product: BackendGroceryProduct }>>(`/grocery/products/${idOrSlug}`);
    return response.data.data.product;
  },

  /**
   * Search grocery products with autocomplete
   */
  async searchProducts(q: string, limit = 10): Promise<BackendGroceryProduct[]> {
    const response = await api.get<ApiResponse<{ products: BackendGroceryProduct[] }>>('/grocery/search', {
      params: { q, limit },
    });
    return response.data.data?.products || [];
  },

  /**
   * Fetch banners
   */
  async getBanners(): Promise<BackendGroceryBanner[]> {
    const response = await api.get<ApiResponse<{ banners: BackendGroceryBanner[] }>>('/grocery/banners');
    return response.data.data?.banners || [];
  },
};
