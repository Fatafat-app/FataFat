import { api } from './api';
import { ApiResponse } from '../types';

export interface BannerItem {
  _id: string;
  displayMode?: 'FULL_POSTER' | 'CARD_TEMPLATE';
  title: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  image: string;
  section: 'FOOD_HERO' | 'OFFERS_FOR_YOU' | 'SPOTLIGHT' | 'GROCERY_HERO';
  colors: string[];
  textColor: string;
  accentColor: string;
  actionText: string;
  targetType: 'restaurant' | 'category' | 'cuisine' | 'coupon' | 'search' | 'none';
  targetId?: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBannerPayload {
  displayMode?: 'FULL_POSTER' | 'CARD_TEMPLATE';
  title?: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  image: string;
  section: 'FOOD_HERO' | 'OFFERS_FOR_YOU' | 'SPOTLIGHT' | 'GROCERY_HERO';
  colors?: string[];
  textColor?: string;
  accentColor?: string;
  actionText?: string;
  targetType?: 'restaurant' | 'category' | 'cuisine' | 'coupon' | 'search' | 'none';
  targetId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const bannerService = {
  /**
   * Get active banners by section (public)
   */
  async getBanners(section?: string): Promise<BannerItem[]> {
    const params = section ? { section } : {};
    const response = await api.get<ApiResponse<{ banners: BannerItem[]; items?: BannerItem[] }>>('/banners', { params });
    return response.data.data?.banners || response.data.data?.items || [];
  },

  /**
   * Get all banners for admin management (including inactive)
   */
  async getAllBannersAdmin(section?: string): Promise<BannerItem[]> {
    const params = section ? { section } : {};
    const response = await api.get<ApiResponse<{ banners: BannerItem[]; items?: BannerItem[] }>>('/banners/admin', { params });
    return response.data.data?.banners || response.data.data?.items || [];
  },

  /**
   * Create a new banner
   */
  async createBanner(payload: CreateBannerPayload): Promise<BannerItem> {
    const response = await api.post<ApiResponse<{ banner: BannerItem }>>('/banners', payload);
    return response.data.data.banner;
  },

  /**
   * Update an existing banner
   */
  async updateBanner(id: string, payload: Partial<CreateBannerPayload>): Promise<BannerItem> {
    const response = await api.patch<ApiResponse<{ banner: BannerItem }>>(`/banners/${id}`, payload);
    return response.data.data.banner;
  },

  /**
   * Toggle banner active state
   */
  async toggleBanner(id: string, isActive: boolean): Promise<BannerItem> {
    const response = await api.patch<ApiResponse<{ banner: BannerItem }>>(`/banners/${id}/toggle`, { isActive });
    return response.data.data.banner;
  },

  /**
   * Delete banner
   */
  async deleteBanner(id: string): Promise<void> {
    await api.delete(`/banners/${id}`);
  },

  /**
   * Reorder banners
   */
  async reorderBanners(items: { id: string }[]): Promise<void> {
    await api.put('/banners/reorder', { items });
  },
};
