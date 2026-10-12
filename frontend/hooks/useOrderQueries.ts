import { useQuery, useMutation } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { Order } from '../types';
import { queryClient } from '../services/queryClient';

/**
 * Hook to fetch and cache user orders
 */
export function useOrdersQuery() {
  return useQuery<Order[]>({
    queryKey: ['orders', 'list'],
    queryFn: async () => {
      const data = await orderService.getOrders();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray((data as any).orders)) return (data as any).orders;
      if (data && Array.isArray((data as any).items)) return (data as any).items;
      return [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch and cache single order details & live tracking info
 */
export function useOrderDetailQuery(id?: string) {
  return useQuery<Order>({
    queryKey: ['orders', 'detail', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 15, // 15 seconds
  });
}

/**
 * Hook to cancel an order and automatically invalidate cache
 */
export function useCancelOrderMutation() {
  return useMutation({
    mutationFn: ({
      orderId,
      reason,
      cancellationReasonId,
    }: {
      orderId: string;
      reason: string;
      cancellationReasonId?: string;
    }) => orderService.cancelOrder(orderId, reason, cancellationReasonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId] });
    },
  });
}

/**
 * Helper function to invalidate orders cache from socket events or actions
 */
export function invalidateOrdersCache(orderId?: string) {
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
  }
}
