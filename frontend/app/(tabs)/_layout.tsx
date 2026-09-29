import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useGroceryStore } from '../../store/grocery.store';
import { FoodTabBar } from '../../components/FoodTabBar';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const activeSection = useGroceryStore((s) => s.activeSection);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      {/* Expo Router Tabs — default tab bar is always hidden.
          We use custom FoodTabBar / GroceryTabBar instead. */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },   // always hidden — custom bars handle UI
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen name="index"   options={{ title: 'Home' }} />
        <Tabs.Screen name="cart"    options={{ title: 'Cart' }} />
        <Tabs.Screen name="orders"  options={{ title: 'Orders' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        <Tabs.Screen name="search"  options={{ href: null }} />
        <Tabs.Screen name="saved"   options={{ href: null }} />
      </Tabs>

      {/* Custom Food Tab Bar — shown only when food section is active */}
      {activeSection === 'food' && <FoodTabBar />}
    </>
  );
}
