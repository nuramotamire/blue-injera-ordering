// 📄 app/admin/orders.tsx
import CustomButton from '@/components/CustomButton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order extends Models.Document {
  userId: string;
  deliveryAddress: string;
  total: number;
  status: string;
  createdAt: string;
  items: string; // JSON string — consider parsing later
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.ordersTableId || 'orders', // safer fallback
        [Query.orderDesc('$createdAt')],
        50
      );
      setOrders(response.documents as Order[]);
    } catch (e) {
      console.error('Fetch failed:', e);
      Alert.alert('Error', 'Failed to load orders.');
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
        appwriteConfig.ordersTableId || 'orders',
        orderId,
        { status }
      );
      // Optimistic UI
      setOrders((prev) =>
        prev.map((order) =>
          order.$id === orderId ? { ...order, status } : order
        )
      );
    } catch (e) {
      console.error('Update failed:', e);
      Alert.alert('Error', 'Failed to update order status.');
      fetchOrders(); // refresh on error
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: string }> = {
      delivered: { label: 'Delivered', color: 'bg-green-100', icon: '✅' },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100', icon: '🟡' },
      pending: { label: 'Pending', color: 'bg-amber-100', icon: '⏳' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100', icon: '❌' },
      rejected: { label: 'Rejected', color: 'bg-red-200', icon: '🚫' },
    };
    return configs[status] || { label: status, color: 'bg-gray-100', icon: '❓' };
  };

  const renderItem = ({ item }: { item: Order }) => {
    const { label, color, icon } = getStatusConfig(item.status);
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden">
        {/* Header: ID + Status */}
        <View className="flex-row items-center justify-between p-3 border-b border-gray-100">
          <Text className="font-semibold text-gray-800">
            #<Text className="font-mono">{item.$id.slice(-6)}</Text>
          </Text>
          <View className={`flex-row items-center px-2.5 py-1 rounded-full ${color}`}>
            <Text className="text-xs mr-1">{icon}</Text>
            <Text className="text-xs font-medium text-gray-700">{label}</Text>
          </View>
        </View>

        {/* Info */}
        <View className="p-3">
          <Text className="text-xs text-gray-500">{formattedDate}</Text>
          <Text className="text-sm text-gray-700 mt-1 line-clamp-1">
            📍 {item.deliveryAddress || 'No address'}
          </Text>
          <Text className="text-lg font-bold text-emerald-600 mt-2">
            ${item.total.toFixed(2)}
          </Text>
        </View>

        {/* Actions — Compact & Right-Aligned */}
        <View className="flex-row justify-end items-center p-2.5 bg-gray-50">
          {/* Status Actions (only for pending/confirmed) */}
          {item.status === 'pending' && (
            <CustomButton
              title="Confirm"
              onPress={() => updateOrderStatus(item.$id, 'confirmed')}
              style="py-1.5 px-3 bg-green-600 rounded-lg mr-2"
              textStyle="text-white text-xs font-medium"
            />
          )}
          {['pending', 'confirmed'].includes(item.status) && (
            <TouchableOpacity
              onPress={() => updateOrderStatus(item.$id, 'cancelled')}
              className="py-1.5 px-3 bg-white border border-gray-300 rounded-lg mr-2"
            >
              <Text className="text-red-500 text-xs font-medium">Cancel</Text>
            </TouchableOpacity>
          )}

          {/* View Button — Primary Action */}
          <CustomButton
            title="View"
            onPress={() => router.push(`/admin/orders/${item.$id}`)}
            style="py-1.5 px-4 bg-primary rounded-lg"
            textStyle="text-white text-xs font-medium"
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">
          Orders ({orders.length})
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading orders…</Text>
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-5xl mb-3">📦</Text>
          <Text className="font-medium text-gray-700 mb-1">No orders yet</Text>
          <Text className="text-gray-500 text-center">
            Orders will appear here once placed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerClassName="p-3 pb-20"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}