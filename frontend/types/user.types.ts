import { Coordinates } from './common.types';

export type UserRole = 'customer' | 'restaurant_owner' | 'delivery_partner' | 'admin';

export interface Address {
  _id: string;
  type: 'Home' | 'Work' | 'Other';
  label?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: Coordinates;
  isDefault: boolean;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  addresses?: Address[];
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface CreateAddressPayload {
  type: 'Home' | 'Work' | 'Other';
  label?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: Coordinates;
  isDefault?: boolean;
}
