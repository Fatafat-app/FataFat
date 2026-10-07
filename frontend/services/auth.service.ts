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
   * Returns isNewUser=true if number was not registered before
   */
  async sendOtp(payload: SendOtpPayload): Promise<{ message: string; otp?: string; isNewUser?: boolean }> {
    const response = await api.post<ApiResponse<{ message: string; otp?: string; isNewUser?: boolean }>>('/auth/otp/send', payload);
    return response.data.data;
  },

  /**
   * Verify OTP and receive auth tokens
   * Returns isNewUser=true for newly registered users (redirect to onboarding)
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponseData & { isNewUser?: boolean }> {
    const response = await api.post<ApiResponse<any>>('/auth/otp/verify', payload);
    const data = response.data.data;
    const { accessToken, refreshToken } = extractTokens(data);
    if (accessToken) {
      await saveAuthTokens(accessToken, refreshToken || '');
    }
    return data;
  },

  /**
   * Login with Firebase / Google Authentication
   */
  async loginWithGoogle(payload: {
    idToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<any>>('/auth/google', payload);
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
    const response = await api.get<ApiResponse<User>>('/users/me');
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
