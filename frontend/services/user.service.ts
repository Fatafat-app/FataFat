import { api } from './api';
import { ApiResponse, User } from '../types';

export const userService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/users/me', data);
    return response.data.data;
  },

  /**
   * Upload and update user avatar
   */
  async uploadAvatar(imageUri: string): Promise<User> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await api.post<ApiResponse<User>>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Deactivate/Delete current user account
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  }
};
