import { api } from './api';
import { ApiResponse, Address, CreateAddressPayload } from '../types';

export const addressService = {
  /**
   * Get all saved addresses for user
   */
  async getAddresses(): Promise<Address[]> {
    const response = await api.get<ApiResponse<any>>('/users/me/addresses');
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.addresses)) return data.addresses;
    return [];
  },

  /**
   * Add a new delivery address
   */
  async addAddress(payload: CreateAddressPayload): Promise<Address> {
    const response = await api.post<ApiResponse<any>>('/users/me/addresses', payload);
    const data = response.data.data;
    return data?.address || data;
  },

  /**
   * Update an existing delivery address (including setting as default)
   */
  async updateAddress(addressId: string, payload: Partial<CreateAddressPayload>): Promise<Address> {
    const response = await api.patch<ApiResponse<any>>(`/users/me/addresses/${addressId}`, payload);
    const data = response.data.data;
    return data?.address || data;
  },

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/users/me/addresses/${addressId}`);
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string): Promise<Address> {
    const response = await api.patch<ApiResponse<any>>(`/users/me/addresses/${addressId}`, { isDefault: true });
    const data = response.data.data;
    return data?.address || data;
  },
};
