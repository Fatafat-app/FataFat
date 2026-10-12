import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { LiveOrders } from './pages/LiveOrders';
import { Restaurants } from './pages/Restaurants';
import { Catalog } from './pages/Catalog';
import { GroceryProducts } from './pages/GroceryProducts';
import { Coupons } from './pages/Coupons';
import { Banners } from './pages/Banners';
import { RemoteConfig } from './pages/RemoteConfig';
import { Users } from './pages/Users';
import { Notifications } from './pages/Notifications';
import { MasterData } from './pages/MasterData';
import { AuditLogs } from './pages/AuditLogs';
import { Login } from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<LiveOrders />} />
              <Route path="restaurants" element={<Restaurants />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="grocery" element={<GroceryProducts />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="banners" element={<Banners />} />
              <Route path="remote-config" element={<RemoteConfig />} />
              <Route path="users" element={<Users />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="master-data" element={<MasterData />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
