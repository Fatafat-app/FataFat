import { Tabs, Redirect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { View, Platform, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { Colors, STYLISH_FONT, BOLD_FONT } from '../../constants/Theme';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: BOLD_FONT,
          fontSize: 10,
          marginTop: 4,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrapper: {
    padding: 6,
    borderRadius: 12,
    marginBottom: -6,
  }
});
