import { Coordinates } from './common.types';

export interface RestaurantAddress {
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: Coordinates;
  line1?: string;
  line2?: string;
}

export interface OperatingHours {
  open: string;  // "09:00"
  close: string; // "23:00"
  isClosed?: boolean;
}

export interface Restaurant {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  images: string[];
  cuisines: string[];
  address: RestaurantAddress;
  rating: {
    average: number;
    count: number;
  };
  pricing: {
    costForTwo: number; // in paise
    deliveryCharge: number; // in paise
  };
  isActive: boolean;
  isOpen: boolean;
  isPureVeg: boolean;
  operatingHours?: Record<string, OperatingHours>;
  estimatedDeliveryTime?: number; // in minutes
  distance?: number; // in meters (when querying nearby)
  isVerified?: boolean;
  coverImage?: string;
  phone?: string;
  email?: string;
  preparationTime?: number | string;
  timings?: { open?: string; close?: string } | any;
  fssaiLicense?: string;
  taxPercent?: number;
  location?: Coordinates;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  cuisine?: string;
  isVeg?: boolean;
  sortBy?: 'rating' | 'costForTwo' | 'deliveryTime';
  sortOrder?: 'asc' | 'desc';
}

export interface NearbyRestaurantsQueryParams {
  lat: number;
  lng: number;
  radius?: number; // in meters, default: 5000 (5km)
  cuisine?: string;
  isVeg?: boolean;
}
