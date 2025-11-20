// 📄 profile/orders.tsx

import CustomHeader from '@/components/CustomHeader';
import { appwriteConfig, databases } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order {
  $id: string;
  createdAt: string;
  total: number;
  status: string;
  items: string; // serialized
}

// Helper: Format date for display
const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper: Get status badge styles
const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function OrderHistory() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.$id) return;
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          'orders',
          [Query.equal('userId', user.$id), Query.orderDesc('$createdAt')],
          10
        );
        setOrders(response.documents as Order[]);
      } catch (e) {
        console.error('Failed to fetch orders:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.$id]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Pass `canGoBack` if your CustomHeader supports back button */}
      <CustomHeader title="Order History" canGoBack />

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-lg text-gray-500">Loading your orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-lg text-gray-500 text-center">
              You haven’t placed any orders yet.
            </Text>
            <Text className="text-gray-400 mt-2 text-center">
              Your order history will appear here once you place an order.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.$id}
            contentContainerClassName="p-4 gap-4"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const badgeStyle = getStatusBadgeStyle(item.status);
              return (
                <TouchableOpacity
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm active:opacity-90"
                  onPress={() => router.push(`/profile/orders/${item.$id}`)}
                  activeOpacity={0.85}
                >
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="font-semibold text-gray-900">
                        Order #{item.$id.slice(-6).toUpperCase()}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full border ${badgeStyle}`}>
                      <Text className="text-xs font-medium capitalize">
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">Total</Text>
                      <Text className="text-lg font-bold text-gray-900">
                        ${item.total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}