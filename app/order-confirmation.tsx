// 📄 app/order-confirmation.tsx

import CustomButton from '@/components/CustomButton';
import { images } from '@/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderConfirmation() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white p-5 items-center justify-center">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
          <Image source={images.check} className="size-10" resizeMode="contain" tintColor="#10B981" />
        </View>
        <Text className="h1-bold text-dark-100 text-center">Order Placed!</Text>
        <Text className="body-regular text-gray-600 text-center mt-2">
          Your order #{orderId?.slice(0, 6)} is confirmed.  
          We’ll notify you when it’s being prepared.
        </Text>
      </View>

      <CustomButton
        title="Track Order"
        onPress={() => router.replace('/(tabs)/profile')}
        style="w-full mb-4"
      />
      <CustomButton
        title="Back to Menu"
        onPress={() => router.replace('/(tabs)/index')}
        style="w-full bg-gray-200"
        textStyle="text-dark-100"
      />
    </SafeAreaView>
  );
}