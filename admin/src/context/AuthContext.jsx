import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';

const AuthContext = createContext(null);

const ADMIN_ROLES = [
  'admin',
  'super_admin',
  'ops_admin',
  'catalog_admin',
  'finance_admin',
  'support_admin',
];

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes auto-lock for security

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fatafat_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('fatafat_admin_token');
    return saved && saved !== 'demo-admin-jwt-token' && saved !== 'null' ? saved : null;
  });

  const [loading, setLoading] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fatafat_admin_token');
    localStorage.removeItem('fatafat_admin_user');
    delete apiClient.defaults.headers.common['Authorization'];
  }, []);

  // Update Axios headers whenever token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('fatafat_admin_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('fatafat_admin_token');
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem('fatafat_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fatafat_admin_user');
    }
  }, [user]);

  // Security: Auto Inactivity Logout Timer
  useEffect(() => {
    if (!token) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        console.warn('Admin session timed out due to 30 minutes of inactivity.');
        logout();
        alert('Your admin session has expired due to 30 minutes of inactivity. Please log in again.');
      }
    }, 60 * 1000); // Check every minute

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [token, logout]);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const payload = { password };
      if (identifier.includes('@')) {
        payload.email = identifier.trim();
      } else {
        payload.phone = identifier.trim();
      }

      const res = await apiClient.post('/auth/login', payload);
      if (res.data?.data) {
        const receivedUser = res.data.data.user;
        const receivedToken = res.data.data.accessToken || res.data.data.token;

        // Security check: Only verified admin roles permitted
        const role = (receivedUser.role || '').toLowerCase();
        if (!ADMIN_ROLES.includes(role)) {
          logout();
          return {
            success: false,
            message: 'Access Denied: You do not have administrative privileges for this panel.',
          };
        }

        // Synchronously save token to localStorage and axios defaults
        localStorage.setItem('fatafat_admin_token', receivedToken);
        localStorage.setItem('fatafat_admin_user', JSON.stringify(receivedUser));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

        setUser(receivedUser);
        setToken(receivedToken);
        lastActivityRef.current = Date.now();
        return { success: true };
      }
      return { success: false, message: 'Invalid response received from authentication server.' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials or server offline';
      return {
        success: false,
        message: msg,
      };
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user && ADMIN_ROLES.includes((user.role || '').toLowerCase());

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token && isAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
