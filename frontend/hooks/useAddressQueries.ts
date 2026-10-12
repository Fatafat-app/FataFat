import { useQuery, useMutation } from '@tanstack/react-query';
import { addressService } from '../services/address.service';
import { Address } from '../types';
import { queryClient } from '../services/queryClient';

/**
 * Hook to fetch and cache user saved addresses
 */
export function useAddressesQuery() {
  return useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const data = await addressService.getAddresses();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to delete address and automatically invalidate cache
 */
export function useDeleteAddressMutation() {
  return useMutation({
    mutationFn: (id: string) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

/**
 * Hook to add an address and automatically invalidate cache
 */
export function useAddAddressMutation() {
  return useMutation({
    mutationFn: (payload: any) => addressService.addAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
