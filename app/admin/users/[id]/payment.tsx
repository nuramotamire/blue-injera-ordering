// 📄 app/admin/users/[id]/payment.tsx
import CustomButton from '@/components/CustomButton';
import CustomHeader from '@/components/CustomHeader';
import CustomInput from '@/components/CustomInput';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order extends Models.Document {
  total: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface UserDoc extends Models.Document {
  name: string;
  email: string;
}

export default function RecordPayment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [totalDebt, setTotalDebt] = useState(0);
  const [bulkAmount, setBulkAmount] = useState('');

  const fetchUserAndOrders = async () => {
    setLoading(true);
    try {
      const userDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        id
      );
      setUser(userDoc as UserDoc);

      // 🔹 Only fetch orders with debt > 0
      const orderRes = await databases.listDocuments(
        appwriteConfig.databaseId,
        'orders',
        [
          Query.equal('userId', id),
          Query.notEqual('status', 'delivered'),
          Query.notEqual('status', 'cancelled'),
        ],
        50
      );

      const unpaidOrders = (orderRes.documents as Order[]).filter(order => {
        const paid = order.paidAmount || 0;
        const debt = order.total - paid;
        return debt > 0.01; // ✅ tolerance for floating point
      });

      setOrders(unpaidOrders);

      // Calculate total debt
      const total = unpaidOrders.reduce((sum, order) => {
        const paid = order.paidAmount || 0;
        return sum + (order.total - paid);
      }, 0);
      setTotalDebt(total);

      // Init amounts
      const initAmounts: Record<string, string> = {};
      unpaidOrders.forEach(o => initAmounts[o.$id] = '');
      setAmounts(initAmounts);
    } catch (e: any) {
      console.error('Fetch failed:', e);
      Alert.alert('Error', e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchUserAndOrders();
  }, [id]);

  // 🔹 Floating-point-safe comparison
  const round = (num: number) => Math.round(num * 100) / 100;

  const handleAmountChange = (orderId: string, value: string) => {
    const clean = value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, '');
    const parts = clean.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmounts(prev => ({ ...prev, [orderId]: clean }));
  };

  const recordPayment = async (orderId: string) => {
    const amountStr = amounts[orderId];
    if (!amountStr) {
      Alert.alert('Input Required', 'Enter an amount');
      return;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid positive amount');
      return;
    }

    const order = orders.find(o => o.$id === orderId);
    if (!order) return;

    const currentPaid = order.paidAmount || 0;
    const debt = round(order.total - currentPaid);

    // ✅ Fix: Use tolerance for floating point
    if (round(amount - debt) > 0.01) {
      Alert.alert('Overpayment', `Maximum due is $${debt.toFixed(2)}`);
      return;
    }

    try {
      const newPaid = round(currentPaid + amount);
      const newStatus = newPaid >= round(order.total) ? 'paid' : 'partial';

      await databases.updateDocument(
        appwriteConfig.databaseId,
        'orders',
        orderId,
        {
          paidAmount: newPaid,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      );

      Alert.alert('✅ Success', `Recorded $${amount.toFixed(2)} payment`);
      fetchUserAndOrders(); // ✅ refresh — hides paid orders
    } catch (e: any) {
      console.error('Payment failed:', e);
      Alert.alert('❌ Error', e.message || 'Update failed');
    }
  };

  // 🔹 NEW: Bulk payment (pay across all orders)
  const recordBulkPayment = async () => {
    if (!bulkAmount) {
      Alert.alert('Input Required', 'Enter amount to apply');
      return;
    }

    const amount = parseFloat(bulkAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }

    if (round(amount - totalDebt) > 0.01) {
      Alert.alert('Overpayment', `Total debt is $${totalDebt.toFixed(2)}`);
      return;
    }

    try {
      let remaining = amount;

      // Apply payment in order (oldest first)
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const order of sortedOrders) {
        if (remaining <= 0) break;

        const paid = order.paidAmount || 0;
        const debt = round(order.total - paid);
        const apply = Math.min(debt, remaining);

        const newPaid = round(paid + apply);
        const newStatus = newPaid >= round(order.total) ? 'paid' : 'partial';

        await databases.updateDocument(
          appwriteConfig.databaseId,
          'orders',
          order.$id,
          {
            paidAmount: newPaid,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
        );

        remaining = round(remaining - apply);
      }

      Alert.alert('✅ Success', `Applied $${amount.toFixed(2)} across orders`);
      fetchUserAndOrders();
    } catch (e: any) {
      console.error('Bulk payment failed:', e);
      Alert.alert('❌ Error', e.message || 'Bulk update failed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }

  // ✅ Hide fully paid — orders list is already filtered
  const hasDebt = totalDebt > 0.01;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CustomHeader title={`Payments — ${user?.name || 'User'}`} />

      {hasDebt ? (
        <View className="p-4 bg-red-50 border-b border-red-200">
          <Text className="h3-bold text-red-800">Total Debt: ${totalDebt.toFixed(2)}</Text>
          <View className="flex-row gap-2 mt-2">
            <CustomInput
              value={bulkAmount}
              onChangeText={setBulkAmount}
              placeholder="e.g. 25.50"
              keyboardType="numeric"
              containerStyle="flex-1"
            />
            <CustomButton
              title="✓ Pay All"
              onPress={recordBulkPayment}
              style="px-4 bg-green-600"
            />
          </View>
        </View>
      ) : (
        <View className="p-4 bg-green-50 border-b border-green-200">
          <Text className="h3-bold text-green-800">✅ All orders paid!</Text>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={item => item.$id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => {
          const paid = item.paidAmount || 0;
          const debt = round(item.total - paid);
          return (
            <View key={item.$id} className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between">
                <Text className="h3-bold">Order #{item.$id.slice(0, 6)}</Text>
                <Text className="body-bold text-red-500">${debt.toFixed(2)} due</Text>
              </View>
              <Text className="body-medium mt-1">
                ${item.total.toFixed(2)} total • {item.paymentMethod}
              </Text>

              <View className="mt-3">
                <CustomInput
                  label="Pay amount"
                  value={amounts[item.$id] || ''}
                  onChangeText={(text) => handleAmountChange(item.$id, text)}
                  keyboardType="numeric"
                  placeholder={`Max: ${debt.toFixed(2)}`}
                />
                <CustomButton
                  title="✓ Record"
                  onPress={() => recordPayment(item.$id)}
                  style="mt-2 bg-blue-500"
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="p-6 items-center">
            {hasDebt ? (
              <Text className="text-gray-500">Processing...</Text>
            ) : (
              <>
                <Text className="text-lg text-green-700">🎉 All settled!</Text>
                <Text className="text-gray-500 mt-2">No pending payments.</Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}