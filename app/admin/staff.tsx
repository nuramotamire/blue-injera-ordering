// 📄 app/admin/staff.tsx

import CustomButton from '@/components/CustomButton';
import CustomHeader from '@/components/CustomHeader';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserDoc extends Models.Document {
  name: string;
  email: string;
  role: 'user' | 'chef' | 'admin';
  isAvailable: boolean;
}

export default function StaffManagement() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        [Query.orderDesc('createdAt')],
        100
      );
      setUsers(response.documents as UserDoc[]);
    } catch (e) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        userId,
        { role: newRole }
      );
      fetchUsers(); // refresh
    } catch (e) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const toggleAvailability = async (user: UserDoc) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        user.$id,
        { isAvailable: !user.isAvailable }
      );
      fetchUsers();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getRoleBadge = (role: string) => {
    const style = {
      user: 'bg-gray-100 text-gray-800',
      chef: 'bg-green-100 text-green-800',
      admin: 'bg-blue-100 text-blue-800',
    }[role] || 'bg-gray-100';
    return (
      <View className={`px-2 py-1 rounded-full ${style}`}>
        <Text className="body-medium">{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CustomHeader title="Staff Management" />
      
      {loading ? (
        <Text className="p-5 text-center">Loading staff...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.$id}
          contentContainerClassName="p-3 gap-3"
          renderItem={({ item }) => (
            <View className="border border-gray-200 rounded-xl p-4">
              <View className="flex-row justify-between">
                <View>
                  <Text className="h3-bold">{item.name}</Text>
                  <Text className="body-medium text-gray-500">{item.email}</Text>
                </View>
                {getRoleBadge(item.role)}
              </View>

              <View className="flex-row mt-3 gap-2">
                {['user', 'chef', 'admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    className={`px-3 py-1 rounded-lg ${
                      item.role === role ? 'bg-primary/20 border border-primary' : 'bg-gray-100'
                    }`}
                    onPress={() => updateRole(item.$id, role)}
                  >
                    <Text className="body-medium">
                      {role === 'chef' ? 'Chef' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}

                <CustomButton
                  title={item.isAvailable ? 'Disable' : 'Enable'}
                  onPress={() => toggleAvailability(item)}
                  style={`px-3 py-1 ${item.isAvailable ? 'bg-red-500' : 'bg-green-500'}`}
                  textStyle="text-white"
                />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}