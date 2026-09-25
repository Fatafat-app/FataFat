import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Restaurant Details for {id}</Text>
    </View>
  );
}
