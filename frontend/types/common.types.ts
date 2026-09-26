export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface Coordinates {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}
