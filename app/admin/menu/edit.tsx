// 📄 app/admin/menu/edit.tsx

import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { appwriteConfig, databases, storage } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItemForm {
  name: string;
  price: string;
  description: string;
  stock: string;
  isAvailable: boolean;
  image_url: string;
}

export default function EditMenuItem() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [form, setForm] = useState<MenuItemForm>({
    name: '',
    price: '',
    description: '',
    stock: '10',
    isAvailable: true,
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // 🔹 Fetch existing item if editing
  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        const item = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuTableId,
          id
        );
        setForm({
          name: item.name,
          price: String(item.price),
          description: item.description,
          stock: String(item.stock),
          isAvailable: item.isAvailable,
          image_url: item.image_url,
        });
      } catch (e) {
        Alert.alert('Error', 'Failed to load item');
        router.back();
      }
    };
    fetchItem();
  }, [id]);

  const uploadImage = async (uri: string) => {
    setImageUploading(true);
    try {
      // 🔹 In Expo, use FileSystem to get base64 or blob
      // For simplicity, assume `uri` is a local file URI
      const response = await fetch(uri);
      const blob = await response.blob();

      const file = await storage.createFile(
        appwriteConfig.bucketId,
        ID.unique(),
        blob
      );

      const fileUrl = storage.getFileView(appwriteConfig.bucketId, file.$id);
      return fileUrl;
    } catch (e) {
      console.error('Upload failed:', e);
      Alert.alert('Upload Failed', 'Could not upload image');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    const { name, price, description, stock, isAvailable } = form;
    if (!name || !price || !description) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name,
        price: parseFloat(price),
        description,
        stock: parseInt(stock, 10),
        isAvailable,
        image_url: form.image_url,
      };

      if (id) {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuTableId,
          id,
          data
        );
      } else {
        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuTableId,
          ID.unique(),
          data
        );
      }

      Alert.alert('Success', id ? 'Item updated' : 'Item created');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="p-4">
        <Text className="h1-bold mb-6">{id ? 'Edit Item' : 'Add New Item'}</Text>

        {/* Image Upload (simplified) */}
        <TouchableOpacity
          className="w-32 h-32 bg-gray-200 rounded-xl items-center justify-center mb-4"
          onPress={() => {
            // 🔹 Integrate Expo ImagePicker here
            Alert.alert('Feature', 'Image picker not implemented yet');
          }}
        >
          {form.image_url ? (
            <Image source={{ uri: form.image_url }} className="size-full rounded-xl" />
          ) : (
            <Text className="body-medium text-gray-500">+ Upload Image</Text>
          )}
        </TouchableOpacity>

        <CustomInput
          label="Name"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />
        <CustomInput
          label="Price ($)"
          value={form.price}
          onChangeText={(text) => setForm({ ...form, price: text })}
          keyboardType="numeric"
        />
        <CustomInput
          label="Description"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
        />
        <CustomInput
          label="Stock"
          value={form.stock}
          onChangeText={(text) => setForm({ ...form, stock: text })}
          keyboardType="numeric"
        />

        <View className="flex-row items-center mt-2">
          <View
            className={`w-5 h-5 rounded-full border mr-3 ${
              form.isAvailable ? 'bg-primary border-primary' : 'border-gray-400'
            }`}
          />
          <TouchableOpacity onPress={() => setForm({ ...form, isAvailable: !form.isAvailable })}>
            <Text className="body-medium">
              {form.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title={id ? 'Update Item' : 'Create Item'}
          onPress={handleSubmit}
          isLoading={loading || imageUploading}
          style="mt-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
}