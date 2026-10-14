import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fatafat_admin_token');
  if (token && token !== 'demo-admin-jwt-token' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('fatafat_admin_token');
      localStorage.removeItem('fatafat_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── REAL BACKEND API METHODS ──
export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Auth
  login: async ({ email, phone, password }) => {
    const payload = { password };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    const res = await apiClient.post('/auth/login', payload);
    return res.data?.data;
  },

  // Dashboard
  getDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data?.data;
  },

  // Orders
  getOrders: async (params = {}) => {
    const res = await apiClient.get('/admin/orders', { params });
    return res.data?.data;
  },
  updateOrderStatus: async (orderId, status, reason = 'Admin manual status override') => {
    const res = await apiClient.patch(`/admin/orders/${orderId}/status`, { status, reason });
    return res.data?.data;
  },

  // Restaurants / Stores
  getRestaurants: async (params = {}) => {
    const res = await apiClient.get('/admin/restaurants', { params });
    return res.data?.data;
  },
  updateRestaurantStatus: async (restaurantId, payload) => {
    const res = await apiClient.patch(`/admin/restaurants/${restaurantId}/status`, payload);
    return res.data?.data;
  },
  createRestaurant: async (payload) => {
    const res = await apiClient.post('/restaurants', payload);
    return res.data?.data;
  },

  // Restaurant Menu Management
  getRestaurantMenu: async (restaurantId) => {
    const res = await apiClient.get(`/restaurants/${restaurantId}/menu`);
    return res.data?.data?.menu || [];
  },
  addRestaurantMenuItem: async (restaurantId, payload) => {
    const res = await apiClient.post(`/restaurants/${restaurantId}/menu/items`, payload);
    return res.data?.data?.item || res.data?.data;
  },
  updateRestaurantMenuItem: async (restaurantId, itemId, payload) => {
    const res = await apiClient.patch(`/restaurants/${restaurantId}/menu/items/${itemId}`, payload);
    return res.data?.data?.item || res.data?.data;
  },
  toggleRestaurantMenuItemAvailability: async (restaurantId, itemId) => {
    const res = await apiClient.patch(`/restaurants/${restaurantId}/menu/items/${itemId}/availability`);
    return res.data?.data;
  },
  deleteRestaurantMenuItem: async (restaurantId, itemId) => {
    const res = await apiClient.delete(`/restaurants/${restaurantId}/menu/items/${itemId}`);
    return res.data;
  },
  addRestaurantCategory: async (restaurantId, payload) => {
    const res = await apiClient.post(`/restaurants/${restaurantId}/menu/categories`, payload);
    return res.data?.data;
  },
  deleteRestaurantCategory: async (restaurantId, categoryId) => {
    const res = await apiClient.delete(`/restaurants/${restaurantId}/menu/categories/${categoryId}`);
    return res.data;
  },

  // Categories & Catalog
  getCategories: async (onlyActive = false) => {
    const res = await apiClient.get('/admin/categories', { params: { onlyActive } });
    return res.data?.data?.categories || [];
  },
  createCategory: async (payload) => {
    const res = await apiClient.post('/admin/categories', payload);
    return res.data?.data?.category;
  },
  updateCategory: async (id, payload) => {
    const res = await apiClient.put(`/admin/categories/${id}`, payload);
    return res.data?.data?.category;
  },
  deleteCategory: async (id) => {
    const res = await apiClient.delete(`/admin/categories/${id}`);
    return res.data;
  },
  reorderCategories: async (items) => {
    const res = await apiClient.put('/admin/categories/reorder', { items });
    return res.data?.data?.categories;
  },

  // Menu items search / listing
  searchCatalog: async (query = '') => {
    try {
      const res = await apiClient.get('/catalog/search', { params: { q: query } });
      return res.data?.data?.items || res.data?.data || [];
    } catch {
      return [];
    }
  },

  // Users
  getUsers: async (params = {}) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data?.data;
  },
  updateUser: async (userId, payload) => {
    const res = await apiClient.patch(`/admin/users/${userId}`, payload);
    return res.data?.data?.user;
  },

  // Vertical Kill Switches (Food / Grocery)
  getVerticals: async () => {
    try {
      const res = await apiClient.get('/config/verticals');
      return res.data?.data?.flags || [];
    } catch {
      return [];
    }
  },
  setVerticalMode: async (vertical, payload) => {
    const res = await apiClient.put(`/config/verticals/${vertical}`, payload);
    return res.data?.data?.flag;
  },

  // Dynamic Pricing, Surge & Fees
  getFees: async () => {
    const res = await apiClient.get('/admin/fees');
    return res.data?.data?.config;
  },
  updateFees: async (payload) => {
    const res = await apiClient.put('/admin/fees', payload);
    return res.data?.data?.config;
  },

  // Remote Config Bootstrap
  getBootstrapConfig: async () => {
    const res = await apiClient.get('/config/bootstrap');
    return res.data?.data;
  },

  // Home Screen Layout & Section Limits
  getHomeConfig: async () => {
    const res = await apiClient.get('/admin/home-config');
    return res.data?.data?.config;
  },
  updateHomeConfig: async (sections) => {
    const res = await apiClient.put('/admin/home-config', sections);
    return res.data?.data?.config;
  },

  // Notifications Broadcast
  sendNotification: async (payload) => {
    const res = await apiClient.post('/admin/notifications', payload);
    return res.data?.data;
  },
  getNotificationHistory: async (params = {}) => {
    const res = await apiClient.get('/admin/notifications', { params });
    return res.data?.data?.notifications || [];
  },

  // Master Data (Cuisines, Dietary Types, Cancellation Reasons)
  getMasters: async (type) => {
    const res = await apiClient.get(`/masters/${type}`);
    return res.data?.data || [];
  },
  createMaster: async (type, payload) => {
    const res = await apiClient.post(`/admin/masters/${type}`, payload);
    return res.data?.data;
  },
  deleteMaster: async (type, id) => {
    const res = await apiClient.delete(`/admin/masters/${type}/${id}`);
    return res.data;
  },

  // Coupons & Promo Codes
  getCoupons: async () => {
    const res = await apiClient.get('/coupons');
    return res.data?.data?.items || res.data?.data?.coupons || [];
  },
  createCoupon: async (payload) => {
    const res = await apiClient.post('/coupons', payload);
    return res.data?.data?.coupon;
  },
  toggleCoupon: async (id) => {
    const res = await apiClient.patch(`/coupons/${id}/toggle`);
    return res.data?.data?.coupon;
  },
  deleteCoupon: async (id) => {
    const res = await apiClient.delete(`/coupons/${id}`);
    return res.data;
  },

  // Promotional Banners
  getBanners: async (params = {}) => {
    const res = await apiClient.get('/banners/admin', { params });
    return res.data?.data?.banners || res.data?.data?.items || res.data?.data || [];
  },
  createBanner: async (payload) => {
    const res = await apiClient.post('/banners', payload);
    return res.data?.data?.banner;
  },
  updateBanner: async (id, payload) => {
    const res = await apiClient.patch(`/banners/${id}`, payload);
    return res.data?.data?.banner;
  },
  toggleBanner: async (id) => {
    const res = await apiClient.patch(`/banners/${id}/toggle`);
    return res.data?.data?.banner;
  },
  deleteBanner: async (id) => {
    const res = await apiClient.delete(`/banners/${id}`);
    return res.data;
  },
  reorderBanners: async (items) => {
    const res = await apiClient.put('/banners/reorder', { items });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data?.data?.logs || [];
  },

  // Quick Grocery Products
  getGroceryProducts: async (params = {}) => {
    const res = await apiClient.get('/grocery/products', {
      params: { includeUnavailable: true, includeInactive: true, limit: 100, ...params },
    });
    return res.data?.data?.products || [];
  },
  createGroceryProduct: async (payload) => {
    const res = await apiClient.post('/grocery/products', payload);
    return res.data?.data?.product;
  },
  updateGroceryProduct: async (id, payload) => {
    const res = await apiClient.patch(`/grocery/products/${id}`, payload);
    return res.data?.data?.product;
  },
  toggleGroceryProduct: async (id) => {
    const res = await apiClient.patch(`/grocery/products/${id}/availability`);
    return res.data?.data?.product;
  },
  deleteGroceryProduct: async (id) => {
    const res = await apiClient.delete(`/grocery/products/${id}`);
    return res.data;
  },
  getGroceryCategories: async () => {
    const res = await apiClient.get('/grocery/categories');
    return res.data?.data?.categories || [];
  },
};
