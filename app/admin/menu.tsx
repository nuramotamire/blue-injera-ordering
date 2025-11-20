// 📄 app/admin/menu.tsx

import CustomButton from '@/components/CustomButton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { Models } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItemDoc extends Models.Document {
  name: string;
  price: number;
  image_url: string;
  stock: number;
  isAvailable: boolean;
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItemDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.menuTableId,
        [],
        100
      );
      setMenuItems(response.documents as MenuItemDoc[]);
    } catch (e) {
      console.error('Failed to fetch menu:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleAvailability = async (item: MenuItemDoc) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuTableId,
        item.$id,
        { isAvailable: !item.isAvailable }
      );
      fetchMenu(); // refresh
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const deleteItem = async (item: MenuItemDoc) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      // 🔹 Optional: delete image from Storage
      // const fileId = item.image_url.split('/').pop()?.split('?')[0];
      // if (fileId) await storage.deleteFile(appwriteConfig.bucketId, fileId);

      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuTableId,
        item.$id
      );
      fetchMenu();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 flex-row justify-between items-center">
        <Text className="h1-bold">Menu Items ({menuItems.length})</Text>
        <CustomButton
          title="Add Item"
          onPress={() => router.push('/admin/menu/edit')}
          style="px-4 py-2"
        />
      </View>

      {loading ? (
        <Text className="p-5 text-center">Loading...</Text>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.$id}
          contentContainerClassName="p-2 gap-3"
          renderItem={({ item }) => (
            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row">
                <Image
                  source={{ uri: item.image_url }}
                  className="size-16 rounded-lg mr-4"
                />
                <View className="flex-1">
                  <Text className="h3-bold text-dark-100">{item.name}</Text>
                  <Text className="body-medium text-primary">${item.price}</Text>
                  <Text className="body-regular text-gray-600">
                    Stock: {item.stock} • {item.isAvailable ? '✅ Available' : '❌ Disabled'}
                  </Text>
                </View>
              </View>

              <View className="flex-row mt-3 gap-2">
                <CustomButton
                  title={item.isAvailable ? 'Disable' : 'Enable'}
                  onPress={() => toggleAvailability(item)}
                  style={`flex-1 ${item.isAvailable ? 'bg-red-500' : 'bg-green-500'}`}
                />
                <CustomButton
                  title="Edit"
                  onPress={() => router.push(`/admin/menu/edit?id=${item.$id}`)}
                  style="flex-1 bg-blue-500"
                />
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-lg items-center justify-center py-2"
                  onPress={() => deleteItem(item)}
                >
                  <Text className="paragraph-bold text-red-500">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}