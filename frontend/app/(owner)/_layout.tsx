import React from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF6000',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Live Kitchen',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu & Stock',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'fast-food' : 'fast-food-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
