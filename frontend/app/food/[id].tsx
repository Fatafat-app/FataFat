import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function FoodScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Food Details for {id}</Text>
    </View>
  );
}
