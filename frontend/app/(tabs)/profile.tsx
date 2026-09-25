import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store';

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Profile Screen</Text>
      <TouchableOpacity 
        onPress={logout}
        style={{ backgroundColor: '#FF6000', padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
