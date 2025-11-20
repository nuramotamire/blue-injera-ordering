// 📄 app/admin/orders/[id].tsx — ✅ FIXED & DEBUGGED
import CustomButton from '@/components/CustomButton';
import CustomHeader from '@/components/CustomHeader';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { Models } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface RawOrder extends Models.Document {
  userId: string;
  deliveryAddress: string;
  total: number;
  status: string;
  items: string | any[]; // 🔹 Could be string OR parsed array!
  createdAt: string;
  updatedAt?: string;
}

interface UserDoc extends Models.Document {
  name: string;
  email: string;
  role: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  customizations?: { name: string; price: number }[];
}

interface ParsedOrder extends Omit<RawOrder, 'items'> {
  items: OrderItem[];
}

export default function OrderDetail() {
  // 🔹 Fix 1: get id safely — useLocalSearchParams may not hydrate immediately
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const navigation = useNavigation();
  
  const [order, setOrder] = useState<ParsedOrder | null>(null);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!id) {
      console.warn('❌ No order ID provided');
      setError('Invalid order ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // console.log('🔍 Fetching order:', id); // 🔹 Debug log

      const orderDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        'orders',
        id
      );

      // console.log('✅ Raw order:', orderDoc); // 🔹 Debug log

      // 🔹 Fix 2: parse items safely — handle both string and array
      let items: OrderItem[] = [];
      if (typeof orderDoc.items === 'string') {
        try {
          items = JSON.parse(orderDoc.items);
        } catch (e) {
          console.error('❌ Failed to parse items string:', orderDoc.items);
          items = [];
        }
      } else if (Array.isArray(orderDoc.items)) {
        items = orderDoc.items;
      } else {
        console.warn('⚠️ Unexpected items type:', typeof orderDoc.items);
        items = [];
      }

      const parsedOrder: ParsedOrder = {
        ...orderDoc,
        items,
      };

      setOrder(parsedOrder);

      // Fetch user
      console.log('🔍 Fetching user:', orderDoc.userId);
      const userDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        orderDoc.userId
      );
      setUser(userDoc as UserDoc);
      console.log('✅ User fetched:', userDoc.name);

    } catch (e: any) {
      console.error('💥 fetchOrder error:', e);
      const message = e?.message || 'Unknown error';
      Alert.alert('Fetch Failed', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fix 3: useEffect with proper deps + timeout safety
  useEffect(() => {
    if (id) {
      fetchOrder();
    } else {
      // If no id after 500ms, likely bad route — go back
      const timer = setTimeout(() => {
        if (!id) {
          Alert.alert('Error', 'No order ID');
          navigation.goBack();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [id]);

  // 🔹 Helper: update status
  const updateStatus = async (status: string) => {
    if (!id) return;
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        'orders',
        id,
        { status }
      );
      if (order) {
        setOrder({ ...order, status });
      }
      Alert.alert('Success', `Order status updated to ${status}`);
    } catch (e: any) {
      console.error('Update failed:', e);
      Alert.alert('Error', e.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      pending: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // ✅ Loading + Error states
  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg">Loading order...</Text>
      
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-red-500 text-center mb-2">❌ Failed to load order</Text>
        <Text className="text-gray-600 text-center mb-4">{error || 'Unknown error'}</Text>
        <CustomButton
          title="← Go Back"
          onPress={() => navigation.goBack()}
          style="bg-gray-500"
        />
      </SafeAreaView>
    );
  }

  // ✅ Render content
  return (
    <SafeAreaView className="flex-1 bg-white">
      <CustomHeader title={`Order #${id?.slice(0, 6) || '???'}`} />

      <ScrollView contentContainerClassName="p-4">
        {/* User Info */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="h3-bold mb-1">{user?.name || '—'}</Text>
          <Text className="body-medium text-gray-600">{user?.email || '—'}</Text>
          {user?.role && (
            <Text className="body-regular text-gray-500 mt-1">
              Role: <Text className="capitalize">{user.role}</Text>
            </Text>
          )}
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="h3-bold mb-2">Status</Text>
          <View className={`px-3 py-1.5 rounded-full w-fit ${getStatusColor(order.status)}`}>
            <Text className="body-bold capitalize">{order.status}</Text>
          </View>

          <View className="flex-row gap-2 mt-3 flex-wrap">
            {order.status === 'pending' && (
              <CustomButton
                title="Confirm"
                onPress={() => updateStatus('confirmed')}
                style="bg-green-500"
              />
            )}
            {['pending', 'confirmed'].includes(order.status) && (
              <CustomButton
                title="Cancel"
                onPress={() => updateStatus('cancelled')}
                style="bg-red-500"
              />
            )}
            {order.status === 'confirmed' && (
              <CustomButton
                title="Preparing"
                onPress={() => updateStatus('preparing')}
                style="bg-purple-500"
              />
            )}
            {order.status === 'preparing' && (
              <CustomButton
                title="Deliver"
                onPress={() => updateStatus('delivered')}
                style="bg-green-600"
              />
            )}
          </View>
        </View>

        {/* Items — ✅ using map(), no FlatList */}
        <View className="mb-4">
          <Text className="h3-bold mb-2">Items ({order.items.length})</Text>
          {order.items.length === 0 ? (
            <Text className="text-gray-500 italic">No items</Text>
          ) : (
            order.items.map((item, index) => (
              <View key={`${item.id}-${index}`} className="flex-row items-start mb-3">
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} className="size-12 rounded mr-3" />
                ) : (
                  <View className="size-12 bg-gray-200 rounded mr-3" />
                )}
                <View className="flex-1">
                  <Text className="body-bold">{item.name}</Text>
                  <Text className="body-regular text-gray-500">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </Text>
                  {item.customizations?.length ? (
                    <Text className="text-xs text-gray-400 mt-1">
                      + {item.customizations.map(c => c.name).join(', ')}
                    </Text>
                  ) : null}
                </View>
                <Text className="body-bold">
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Summary */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between mb-1">
            <Text className="body-medium">Total</Text>
            <Text className="body-medium">${order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="h3-bold mb-2">Address</Text>
          <Text className="body-medium">{order.deliveryAddress || '—'}</Text>
        </View>

        <View>
          <Text className="h3-bold mb-2">Timeline</Text>
          <Text className="body-regular">
            Created: {new Date(order.createdAt).toLocaleString()}
          </Text>
          {order.updatedAt && (
            <Text className="body-regular text-gray-500">
              Updated: {new Date(order.updatedAt).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}