// 📄 app/chef/index.tsx

import CustomButton from '@/components/CustomButton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order extends Models.Document {
  $id: string;
  userId: string;
  deliveryAddress: string;
  total: number;
  status: string;
  createdAt: string;
  items: string;
}

export default function ChefDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 🔁 Poll every 15s for new confirmed orders
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConfirmedOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchConfirmedOrders = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        'orders',
        [
          Query.equal('status', 'confirmed'),
          Query.orderAsc('$createdAt')
        ],
        20
      );
      setOrders(response.documents as Order[]);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedOrders();
  }, []);

  const acceptOrder = async (orderId: string) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        'orders',
        orderId,
        { 
          status: 'accepted',
          acceptedAt: new Date().toISOString()
        }
      );
      fetchConfirmedOrders(); // refresh
    } catch (e) {
      console.error('Accept failed:', e);
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm('Reject this order? Stock will be restored.')) return;
    try {
      // 🔹 1. Get order items
      const order = await databases.getDocument(
        appwriteConfig.databaseId,
        'orders',
        orderId
      ) as Order;
      const items = JSON.parse(order.items);

      // 🔹 2. Restore stock
      await Promise.all(
        items.map((item: any) =>
          databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.menuTableId,
            item.id,
            {
              stock: item.stock + item.quantity // assumes you stored original stock — or re-fetch
            }
          )
        )
      );

      // 🔹 3. Update order
      await databases.updateDocument(
        appwriteConfig.databaseId,
        'orders',
        orderId,
        { 
          status: 'rejected',
          rejectedAt: new Date().toISOString()
        }
      );

      fetchConfirmedOrders();
    } catch (e) {
      console.error('Reject failed:', e);
      alert('Failed to reject order. Check logs.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="h1-bold text-green-700">Chef Dashboard</Text>
        <Text className="body-regular text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
        <TouchableOpacity
          className="mt-2 w-24 py-1 bg-green-100 rounded-full items-center"
          onPress={fetchConfirmedOrders}
        >
          <Text className="body-medium text-green-700">Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text className="p-5 text-center">Loading orders...</Text>
      ) : orders.length === 0 ? (
        <Text className="p-5 text-center text-gray-500">
          🎉 No confirmed orders. Great job!
        </Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.$id}
          contentContainerClassName="p-2 gap-3"
          renderItem={({ item }) => (
            <View className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-xl">
              <View className="flex-row justify-between">
                <Text className="h3-bold">Order #{item.$id.slice(0, 8)}</Text>
                <Text className="body-medium text-gray-600">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text className="body-medium mt-1">{item.deliveryAddress}</Text>
              <Text className="h3-bold mt-2">${item.total.toFixed(2)}</Text>

              <View className="flex-row mt-3 gap-2">
                <CustomButton
                  title="Accept"
                  onPress={() => acceptOrder(item.$id)}
                  style="flex-1 bg-green-600"
                />
                <CustomButton
                  title="Reject"
                  onPress={() => rejectOrder(item.$id)}
                  style="flex-1 bg-red-600"
                />
                <CustomButton
                  title="View"
                  onPress={() => router.push(`/chef/order/${item.$id}`)}
                  style="flex-1 bg-gray-600"
                />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}