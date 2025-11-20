// 📄 app/admin/users/edit.tsx
import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserForm {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'chef' | 'admin';
  isAvailable: boolean;
}

export default function EditUser() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [form, setForm] = useState<UserForm>({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    isAvailable: true,
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing user
  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const user = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userTableId,
          id
        );
        setForm({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isAvailable: user.isAvailable ?? true, // fallback if missing
        });
      } catch (e) {
        console.error('Fetch user failed:', e);
        Alert.alert('Error', 'User not found');
        router.back();
      }
    };
    fetchUser();
  }, [id]);

  const handleSubmit = async () => {
    const { name, email, phone, role, isAvailable } = form;
    if (!name || !email) {
      Alert.alert('Validation', 'Name and email are required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name,
        email,
        phone: phone || undefined, // omit if empty
        role,
        isAvailable,
      };

      if (id) {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userTableId,
          id,
          data
        );
        Alert.alert('Success', 'User updated');
      } else {
        // 🔹 Create new user in DB only (auth account created separately during sign-up)
        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userTableId,
          ID.unique(),
          data
        );
        Alert.alert('Success', 'User created (DB only)');
      }

      router.back();
    } catch (e: any) {
      console.error('Save failed:', e);
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="p-4">
        <Text className="h1-bold mb-6">{id ? 'Edit User' : 'Add New User'}</Text>

        <CustomInput
          label="Full Name"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />
        <CustomInput
          label="Email"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
          keyboardType="email-address"
        />
        <CustomInput
          label="Phone (Optional)"
          value={form.phone}
          onChangeText={(text) => setForm({ ...form, phone: text })}
          keyboardType="phone-pad"
        />

        {/* Role Selector */}
        <Text className="body-medium text-gray-700 mb-2 mt-2">Role</Text>
        <View className="flex-row gap-2 mb-4">
          {(['user', 'chef', 'admin'] as const).map(role => (
            <TouchableOpacity
              key={role}
              className={`px-4 py-2 rounded-lg ${
                form.role === role 
                  ? 'bg-primary border border-primary' 
                  : 'bg-gray-100'
              }`}
              onPress={() => setForm({ ...form, role })}
            >
              <Text className={`body-medium ${form.role === role ? 'text-white' : 'text-gray-700'}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Availability Toggle */}
        <View className="flex-row items-center mt-2">
          <View
            className={`w-5 h-5 rounded-full border mr-3 ${
              form.isAvailable ? 'bg-primary border-primary' : 'border-gray-400'
            }`}
          />
          <TouchableOpacity onPress={() => setForm({ ...form, isAvailable: !form.isAvailable })}>
            <Text className="body-medium">
              {form.isAvailable ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title={id ? 'Update User' : 'Create User'}
          onPress={handleSubmit}
          isLoading={loading}
          style="mt-6"
        />

        {/* Note */}
        <Text className="text-xs text-gray-500 mt-4">
          💡 This creates/updates the user in the database only.
          Authentication accounts are created during sign-up.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}