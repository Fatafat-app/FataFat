import { useQuery } from '@tanstack/react-query';
import {
  groceryService,
  GroceryProductQueryParams,
  GroceryHomeFeedResponse,
  BackendGroceryCategory,
  BackendGroceryProduct,
} from '../services/grocery.service';

/**
 * Hook to fetch and cache the complete Grocery Home Feed
 * (banners, categories, special deals, trending items)
 */
export function useGroceryHomeFeedQuery() {
  return useQuery<GroceryHomeFeedResponse>({
    queryKey: ['grocery', 'home'],
    queryFn: () => groceryService.getHomeFeed(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to fetch and cache Grocery Categories
 * Shared across Home, Category lists, and Filters without duplicate calls
 */
export function useGroceryCategoriesQuery() {
  return useQuery<BackendGroceryCategory[]>({
    queryKey: ['grocery', 'categories'],
    queryFn: () => groceryService.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

/**
 * Hook to fetch and cache filtered/paginated Grocery Products
 * Automatically dedupes and caches based on parameters (category, sort, filter)
 */
export function useGroceryProductsQuery(params?: GroceryProductQueryParams) {
  return useQuery({
    queryKey: ['grocery', 'products', params],
    queryFn: () => groceryService.getProducts(params),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

/**
 * Hook to fetch and cache single Product Details
 */
export function useGroceryProductDetailQuery(idOrSlug?: string) {
  return useQuery<BackendGroceryProduct>({
    queryKey: ['grocery', 'product', idOrSlug],
    queryFn: () => groceryService.getProduct(idOrSlug!),
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook for grocery live search
 */
export function useGrocerySearchQuery(query: string) {
  return useQuery<BackendGroceryProduct[]>({
    queryKey: ['grocery', 'search', query],
    queryFn: () => groceryService.searchProducts(query),
    enabled: Boolean(query && query.trim().length > 1),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}
