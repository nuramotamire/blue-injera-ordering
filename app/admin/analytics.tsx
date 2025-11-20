// 📄 app/admin/analytics.tsx
import CustomHeader from '@/components/CustomHeader';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserDoc extends Models.Document {
  name: string;
  email: string;
}

interface Order extends Models.Document {
  userId: string;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface UserSummary {
  userId: string;
  name: string;
  email: string;
  totalSpent: number;
  cashSpent: number;
  creditSpent: number;
  totalDebt: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderAt: string;
}

const timeRanges = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 0 },
] as const;

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<(typeof timeRanges)[number]['value']>(30);
  const [summary, setSummary] = useState<UserSummary[]>([]);
  const [topUsers, setTopUsers] = useState<{ name: string; spend: number }[]>([]);

  const getDateDaysAgo = (days: number) => {
    if (days === 0) return null;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        [],
        100
      );
      const users = userRes.documents as UserDoc[];

      const since = getDateDaysAgo(timeRange);
      const queries = since ? [Query.greaterThan('createdAt', since)] : [];
      const orderRes = await databases.listDocuments(
        appwriteConfig.databaseId,
        'orders',
        queries,
        500
      );
      const orders = orderRes.documents as Order[];

      const userMap = new Map<string, UserSummary>();
      users.forEach(u => {
        userMap.set(u.$id, {
          userId: u.$id,
          name: u.name,
          email: u.email,
          totalSpent: 0,
          cashSpent: 0,
          creditSpent: 0,
          totalDebt: 0,
          orderCount: 0,
          avgOrderValue: 0,
          lastOrderAt: '',
        });
      });

      orders.forEach(order => {
        const user = userMap.get(order.userId);
        if (!user) return;

        const total = order.total ?? 0;
        const paid = order.paidAmount ?? 0;
        const debt = Math.max(0, total - paid);
        const method = order.paymentMethod || 'cash';

        user.totalSpent += total;
        user.orderCount += 1;
        if (method === 'cash') user.cashSpent += total;
        if (method === 'credit') user.creditSpent += total;
        user.totalDebt += debt;

        if (!user.lastOrderAt || order.createdAt > user.lastOrderAt) {
          user.lastOrderAt = order.createdAt;
        }
      });

      const summaries = Array.from(userMap.values())
        .map(u => ({
          ...u,
          avgOrderValue: u.orderCount > 0 ? u.totalSpent / u.orderCount : 0,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);

      setSummary(summaries);

      const top5 = summaries
        .slice(0, 5)
        .map(u => ({
          name: u.name.length > 10 ? u.name.slice(0, 8) + '…' : u.name,
          spend: Math.round(u.totalSpent),
        }));
      setTopUsers(top5);

    } catch (e: any) {
      console.error('Analytics fetch failed:', e);
      alert('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const renderHeader = useCallback(() => {
    const totalCash = summary.reduce((s, u) => s + u.cashSpent, 0);
    const totalCredit = summary.reduce((s, u) => s + u.creditSpent, 0);

    return (
      <>
        <View className="flex-row bg-white p-3 border-b border-gray-200">
          {timeRanges.map(range => (
            <TouchableOpacity
              key={range.value}
              className={`px-3 py-1.5 rounded-lg mr-2 ${
                timeRange === range.value ? 'bg-primary' : 'bg-gray-100'
              }`}
              onPress={() => setTimeRange(range.value)}
            >
              <Text className={`body-medium ${
                timeRange === range.value ? 'text-white' : 'text-gray-700'
              }`}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cash vs Credit Summary */}
        <View className="bg-white rounded-xl p-4 mb-2">
          <Text className="h3-bold mb-3">Payment Methods</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <View className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Text className="text-green-700 font-bold">${totalCash.toFixed(0)}</Text>
              </View>
              <Text className="mt-1 text-sm">Cash</Text>
            </View>
            <View className="items-center">
              <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Text className="text-blue-700 font-bold">${totalCredit.toFixed(0)}</Text>
              </View>
              <Text className="mt-1 text-sm">Credit</Text>
            </View>
          </View>
        </View>

        {/* Top Buyers Chart */}
        <View className="bg-white rounded-xl p-4 mb-2">
          <Text className="h3-bold mb-3">Top Buyers</Text>
          {topUsers.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">No purchases</Text>
          ) : (
            <BarChart
              data={{
                labels: topUsers.map(u => u.name),
                datasets: [
                  {
                    data: topUsers.map(u => u.spend),
                  },
                ],
              }}
              width={Dimensions.get('window').width - 40}
              height={200}
              yAxisLabel="$"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(254, 140, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                decimalPlaces: 0,
              }}
              showValuesOnTopOfBars
              style={{ marginVertical: 8 }}
            />
          )}
        </View>

        {/* Table Header */}
        <View className="bg-white">
          <View className="flex-row bg-gray-100 p-3">
            <Text className="flex-1 body-bold">User</Text>
            <Text className="w-20 body-bold text-right">Orders</Text>
            <Text className="w-24 body-bold text-right">Total</Text>
            <Text className="w-24 body-bold text-right text-red-500">Debt</Text>
          </View>
        </View>
      </>
    );
  }, [timeRange, topUsers, summary]);

  const renderItem = ({ item }: { item: UserSummary }) => (
    <View className="flex-row border-b border-gray-100 p-3 bg-white">
      <View className="flex-1">
        <Text className="body-medium">{item.name}</Text>
        <Text className="text-xs text-gray-500">{item.email}</Text>
      </View>
      <Text className="w-20 body-regular text-right">{item.orderCount}</Text>
      <Text className="w-24 body-regular text-right">${item.totalSpent.toFixed(2)}</Text>
      <Text className={`w-24 body-bold text-right ${
        item.totalDebt > 0 ? 'text-red-500' : 'text-green-600'
      }`}>
        ${item.totalDebt.toFixed(2)}
      </Text>
      {item.totalDebt > 0 && (
        <TouchableOpacity
          className="ml-2 bg-blue-500 rounded px-2 py-0.5"
          onPress={() => router.push(`/admin/users/${item.userId}/payment`)}
        >
          <Text className="text-white text-xs">Pay</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = useCallback(() => {
    if (loading && summary.length === 0) return null;
    const totalDebt = summary.reduce((s, u) => s + u.totalDebt, 0);
    return (
      <View className="bg-white rounded-xl p-4 mt-2">
        <View className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
          <Text className="h3-bold text-red-800">Debt Summary</Text>
          <Text className="body-regular text-red-700 mt-1">
            • Total outstanding: ${totalDebt.toFixed(2)}
          </Text>
          <Text className="body-regular text-red-700">
            • Users in debt: {summary.filter(u => u.totalDebt > 0).length}
          </Text>
        </View>
      </View>
    );
  }, [summary, loading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && summary.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-lg">Loading analytics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CustomHeader title="Analytics" />
      <FlatList
        data={summary}
        keyExtractor={item => item.userId}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerClassName="pb-4"
      />
    </SafeAreaView>
  );
}