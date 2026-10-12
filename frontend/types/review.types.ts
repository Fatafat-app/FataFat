export interface ReviewRestaurant {
  _id?: string;
  id?: string;
  name?: string;
  images?: string[];
  image?: string;
  coverImage?: string;
  address?: {
    line1?: string;
    city?: string;
  };
  cuisines?: string[];
  rating?: {
    average: number;
    count: number;
  };
}

export interface ReviewOrder {
  _id?: string;
  id?: string;
  orderNumber?: string;
  items?: Array<{ name: string; quantity: number }>;
  totalAmount?: number;
  pricing?: { totalPaise?: number };
  createdAt?: string;
  orderStatus?: string;
  status?: string;
}

export interface Review {
  _id: string;
  id?: string;
  user: {
    _id?: string;
    id?: string;
    name?: string;
    avatar?: string;
  } | string;
  restaurant?: ReviewRestaurant;
  order?: ReviewOrder;
  rating: number;
  text?: string;
  images?: string[];
  isVisible?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SubmitReviewPayload {
  orderId: string;
  rating: number;
  text?: string;
  images?: string[];
}
