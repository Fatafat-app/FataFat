import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { Typography, Colors } from '../../constants/Theme';

export default function AdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }
  
  const adminRoles = ['admin', 'super_admin', 'ops_admin', 'catalog_admin', 'finance_admin', 'support_admin'];
  if (!isLoading && (!user || !adminRoles.includes(user.role))) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Live Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Stores',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees & Tax',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flags"
        options={{
          title: 'Controls',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'options' : 'options-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* Secondary Screens Navigable via Dashboard Launchpad */}
      <Tabs.Screen name="grocery-products" options={{ href: null, title: 'Grocery Catalog' }} />
      <Tabs.Screen name="users" options={{ href: null, title: 'Users' }} />
      <Tabs.Screen name="categories" options={{ href: null, title: 'Categories' }} />
      <Tabs.Screen name="coupons" options={{ href: null, title: 'Coupons' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Broadcast' }} />
      <Tabs.Screen name="audit" options={{ href: null, title: 'Audit' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 60,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabLabel: {
    ...Typography.label,
    fontSize: 10,
    paddingBottom: 4,
  },
});
