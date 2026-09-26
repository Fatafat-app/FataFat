import { api } from './api';
import { ApiResponse, Address, CreateAddressPayload } from '../types';

export const addressService = {
  /**
   * Get all saved addresses for user
   */
  async getAddresses(): Promise<Address[]> {
    const response = await api.get<ApiResponse<Address[]>>('/users/addresses');
    return response.data.data;
  },

  /**
   * Add a new delivery address
   */
  async addAddress(payload: CreateAddressPayload): Promise<Address> {
    const response = await api.post<ApiResponse<Address>>('/users/addresses', payload);
    return response.data.data;
  },

  /**
   * Update an existing delivery address
   */
  async updateAddress(addressId: string, payload: Partial<CreateAddressPayload>): Promise<Address> {
    const response = await api.put<ApiResponse<Address>>(`/users/addresses/${addressId}`, payload);
    return response.data.data;
  },

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/users/addresses/${addressId}`);
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string): Promise<Address> {
    const response = await api.patch<ApiResponse<Address>>(`/users/addresses/${addressId}/default`);
    return response.data.data;
  },
};
