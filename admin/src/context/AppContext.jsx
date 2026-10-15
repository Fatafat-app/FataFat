import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { paiseToRupees, rupeesToPaise } from '../utils/formatters';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { token } = useAuth() || {};
  const [stats, setStats] = useState({
    todayGmv: 0,
    gmvGrowth: '+0%',
    totalOrdersToday: 0,
    activeRiders: 0,
    pendingOrders: 0,
    rainSurgeActive: false,
    rainSurgeFee: 20,
    isMaintenanceMode: false,
  });

  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [remoteConfig, setRemoteConfig] = useState({
    minSupportedVersion: '1.0.0',
    latestVersion: '1.2.0',
    playStoreUrl: 'market://details?id=com.fatafat.app',
    isMaintenanceMode: false,
    maintenanceMessage: 'FataFat systems par scheduled maintenance chal rahi hai. Hum jald wapas aayenge.',
    rainSurgeActive: false,
    rainSurgeFee: 20,
    baseDeliveryDistanceKm: 3.0,
    baseDeliveryFee: 25,
    extraFeePerKm: 8,
    nightDeliveryFee: 15,
    enableFood: true,
    enableGrocery: true,
    enableCOD: true,
    enableWallet: false,
    enableLiveRiderMap: true,
  });

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── FETCH REAL DATA FROM BACKEND ──
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setBackendError(null);
    try {
      // 1. Health check
      await api.checkHealth();
      setIsBackendConnected(true);

      // 2. Parallel fetch
      const [
        dashRes,
        ordersRes,
        restRes,
        catRes,
        userRes,
        feeRes,
        bootstrapRes,
      ] = await Promise.allSettled([
        api.getDashboard(),
        api.getOrders({ limit: 50 }),
        api.getRestaurants({ limit: 50 }),
        api.getCategories(),
        api.getUsers({ limit: 50 }),
        api.getFees(),
        api.getBootstrapConfig(),
      ]);

      // Normalize Dashboard Stats
      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const d = dashRes.value;
        const totalRevenue = d.financials?.grossMerchandiseValue ?? d.finance?.totalRevenue ?? 0;
        const totalOrders = d.orders?.total ?? 0;
        const activeOrders = d.orders?.active ?? 0;
        const onlineRiders = d.riders?.online ?? d.logistics?.onlineRiders ?? 0;

        setStats((prev) => ({
          ...prev,
          todayGmv: paiseToRupees(totalRevenue),
          totalOrdersToday: totalOrders,
          pendingOrders: activeOrders,
          activeRiders: onlineRiders,
        }));
      }

      // Normalize Orders from MongoDB
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const rawOrders = ordersRes.value.orders || (Array.isArray(ordersRes.value) ? ordersRes.value : []);
        const mappedOrders = rawOrders.map((ord) => {
          const id = ord.orderNumber || ord._id?.toString() || 'ORD-NEW';
          const customer = ord.user || ord.customerId || {};
          const rest = ord.restaurant || ord.vendorId || {};
          const status = (ord.orderStatus || ord.status || 'PENDING').toUpperCase();
          const items = (ord.items || []).map((it) => ({
            name: it.menuItem?.name || it.name || it.itemId?.name || 'Item',
            qty: it.quantity || it.qty || 1,
            price: paiseToRupees(it.pricePaise ?? it.price ?? it.menuItem?.price ?? 0),
          }));

          return {
            id,
            rawId: ord._id,
            customerName: customer.name || 'Customer',
            customerPhone: customer.phone || 'N/A',
            restaurantName: rest.name || 'Store Partner',
            items: items.length > 0 ? items : [{ name: 'Order Items', qty: 1, price: paiseToRupees(ord.totalAmount || 0) }],
            totalAmount: paiseToRupees(ord.totalAmount || ord.pricing?.totalPaise || ord.pricing?.grandTotal || 0),
            paymentMethod: ord.paymentMethod || ord.payment?.method || 'ONLINE',
            status,
            riderName: ord.deliveryPartner?.name || ord.deliveryPartnerId?.name || (status === 'OUT_FOR_DELIVERY' ? 'Assigned Partner' : 'Unassigned'),
            riderPhone: ord.deliveryPartner?.phone || ord.deliveryPartnerId?.phone || '-',
            placedAt: ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            address: ord.deliveryAddress ? `${ord.deliveryAddress.line1 || ''}, ${ord.deliveryAddress.city || ''}` : 'Location provided in app',
          };
        });
        setOrders(mappedOrders);
      }

      // Normalize Restaurants from MongoDB
      if (restRes.status === 'fulfilled' && restRes.value) {
        const rawRestaurants = restRes.value.restaurants || (Array.isArray(restRes.value) ? restRes.value : []);
        const mappedRestaurants = rawRestaurants.map((r) => {
          let ratingValue = 4.5;
          if (r.rating && typeof r.rating === 'object') {
            ratingValue = typeof r.rating.average === 'number' && r.rating.average > 0 ? r.rating.average : 4.5;
          } else if (typeof r.rating === 'number' && r.rating > 0) {
            ratingValue = r.rating;
          }

          return {
            id: r._id?.toString() || r.id,
            name: r.name || 'Restaurant',
            category: r.type === 'grocery' || r.vertical === 'grocery' ? 'Grocery' : 'Food',
            cuisine: Array.isArray(r.cuisines) ? r.cuisines.join(', ') : r.cuisines || 'Multi-cuisine',
            rating: ratingValue,
            isOpen: r.isAcceptingOrders !== false && r.isActive !== false,
            commissionRate: r.commissionRate || 18,
            activeOrders: 0,
            phone: r.phone || 'N/A',
            locality: r.address ? `${r.address.street || r.address.line1 || ''}, ${r.address.city || ''}` : 'City Centre',
          };
        });
        setRestaurants(mappedRestaurants);
      }

      // Normalize Categories from MongoDB
      if (catRes.status === 'fulfilled' && catRes.value) {
        const rawCategories = Array.isArray(catRes.value) ? catRes.value : [];
        const mappedCategories = rawCategories.map((c, i) => ({
          id: c._id?.toString() || c.id || `CAT-${i}`,
          name: c.name || 'Category',
          itemCount: c.itemCount || 0,
          order: c.order || i + 1,
          active: c.isActive !== false,
          image: c.image || '',
        }));
        setCategories(mappedCategories);
      }

      // Normalize Users from MongoDB
      if (userRes.status === 'fulfilled' && userRes.value) {
        const rawUsers = userRes.value.users || (Array.isArray(userRes.value) ? userRes.value : []);
        const mappedUsers = rawUsers.map((u) => ({
          id: u._id?.toString() || u.id,
          name: u.name || 'User',
          phone: u.phone || 'N/A',
          email: u.email || 'N/A',
          role: (u.role || 'CUSTOMER').toUpperCase(),
          ordersCount: u.totalOrders || u.ordersCount || 0,
          status: u.isActive !== false ? 'ACTIVE' : 'BLOCKED',
        }));
        setUsers(mappedUsers);
      }

      // Normalize Fees & Dynamic Pricing (Paise to Rupees)
      if (feeRes.status === 'fulfilled' && feeRes.value) {
        const f = feeRes.value;
        const surgeInRupees = paiseToRupees(f.surgeFee ?? 2000);
        const baseDeliveryInRupees = paiseToRupees(f.baseDeliveryFee ?? 2500);

        setRemoteConfig((prev) => ({
          ...prev,
          rainSurgeActive: Boolean(f.surgeFeeEnabled),
          rainSurgeFee: surgeInRupees || 20,
          baseDeliveryFee: baseDeliveryInRupees || 25,
        }));
        setStats((prev) => ({
          ...prev,
          rainSurgeActive: Boolean(f.surgeFeeEnabled),
          rainSurgeFee: surgeInRupees || 20,
        }));
      }

      // Normalize Bootstrap Config
      if (bootstrapRes.status === 'fulfilled' && bootstrapRes.value) {
        const b = bootstrapRes.value;
        if (b.versioning) {
          setRemoteConfig((prev) => ({
            ...prev,
            minSupportedVersion: b.versioning.minSupportedVersion || prev.minSupportedVersion,
            latestVersion: b.versioning.latestVersion || prev.latestVersion,
            playStoreUrl: b.versioning.playStoreUrl || prev.playStoreUrl,
          }));
        }
        if (b.maintenance) {
          setRemoteConfig((prev) => ({
            ...prev,
            isMaintenanceMode: Boolean(b.maintenance.isUnderMaintenance),
            maintenanceMessage: b.maintenance.message || prev.maintenanceMessage,
          }));
        }
        if (b.featureFlags) {
          setRemoteConfig((prev) => ({
            ...prev,
            enableFood: b.featureFlags.enableFood ?? prev.enableFood,
            enableGrocery: b.featureFlags.enableGrocery ?? prev.enableGrocery,
            enableCOD: b.featureFlags.enableCOD ?? prev.enableCOD,
            enableWallet: b.featureFlags.enableWallet ?? prev.enableWallet,
            enableLiveRiderMap: b.featureFlags.enableLiveRiderMap ?? prev.enableLiveRiderMap,
          }));
        }
      }

    } catch (err) {
      console.warn('Backend connection notice:', err.message);
      setIsBackendConnected(false);
      setBackendError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllData();
      const interval = setInterval(() => {
        fetchAllData();
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [token, fetchAllData]);

  // ── REAL MUTATION METHODS ──

  // 1. Update Order Status in Real MongoDB
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      const targetId = targetOrder?.rawId || orderId;

      await api.updateOrderStatus(targetId, newStatus);
      showToast(`Order status updated to ${newStatus} in database!`);
      // Optimistic update
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } catch (err) {
      showToast(`Failed to update order: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // 2. Toggle Restaurant Status in Real MongoDB
  const toggleRestaurantStatus = async (restaurantId) => {
    const rest = restaurants.find((r) => r.id === restaurantId);
    if (!rest) return;
    const nextState = !rest.isOpen;

    try {
      await api.updateRestaurantStatus(restaurantId, {
        isAcceptingOrders: nextState,
        isActive: nextState,
      });
      showToast(`${rest.name} is now ${nextState ? 'ONLINE' : 'OFFLINE'}`);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurantId ? { ...r, isOpen: nextState } : r))
      );
    } catch (err) {
      showToast(`Failed to update store: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // 3. Toggle Rain Surge in Real Fee Config
  const toggleRainSurge = async () => {
    const nextState = !remoteConfig.rainSurgeActive;
    try {
      await api.updateFees({
        surgeFeeEnabled: nextState,
        surgeFee: rupeesToPaise(remoteConfig.rainSurgeFee),
      });
      setRemoteConfig((prev) => ({ ...prev, rainSurgeActive: nextState }));
      setStats((prev) => ({ ...prev, rainSurgeActive: nextState }));
      showToast(`Rain Surge ${nextState ? 'ACTIVATED (₹' + remoteConfig.rainSurgeFee + ')' : 'DEACTIVATED'} across all apps!`);
    } catch (err) {
      showToast(`Surge update error: ${err.message}`, 'error');
    }
  };

  // 4. Toggle Maintenance Mode
  const toggleMaintenanceMode = () => {
    const nextState = !remoteConfig.isMaintenanceMode;
    setRemoteConfig((prev) => ({ ...prev, isMaintenanceMode: nextState }));
    setStats((prev) => ({ ...prev, isMaintenanceMode: nextState }));
    showToast(
      nextState
        ? '⚠️ EMERGENCY: App Maintenance Mode is now LIVE! Checkout locked.'
        : 'Maintenance mode deactivated. Customer apps back online!',
      nextState ? 'warning' : 'success'
    );
  };

  // 5. Update Fee Config & Remote Slabs (Send in Paise)
  const updateConfig = async (newConfig) => {
    try {
      await api.updateFees({
        baseDeliveryFee: rupeesToPaise(newConfig.baseDeliveryFee),
        surgeFee: rupeesToPaise(newConfig.rainSurgeFee),
        surgeFeeEnabled: newConfig.rainSurgeActive,
      });
      setRemoteConfig(newConfig);
      setStats((prev) => ({
        ...prev,
        rainSurgeActive: newConfig.rainSurgeActive,
        rainSurgeFee: newConfig.rainSurgeFee,
        isMaintenanceMode: newConfig.isMaintenanceMode,
      }));
      showToast('Dynamic pricing and remote settings saved to server!');
    } catch (err) {
      showToast(`Failed to save settings: ${err.message}`, 'error');
    }
  };

  // 6. Toggle User Account in Real DB
  const toggleUserStatus = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const nextActive = targetUser.status !== 'ACTIVE';

    try {
      await api.updateUser(userId, { isActive: nextActive });
      const newStatus = nextActive ? 'ACTIVE' : 'BLOCKED';
      showToast(`User account is now ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      showToast(`Failed to update user: ${err.message}`, 'error');
    }
  };

  // 7. Toggle Menu Item
  const toggleItemStock = (itemId) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, inStock: !item.inStock };
          showToast(`${item.name} marked as ${updated.inStock ? 'IN STOCK' : 'OUT OF STOCK'}`);
          return updated;
        }
        return item;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        stats,
        setStats,
        orders,
        updateOrderStatus,
        restaurants,
        toggleRestaurantStatus,
        remoteConfig,
        updateConfig,
        toggleRainSurge,
        toggleMaintenanceMode,
        categories,
        setCategories,
        menuItems,
        toggleItemStock,
        users,
        setUsers,
        toggleUserStatus,
        toast,
        showToast,
        audioChimeEnabled,
        setAudioChimeEnabled,
        isLoading,
        isBackendConnected,
        backendError,
        refetchAll: fetchAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
