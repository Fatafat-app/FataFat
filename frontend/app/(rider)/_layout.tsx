import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { Typography, Colors } from '../../constants/Theme';

export default function RiderLayout() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }
  
  const riderRoles = ['delivery_partner', 'rider'];
  if (!isLoading && (!user || !riderRoles.includes(user.role))) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Duty',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'Current Run',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'navigate' : 'navigate-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
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
