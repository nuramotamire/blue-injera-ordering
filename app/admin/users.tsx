// 📄 app/admin/users.tsx
import CustomButton from '@/components/CustomButton';
import CustomHeader from '@/components/CustomHeader';
import { images } from '@/constants';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

// Extend with runtime fields (from staff.tsx)
interface UserDoc extends Models.Document {
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin' | 'chef';
  isAvailable: boolean;
  phone?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'chef' | 'admin'>('all');

  const fetchUsers = async () => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        [Query.orderDesc('$createdAt')],
        100
      );
      const docs = response.documents as UserDoc[];
      setUsers(docs);
      applyFilters(docs, search, roleFilter);
    } catch (e) {
      console.error('Fetch users failed:', e);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (list: UserDoc[], searchTerm: string, role: string) => {
    let result = list;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
    }
    if (role !== 'all') {
      result = result.filter(u => u.role === role);
    }
    setFilteredUsers(result);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, search, roleFilter);
  }, [search, roleFilter, users]);

  const toggleAvailability = async (user: UserDoc) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userTableId,
        user.$id,
        { isAvailable: !user.isAvailable }
      );
      fetchUsers(); // refresh
    } catch (e) {
      console.error('Availability update failed:', e);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      user: 'bg-gray-100 text-gray-800',
      chef: 'bg-green-100 text-green-800',
      admin: 'bg-blue-100 text-blue-800',
    };
    return (
      <View className={`px-2 py-1 rounded-full ${styles[role] || 'bg-gray-100'}`}>
        <Text className="body-medium capitalize">{role}</Text>
      </View>
    );
  };

  const getStatusBadge = (isAvailable: boolean) => (
    <View className={`px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
      <Text className="body-medium text-gray-800">{isAvailable ? 'Active' : 'Inactive'}</Text>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CustomHeader title="User Management" />

      <View className="p-4">
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Image source={images.search} className="size-5 mr-2" tintColor="#6B7280" />
          <TextInput
            className="flex-1 body-medium"
            placeholder="Search by name or email"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Role Filter */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'user', 'chef', 'admin'] as const).map(role => (
            <TouchableOpacity
              key={role}
              className={`px-3 py-1.5 rounded-full ${
                roleFilter === role 
                  ? 'bg-primary border border-primary' 
                  : 'bg-gray-100'
              }`}
              onPress={() => setRoleFilter(role)}
            >
              <Text className={`body-medium ${roleFilter === role ? 'text-white' : 'text-gray-700'}`}>
                {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create Button */}
        <CustomButton
          title="➕ Add User"
          onPress={() => router.push('/admin/users/edit')}
          style="mb-4"
        />
      </View>

      {loading ? (
        <Text className="p-5 text-center">Loading users...</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.$id}
          contentContainerClassName="p-2 gap-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border border-gray-200 rounded-xl p-4">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="h3-bold">{item.name}</Text>
                  <Text className="body-medium text-gray-500">{item.email}</Text>
                  {item.phone && (
                    <Text className="body-regular text-gray-400">{item.phone}</Text>
                  )}
                </View>
                <View className="flex-row gap-2">
                  {getRoleBadge(item.role)}
                  {getStatusBadge(item.isAvailable)}
                </View>
              </View>

              <View className="flex-row mt-3 gap-2">
                <CustomButton
                  title="Edit"
                  onPress={() => router.push(`/admin/users/edit?id=${item.$id}`)}
                  style="flex-1 bg-blue-500"
                />
                <CustomButton
                  title={item.isAvailable ? 'Disable' : 'Enable'}
                  onPress={() => toggleAvailability(item)}
                  style={`flex-1 ${item.isAvailable ? 'bg-red-500' : 'bg-green-500'}`}
                />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}