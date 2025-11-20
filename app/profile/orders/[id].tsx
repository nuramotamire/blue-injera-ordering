// 📄 profile/orders/[id].tsx

import CustomHeader from '@/components/CustomHeader';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { CartItemType } from '@/type';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order {
  $id: string;
  createdAt: string;
  deliveryAddress: string;
  paymentMethod: string;
  status: string;
  total: number;
  items: string;
}

const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'delivered': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
    case 'confirmed': return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'rejected': return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
  }
};

const getPaymentLabel = (method: string): string => {
  return method === 'cash' ? 'Cash on Delivery' : 'Card on Delivery';
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid order ID');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await databases.getDocument(
          appwriteConfig.databaseId,
          'orders',
          id
        );
        setOrder(doc as Order);
        const parsedItems = JSON.parse(doc.items) as CartItemType[];
        setItems(parsedItems);
      } catch (e: any) {
        console.error('Failed to fetch order:', e);
        setError('Order not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-500">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 p-6">
        <CustomHeader title="Order Detail" canGoBack />
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-lg text-center text-red-600 mb-2">⚠️ {error || 'Order unavailable'}</Text>
          <Text className="text-gray-500 text-center">
            Please check your connection or return to order history.
          </Text>
          <Text
            className="mt-4 text-blue-600 font-medium"
            onPress={() => router.back()}
          >
            ← Back to Orders
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(order.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CustomHeader title="Order Detail" canGoBack />

      <ScrollView
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View className={`mb-6 rounded-2xl p-5 ${statusStyle.bg} border border-gray-200`}>
          <View className="flex-row items-center gap-3 mb-2">
            <View className={`w-3 h-3 rounded-full ${statusStyle.dot}`} />
            <Text className={`font-semibold ${statusStyle.text} capitalize`}>
              {order.status}
            </Text>
          </View>
          <Text className="text-gray-600">
            {order.status === 'delivered'
              ? 'Your order has been successfully delivered!'
              : order.status === 'confirmed'
              ? 'Order confirmed and being prepared.'
              : order.status === 'pending'
              ? 'Order received — awaiting confirmation.'
              : 'This order was not accepted.'}
          </Text>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm border border-gray-100">
          <Text className="font-bold text-lg text-gray-900 mb-4">Order Summary</Text>

          {items.length === 0 ? (
            <Text className="text-gray-500 italic">No items found.</Text>
          ) : (
            items.map((item, idx) => (
              <View
                key={idx}
                className="flex-row justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <View className="flex-shrink">
                  <Text className="font-medium text-gray-900">
                    {item.quantity}× {item.name}
                  </Text>
                  {item.customizations && item.customizations.length > 0 && (
                    <Text className="text-xs text-gray-500 mt-1">
                      {item.customizations.map(c => c.name).join(', ')}
                    </Text>
                  )}
                  {item.note && (
                    <Text className="text-xs text-gray-500 mt-1 italic">
                      📝 "{item.note}"
                    </Text>
                  )}
                </View>
                <Text className="font-medium text-gray-900 self-center">
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))
          )}

          <View className="mt-4 pt-4 border-t border-gray-200 flex-row justify-between">
            <Text className="font-bold text-gray-700">Total</Text>
            <Text className="text-xl font-bold text-gray-900">
              ${order.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Order Details */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="font-bold text-lg text-gray-900 mb-4">Order Details</Text>

          <View className="gap-4">
            <InfoRow label="Order ID" value={`#${order.$id.slice(-6)}`} />
            <InfoRow label="Placed" value={formatDate(order.createdAt)} />
            <InfoRow label="Delivery Address" value={order.deliveryAddress} isMultiline />
            <InfoRow
              label="Payment Method"
              value={getPaymentLabel(order.paymentMethod)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 💡 Reusable component for clean layout
const InfoRow = ({
  label,
  value,
  isMultiline = false,
}: {
  label: string;
  value: string;
  isMultiline?: boolean;
}) => (
  <View>
    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
    </Text>
    <Text
      className={`mt-1 font-medium text-gray-900 ${isMultiline ? 'text-wrap' : ''}`}
      numberOfLines={isMultiline ? undefined : 1}
    >
      {value}
    </Text>
  </View>
);