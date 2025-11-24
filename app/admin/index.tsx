// 📄 app/admin/index.tsx

import CustomHeader from '@/components/CustomHeader'; // ✅ import header
import { images } from '@/constants';
import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminCard = ({ title, icon, onPress }: { title: string; icon: any; onPress: () => void }) => (
  <TouchableOpacity
    className="flex-row items-center p-5 bg-white rounded-xl shadow-sm mb-4"
    onPress={onPress}
    style={{ elevation: 2 }}
    activeOpacity={0.85}
  >
    <View className="w-12 h-12 bg-amber-100 rounded-lg items-center justify-center mr-4">
      <Image source={icon} className="size-6" resizeMode="contain" tintColor=" #34a9ca" />
    </View>
    <Text className="h3-bold text-gray-900 flex-1">{title}</Text>
    <Image source={images.arrowRight} className="size-5" resizeMode="contain" tintColor="#94A3B8" />
  </TouchableOpacity>
);

export default function AdminDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ✅ Add header with back button */}
      <CustomHeader 
        title="Admin Dashboard" 
        canGoBack 
        showSearch={false} // hide search to reduce clutter
      />

      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Manage Your Business</Text>

        <View className="gap-3">
          <AdminCard
            title="Menu Management"
            icon={images.burgerOne}
            onPress={() => router.push('/admin/menu')}
          />
          <AdminCard
            title="Order Management"
            icon={images.bag}
            onPress={() => router.push('/admin/orders')}
          />
          {/* <AdminCard
            title="Categories"
            icon={images.bag}
            onPress={() => router.push('/admin/categories')}
          /> */}
          <AdminCard
            title="User Management"
            icon={images.person}
            onPress={() => router.push('/admin/users')}
          />
          <AdminCard
            title="Analytics"
            icon={images.person || images.bag} // fallback if chart icon missing
            onPress={() => router.push('/admin/analytics')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}