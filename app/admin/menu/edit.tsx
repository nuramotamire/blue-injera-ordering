// 📄 app/admin/menu/edit.tsx
import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { appwriteConfig, databases, storage } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
        Alert.alert('Error', 'Failed to load menu item');
        router.back();
      }
    };
    fetchItem();
  }, [id]);

  // 🔹 Handle image selection (stub — ready for expo-image-picker)
  const handleImagePress = async () => {
    // 👇 Uncomment & integrate when ready
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [1, 1],
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   const uri = result.assets[0].uri;
    //   const uploadedUrl = await uploadImage(uri);
    //   if (uploadedUrl) {
    //     setForm({ ...form, image_url: uploadedUrl });
    //   }
    // }

    Alert.alert(
      '📸 Image Upload',
      'Image picker integration is ready — implement with expo-image-picker when needed.'
    );
  };

  const uploadImage = async (uri: string) => {
    setImageUploading(true);
    try {
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

    if (!name.trim() || !price.trim() || !description.trim()) {
      Alert.alert('Validation', 'Name, price, and description are required.');
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Validation', 'Price must be a positive number.');
      return;
    }

    if (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      Alert.alert('Validation', 'Stock must be a non-negative number.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim(),
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

      Alert.alert('✅ Success', id ? 'Menu item updated!' : 'New item added!');
      router.back();
    } catch (e: any) {
      Alert.alert('❌ Error', e.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="p-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-8 h-8 mb-2 items-center justify-center"
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800">
              {id ? '✏️ Edit Menu Item' : '➕ Add New Item'}
            </Text>
          </View>

          {/* Image Section */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Item Image</Text>
            <TouchableOpacity
              onPress={handleImagePress}
              disabled={imageUploading}
              className={`w-full h-48 rounded-xl border-2 border-dashed ${
                imageUploading
                  ? 'border-blue-300 bg-blue-50'
                  : form.image_url
                  ? 'border-transparent'
                  : 'border-gray-300 bg-gray-100'
              } flex items-center justify-center overflow-hidden`}
            >
              {imageUploading ? (
                <Text className="text-blue-600 font-medium">Uploading…</Text>
              ) : form.image_url ? (
                <Image
                  source={{ uri: form.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <Text className="text-gray-500 text-lg">📷</Text>
                  </View>
                  <Text className="text-gray-500 text-center px-2">
                    Tap to upload photo (1:1 recommended)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            <CustomInput
              label="📌 Name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="e.g. Spicy Lamb Tibs"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <CustomInput
                  label="💰 Price ($)"
                  value={form.price}
                  onChangeText={(text) =>
                    setForm({ ...form, price: text.replace(/[^0-9.]/g, '') })
                  }
                  keyboardType="decimal-pad"
                  placeholder="9.99"
                />
              </View>
              <View className="flex-1">
                <CustomInput
                  label="🔢 Stock"
                  value={form.stock}
                  onChangeText={(text) =>
                    setForm({ ...form, stock: text.replace(/[^0-9]/g, '') })
                  }
                  keyboardType="number-pad"
                  placeholder="10"
                />
              </View>
            </View>

            <CustomInput
              label="📝 Description"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Delicious slow-cooked lamb with berbere spice…"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="h-24 pt-3"
            />

            {/* Availability Toggle */}
            <View className="pt-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
              <TouchableOpacity
                onPress={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                className={`flex-row items-center p-4 rounded-xl ${
                  form.isAvailable ? 'bg-green-50 border border-green-200' : 'bg-gray-100'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full mr-3 border ${
                    form.isAvailable
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-400'
                  }`}
                />
                <View>
                  <Text
                    className={`font-medium ${
                      form.isAvailable ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    {form.isAvailable ? '✅ In Stock & Available' : '⏸️ Temporarily Unavailable'}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {form.isAvailable
                      ? 'Visible to customers'
                      : 'Hidden from menu until re-enabled'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <CustomButton
            title={id ? '💾 Save Changes' : '✅ Add Item'}
            onPress={handleSubmit}
            isLoading={loading || imageUploading}
            disabled={loading || imageUploading}
            className="mt-8 py-4"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}