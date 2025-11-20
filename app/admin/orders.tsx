// 📄 app/admin/orders.tsx

import CustomButton from '@/components/CustomButton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order extends Models.Document {
  userId: string;
  deliveryAddress: string;
  total: number;
  status: string;
  createdAt: string;
  items: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        'orders',
        [Query.orderDesc('$createdAt')],
        50
      );
      setOrders(response.documents as Order[]);
    } catch (e) {
      console.error('Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        'orders',
        orderId,
        { status }
      );
      fetchOrders(); // refresh
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="h1-bold p-4">Orders ({orders.length})</Text>

      {loading ? (
        <Text className="p-5 text-center">Loading...</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.$id}
          contentContainerClassName="p-2 gap-3"
          renderItem={({ item }) => (
            <View className="border border-gray-200 rounded-xl p-4">
              <View className="flex-row justify-between">
                <Text className="h3-bold">Order #{item.$id.slice(0, 6)}</Text>
                <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                  <Text className="body-medium">{item.status}</Text>
                </View>
              </View>
              <Text className="body-regular text-gray-600 mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text className="body-medium mt-2">{item.deliveryAddress}</Text>
              <Text className="h3-bold mt-2">${item.total.toFixed(2)}</Text>

              <View className="flex-row mt-3 gap-2">
                {item.status === 'pending' && (
                  <CustomButton
                    title="Confirm"
                    onPress={() => updateOrderStatus(item.$id, 'confirmed')}
                    style="flex-1 bg-green-500"
                  />
                )}
                {['pending', 'confirmed'].includes(item.status) && (
                  <CustomButton
                    title="Cancel"
                    onPress={() => updateOrderStatus(item.$id, 'cancelled')}
                    style="flex-1 bg-red-500"
                  />
                )}
                
              <CustomButton
                title="View"
                onPress={() => router.push(`/admin/orders/${item.$id}`)}
                style="flex-1 bg-gray-500"
              />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}