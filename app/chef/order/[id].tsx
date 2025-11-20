// 📄 app/chef/order/[id].tsx

import CustomButton from '@/components/CustomButton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order extends Models.Document {
  deliveryAddress: string;
  paymentMethod: string;
  status: string;
  items: string;
}

export default function ChefOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const doc = await databases.getDocument(
          appwriteConfig.databaseId,
          'orders',
          id
        );
        setOrder(doc as Order);
        setItems(JSON.parse(doc.items));
      } catch (e) {
        console.error('Order not found:', e);
      }
    };
    fetchOrder();
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        'orders',
        id,
        { status }
      );
    } catch (e) {
      console.error('Update failed:', e);
      alert('Failed to update order');
    }
  };

  if (!order) return <Text className="p-5">Loading...</Text>;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="p-4">
        <View className="mb-6">
          <Text className="h2-bold text-green-700">Order Detail</Text>
          <Text className="body-medium text-gray-600">#{id.slice(0, 8)}</Text>
        </View>

        {/* Status */}
        <View className="mb-6 p-4 bg-green-50 rounded-xl">
          <Text className="body-bold text-green-700">Status</Text>
          <Text className="h2-bold capitalize">{order.status}</Text>
        </View>

        {/* Items */}
        <View className="mb-6">
          <Text className="h3-bold mb-3">Items to Prepare</Text>
          {items.map((item, idx) => (
            <View key={idx} className="py-3 border-b border-gray-200">
              <Text className="h3-bold">{item.quantity}× {item.name}</Text>
              {item.customizations?.length > 0 && (
                <View className="mt-1 ml-4">
                  {item.customizations.map((c: any, i: number) => (
                    <Text key={i} className="body-medium text-amber-700">
                      • {c.name} (+${c.price})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Address & Payment */}
        <View className="gap-3 mb-6">
          <View>
            <Text className="body-bold text-gray-500">Delivery Address</Text>
            <Text className="body-medium">{order.deliveryAddress}</Text>
          </View>
          <View>
            <Text className="body-bold text-gray-500">Payment</Text>
            <Text className="body-medium">
              {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Credit on Delivery'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {order.status === 'confirmed' && (
          <View className="gap-3">
            <CustomButton
              title="✅ Accept Order"
              onPress={() => updateStatus('accepted')}
              style="bg-green-600"
            />
            <CustomButton
              title="❌ Reject Order"
              onPress={() => updateStatus('rejected')}
              style="bg-red-600"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}