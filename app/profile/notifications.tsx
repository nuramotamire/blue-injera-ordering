// 📄 app/profile/notifications.tsx

import CustomHeader from '@/components/CustomHeader';
import { appwriteConfig, databases, markNotificationAsRead } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import { Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!user?.$id) return;
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      'notifications',
      [Query.equal('userId', user.$id), Query.orderDesc('createdAt')],
      50
    );
    setNotifications(response.documents);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user?.$id]);

  const handleRead = async (id: string) => {
    await markNotificationAsRead(id);
    fetchNotifications(); // refresh
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CustomHeader title="Notifications" />
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.$id}
        contentContainerClassName="p-3 gap-3"
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-10">No notifications</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`p-4 rounded-xl ${
              item.isRead ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
            }`}
            onPress={() => !item.isRead && handleRead(item.$id)}
          >
            <Text className="h3-bold">{item.title}</Text>
            <Text className="body-medium text-gray-600 mt-1">{item.body}</Text>
            <Text className="body-regular text-gray-400 mt-2">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}