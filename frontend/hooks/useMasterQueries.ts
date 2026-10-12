import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  masterService,
  MasterItem,
  CuisineItem,
  DietaryTypeItem,
  CancellationReasonItem,
  FoodCategoryItem,
  CreateMasterPayload,
} from '../services/master.service';

/**
 * Feature-specific Query-Key Factory for Master Data
 */
export const masterKeys = {
  all: ['masters'] as const,
  lists: () => [...masterKeys.all, 'list'] as const,
  list: (type: string, params?: Record<string, any>) =>
    [...masterKeys.lists(), type, params || {}] as const,
  cuisines: () => [...masterKeys.all, 'cuisines'] as const,
  dietaryTypes: () => [...masterKeys.all, 'dietary-types'] as const,
  cancellationReasons: (role?: string) => [...masterKeys.all, 'cancellation-reasons', role || 'customer'] as const,
  foodCategories: (vertical?: string) => [...masterKeys.all, 'food-categories', vertical || 'food'] as const,
  detail: (type: string, id: string) => [...masterKeys.all, 'detail', type, id] as const,
};

// ── PUBLIC OPERATIONAL HOOKS ──

export function useCuisinesQuery() {
  return useQuery<CuisineItem[]>({
    queryKey: masterKeys.cuisines(),
    queryFn: () => masterService.getCuisines(),
    staleTime: 1000 * 60 * 15, // 15 mins (master data rarely changes)
  });
}

export function useDietaryTypesQuery() {
  return useQuery<DietaryTypeItem[]>({
    queryKey: masterKeys.dietaryTypes(),
    queryFn: () => masterService.getDietaryTypes(),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useCancellationReasonsQuery(role: string = 'customer') {
  return useQuery<CancellationReasonItem[]>({
    queryKey: masterKeys.cancellationReasons(role),
    queryFn: () => masterService.getCancellationReasons(role),
    staleTime: 1000 * 60 * 10, // 10 mins
  });
}

export function useFoodCategoriesMasterQuery(vertical: string = 'food') {
  return useQuery<FoodCategoryItem[]>({
    queryKey: masterKeys.foodCategories(vertical),
    queryFn: () => masterService.getFoodCategories(vertical),
    staleTime: 1000 * 60 * 15, // 15 mins
  });
}

// ── ADMIN MANAGEMENT HOOKS ──

export function useAdminMasterListQuery(type: string, query?: Record<string, any>) {
  return useQuery<MasterItem[]>({
    queryKey: masterKeys.list(type, query),
    queryFn: () => masterService.adminListMasters(type, query),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useAdminCreateMasterMutation(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMasterPayload) => masterService.adminCreateMaster(type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKeys.list(type) });
      queryClient.invalidateQueries({ queryKey: [...masterKeys.all, type] });
    },
  });
}

export function useAdminUpdateMasterMutation(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateMasterPayload> }) =>
      masterService.adminUpdateMaster(type, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKeys.list(type) });
      queryClient.invalidateQueries({ queryKey: [...masterKeys.all, type] });
    },
  });
}

export function useAdminDeleteMasterMutation(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => masterService.adminDeleteMaster(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKeys.list(type) });
      queryClient.invalidateQueries({ queryKey: [...masterKeys.all, type] });
    },
  });
}

export function useAdminReorderMastersMutation(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      masterService.adminReorderMasters(type, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKeys.list(type) });
    },
  });
}
