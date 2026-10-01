import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useGroceryStore } from '../../store/grocery.store';
import { useConfigStore } from '../../store/config.store';
import { FoodTabBar } from '../../components/FoodTabBar';
import { GroceryTabBar } from '../../components/grocery/GroceryTabBar';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const activeSection = useGroceryStore((s) => s.activeSection);
  const isFoodAvailable = useConfigStore((s) => s.isVerticalAvailable('food'));
  const foodMode = useConfigStore((s) => s.config?.verticals?.food?.mode || 'ON');
  const isFoodEnabled = isFoodAvailable && foodMode !== 'OFF';

  const isGroceryAvailable = useConfigStore((s) => s.isVerticalAvailable('grocery'));
  const groceryMode = useConfigStore((s) => s.config?.verticals?.grocery?.mode || 'ON');
  const isGroceryEnabled = isGroceryAvailable && groceryMode !== 'OFF';

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const isShowingGrocery = isGroceryEnabled && (!isFoodEnabled || activeSection === 'grocery');

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

      {/* Custom Tab Bar — Food or Grocery based on activeSection & flags */}
      {isShowingGrocery ? <GroceryTabBar /> : <FoodTabBar />}
    </>
  );
}
