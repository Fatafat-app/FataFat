import { api, saveAuthTokens, clearAuthTokens } from './api';
import {
  ApiResponse,
  AuthResponseData,
  RegisterPayload,
  LoginWithPasswordPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  User,
} from '../types';

function extractTokens(data: any): { accessToken?: string; refreshToken?: string } {
  const accessToken = data?.accessToken || data?.tokens?.accessToken;
  const refreshToken = data?.refreshToken || data?.tokens?.refreshToken;
  return { accessToken, refreshToken };
}

export const authService = {
  /**
   * Register a new user
   */
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<any>>('/auth/register', payload);
    const data = response.data.data;
    const { accessToken, refreshToken } = extractTokens(data);
    if (accessToken) {
      await saveAuthTokens(accessToken, refreshToken || '');
    }
    return data;
  },

  /**
   * Login with phone & password
   */
  async loginWithPassword(payload: LoginWithPasswordPayload): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<any>>('/auth/login', payload);
    const data = response.data.data;
    const { accessToken, refreshToken } = extractTokens(data);
    if (accessToken) {
      await saveAuthTokens(accessToken, refreshToken || '');
    }
    return data;
  },

  /**
   * Request OTP sent to phone number
   */
  async sendOtp(payload: SendOtpPayload): Promise<{ message: string; otp?: string }> {
    const response = await api.post<ApiResponse<{ message: string; otp?: string }>>('/auth/otp/send', payload);
    return response.data.data;
  },

  /**
   * Verify OTP and receive auth tokens
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<any>>('/auth/otp/verify', payload);
    const data = response.data.data;
    const { accessToken, refreshToken } = extractTokens(data);
    if (accessToken) {
      await saveAuthTokens(accessToken, refreshToken || '');
    }
    return data;
  },

  /**
   * Fetch current authenticated user's profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return response.data.data;
  },

  /**
   * Log out and clean storage tokens
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      await clearAuthTokens();
    }
  },
};
