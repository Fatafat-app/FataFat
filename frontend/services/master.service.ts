import { api } from './api';
import { ApiResponse } from '../types';

export interface MasterItem {
  _id: string;
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CuisineItem extends MasterItem {
  coverImage?: string;
  isPopular?: boolean;
}

export interface DietaryTypeItem extends MasterItem {
  colorCode?: string;
  badgeIcon?: string;
  isVeg?: boolean;
}

export interface CancellationReasonItem extends MasterItem {
  role: 'customer' | 'restaurant' | 'rider' | 'admin' | 'all';
  requiresRemarks?: boolean;
  triggersAutoRefund?: boolean;
}

export interface FoodCategoryItem extends MasterItem {
  slug?: string;
  vertical?: 'food' | 'grocery' | 'both';
  image?: string;
  order?: number;
}

export interface CreateMasterPayload {
  code?: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  coverImage?: string;
  isPopular?: boolean;
  colorCode?: string;
  badgeIcon?: string;
  isVeg?: boolean;
  role?: string;
  requiresRemarks?: boolean;
  triggersAutoRefund?: boolean;
  slug?: string;
  vertical?: string;
}

export const masterService = {
  // ── PUBLIC OPERATIONAL CALLS ──

  async getCuisines(): Promise<CuisineItem[]> {
    const res = await api.get<ApiResponse<{ cuisines: CuisineItem[] }>>('/masters/cuisines');
    return res.data?.data?.cuisines || [];
  },

  async getDietaryTypes(): Promise<DietaryTypeItem[]> {
    const res = await api.get<ApiResponse<{ dietaryTypes: DietaryTypeItem[] }>>('/masters/dietary-types');
    return res.data?.data?.dietaryTypes || [];
  },

  async getCancellationReasons(role: string = 'customer'): Promise<CancellationReasonItem[]> {
    const res = await api.get<ApiResponse<{ cancellationReasons: CancellationReasonItem[] }>>('/masters/cancellation-reasons', {
      params: { role },
    });
    return res.data?.data?.cancellationReasons || [];
  },

  async getFoodCategories(vertical: string = 'food'): Promise<FoodCategoryItem[]> {
    const res = await api.get<ApiResponse<{ categories: FoodCategoryItem[] }>>('/masters/food-categories', {
      params: { vertical },
    });
    return res.data?.data?.categories || [];
  },

  // ── ADMIN MANAGEMENT CALLS ──

  async adminListMasters(type: string, query?: Record<string, any>): Promise<MasterItem[]> {
    const res = await api.get<ApiResponse<{ items: MasterItem[]; total: number }>>(`/admin/masters/${type}`, {
      params: query,
    });
    return res.data?.data?.items || [];
  },

  async adminGetMaster(type: string, id: string): Promise<MasterItem> {
    const res = await api.get<ApiResponse<{ item: MasterItem }>>(`/admin/masters/${type}/${id}`);
    return res.data?.data?.item;
  },

  async adminCreateMaster(type: string, payload: CreateMasterPayload): Promise<MasterItem> {
    const res = await api.post<ApiResponse<{ item: MasterItem }>>(`/admin/masters/${type}`, payload);
    return res.data?.data?.item;
  },

  async adminUpdateMaster(type: string, id: string, payload: Partial<CreateMasterPayload>): Promise<MasterItem> {
    const res = await api.patch<ApiResponse<{ item: MasterItem }>>(`/admin/masters/${type}/${id}`, payload);
    return res.data?.data?.item;
  },

  async adminDeleteMaster(type: string, id: string): Promise<void> {
    await api.delete(`/admin/masters/${type}/${id}`);
  },

  async adminReorderMasters(type: string, items: { id: string; sortOrder: number }[]): Promise<MasterItem[]> {
    const res = await api.put<ApiResponse<{ items: MasterItem[] }>>(`/admin/masters/${type}/reorder`, { items });
    return res.data?.data?.items || [];
  },
};
