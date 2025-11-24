// 📄 app/admin/menu.tsx
import CustomButton from '@/components/CustomButton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
        appwriteConfig.menuTableId
      );
      setMenuItems(response.documents as MenuItemDoc[]);
    } catch (e) {
      console.error('Failed to fetch menu:', e);
      Alert.alert('Error', 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const deleteItem = (item: MenuItemDoc) => {
    Alert.alert(
      '⚠️ Delete Item',
      `Delete "${item.name}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuTableId,
                item.$id
              );
              setMenuItems((prev) => prev.filter((i) => i.$id !== item.$id));
            } catch (e) {
              console.error('Delete failed:', e);
              Alert.alert('❌ Error', 'Failed to delete item.');
              fetchMenu();
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: MenuItemDoc }) => {
    const hasImage = item.image_url && item.image_url.trim() !== '';

    return (
      <View className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden">
        <View className="flex-row p-3">
          {/* Image */}
          <View className="w-14 h-14 rounded-lg bg-gray-100 mr-3 overflow-hidden">
            {hasImage ? (
              <Image
                source={{ uri: item.image_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full flex items-center justify-center">
                <Text className="text-gray-400 text-xl">🍲</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 justify-center">
            <Text className="text-sm font-medium text-gray-800">{item.name}</Text>
            <Text className="text-base font-bold text-emerald-600 mt-0.5">
              ${item.price.toFixed(2)}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              📦 {item.stock} •{' '}
              <Text className={item.isAvailable ? 'text-green-600' : 'text-gray-400'}>
                {item.isAvailable ? 'Visible' : 'Hidden'}
              </Text>
            </Text>
          </View>
        </View>

        {/* Compact Edit & Delete — Fixed Width, Minimal */}
        <View className="flex-row justify-end px-3 pb-2.5 gap-2">
          <CustomButton
            title="Edit"
            onPress={() => router.push(`/admin/menu/edit?id=${item.$id}`)}
            style="w-20 py-1.5 bg-blue-600 rounded-lg"
            textStyle="text-white text-xs font-medium text-center"
          />
          <TouchableOpacity
            onPress={() => deleteItem(item)}
            className="w-20 py-1.5 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center"
          >
            <Text className="text-red-500 text-xs font-medium">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Compact Add Button */}
      <View className="px-4 pt-4 pb-3 flex-row justify-between items-center bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">
          Menu ({menuItems.length})
        </Text>
        {/* ✅ Fixed: Add button with clear + icon */}
        <CustomButton
          title="➕"
          onPress={() => router.push('/admin/menu/edit')}
          style="w-10 h-10 rounded-full bg-primary items-center justify-center"
          textStyle="text-white text-lg"
        />
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-sm">Loading menu…</Text>
        </View>
      ) : menuItems.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-4xl mb-3">🍱</Text>
          <Text className="font-medium text-gray-700 mb-1">No items yet</Text>
          <Text className="text-gray-500 text-sm text-center">
            Tap <Text className="font-medium text-primary">➕</Text> to add your first dish
          </Text>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerClassName="p-3 pb-20"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}