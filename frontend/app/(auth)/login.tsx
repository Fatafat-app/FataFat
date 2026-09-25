import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';

export default function LoginScreen() {
  const setToken = useAuthStore((state) => state.setToken);

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5EE]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Top Section */}
        <View className="px-6 pt-12 pb-8 items-center">
          <Text className="text-5xl font-extrabold text-[#4A2B11] mb-2">Ftafat</Text>
          <Text className="text-[#8C5E35] text-lg font-bold">Bhook lagi?</Text>
          <Text className="text-[#C6501E] text-lg font-bold mb-6">Ftafat aa raha hai!</Text>

          {/* Features Row */}
          <View className="flex-row justify-between w-full px-4 mb-4">
            <FeatureIcon icon="restaurant-outline" text="Wide\nVariety" />
            <FeatureIcon icon="bicycle-outline" text="Fast\nDelivery" />
            <FeatureIcon icon="star-outline" text="Great\nOffers" />
          </View>
        </View>

        {/* Main Card */}
        <View className="bg-white rounded-[32px] mx-4 p-6 shadow-sm mb-8 relative z-10">
          {/* Tabs */}
          <View className="flex-row bg-[#FFF0E6] rounded-full p-1 mb-6">
            <TouchableOpacity className="flex-1 bg-[#DE5B26] rounded-full py-3 items-center shadow-sm">
              <Text className="text-white font-bold text-base">Login</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-full py-3 items-center">
              <Text className="text-[#A77B5A] font-bold text-base">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Phone Input */}
          <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-3 mb-6 bg-white">
            <View className="flex-row items-center mr-3">
              <Text className="text-xl mr-1">🇮🇳</Text>
              <Text className="text-black font-semibold">+91</Text>
              <Ionicons name="chevron-down" size={16} color="black" className="ml-1" />
            </View>
            <View className="h-full w-[1px] bg-gray-200 mr-3" />
            <TextInput
              placeholder="Enter your phone number"
              className="flex-1 text-base text-black"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            className="bg-[#DE5B26] rounded-2xl py-4 flex-row justify-center items-center mb-6 shadow-md"
            onPress={() => setToken('dummy-token')}
          >
            <Text className="text-white font-bold text-lg mr-2">Continue</Text>
            <View className="bg-white rounded-full p-1 absolute right-4">
              <Ionicons name="arrow-forward" size={16} color="#DE5B26" />
            </View>
          </TouchableOpacity>

          {/* OR Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="text-gray-400 font-semibold px-4 text-xs">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Social Logins */}
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3 mr-2 bg-white">
              <Ionicons name="logo-google" size={20} color="#DB4437" className="mr-2" />
              <Text className="text-black font-semibold text-xs text-center">Continue{'\n'}with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3 ml-2 bg-white">
              <Ionicons name="logo-apple" size={20} color="black" className="mr-2" />
              <Text className="text-black font-semibold text-xs text-center">Continue{'\n'}with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Checkbox */}
          <View className="flex-row items-center justify-center mb-6">
            <View className="w-5 h-5 bg-[#DE5B26] rounded-[4px] items-center justify-center mr-2">
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
            <Text className="text-gray-700 text-sm">Remember my login for faster sign-in</Text>
          </View>

          {/* Footer Text */}
          <Text className="text-center text-gray-500 text-xs mb-1">By continuing, you agree to our</Text>
          <View className="flex-row justify-center">
            <Text className="text-[#DE5B26] text-xs underline mx-1">Terms of Service</Text>
            <Text className="text-[#DE5B26] text-xs underline mx-1">Privacy Policy</Text>
            <Text className="text-[#DE5B26] text-xs underline mx-1">Content Policy</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureIcon({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="items-center">
      <View className="bg-[#F8A881] w-14 h-14 rounded-full items-center justify-center mb-2 shadow-sm">
        <Ionicons name={icon} size={28} color="white" />
      </View>
      <Text className="text-center text-[#4A2B11] text-xs font-semibold">{text}</Text>
    </View>
  );
}
