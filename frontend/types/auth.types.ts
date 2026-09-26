import { User, UserRole } from './user.types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface LoginWithPasswordPayload {
  phone: string;
  password?: string;
}

export interface SendOtpPayload {
  phone: string;
  role?: UserRole;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}
