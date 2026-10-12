import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fatafat_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('fatafat_admin_token');
    return saved && saved !== 'demo-admin-jwt-token' && saved !== 'null' ? saved : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('fatafat_admin_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('fatafat_admin_token');
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fatafat_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fatafat_admin_user');
    }
  }, [user]);

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

        // Synchronously save token to localStorage and axios defaults
        localStorage.setItem('fatafat_admin_token', receivedToken);
        localStorage.setItem('fatafat_admin_user', JSON.stringify(receivedUser));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

        setUser(receivedUser);
        setToken(receivedToken);
        return { success: true };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (err) {
      console.warn('Backend login response:', err.response?.data?.message || err.message);
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid credentials or server offline',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fatafat_admin_token');
    localStorage.removeItem('fatafat_admin_user');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
