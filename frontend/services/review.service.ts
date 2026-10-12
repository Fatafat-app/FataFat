import { api } from './api';
import { ApiResponse, Review, SubmitReviewPayload } from '../types';

export const reviewService = {
  /**
   * Submit a review for a delivered order
   */
  async submitReview(payload: SubmitReviewPayload): Promise<Review> {
    const response = await api.post<ApiResponse<{ review: Review }>>('/reviews', payload);
    return response.data.data.review;
  },

  /**
   * Get logged-in user's submitted reviews
   */
  async getMyReviews(page = 1, limit = 50): Promise<Review[]> {
    try {
      const response = await api.get<ApiResponse<{ reviews: Review[] }>>('/reviews/mine', {
        params: { page, limit },
      });
      const data = response.data.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.reviews)) return data.reviews;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Get reviews for a specific restaurant
   */
  async getRestaurantReviews(restaurantId: string, page = 1, limit = 20): Promise<Review[]> {
    try {
      const response = await api.get<ApiResponse<{ reviews: Review[] }>>(`/reviews/restaurant/${restaurantId}`, {
        params: { page, limit },
      });
      const data = response.data.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.reviews)) return data.reviews;
      return [];
    } catch {
      return [];
    }
  },
};
