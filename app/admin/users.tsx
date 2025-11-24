// 📄 app/admin/users.tsx
import CustomButton from '@/components/CustomButton';
import CustomHeader from '@/components/CustomHeader';
import { images } from '@/constants';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (list: UserDoc[], searchTerm: string, role: string) => {
    let result = list;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );
    }
    if (role !== 'all') {
      result = result.filter((u) => u.role === role);
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
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.$id === user.$id ? { ...u, isAvailable: !u.isAvailable } : u))
      );
      applyFilters(users, search, roleFilter);
    } catch (e) {
      console.error('Availability update failed:', e);
      Alert.alert('Error', 'Failed to update user status.');
      fetchUsers();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      case 'chef':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const renderItem = ({ item }: { item: UserDoc }) => {
    const hasAvatar = item.avatar && item.avatar.trim() !== '';
    const roleColor = getRoleColor(item.role);

    return (
      <View className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden">
        {/* Top: Avatar + Name/Email */}
        <View className="flex-row p-3">
          <View className="w-12 h-12 rounded-full bg-gray-200 mr-3 overflow-hidden">
            {hasAvatar ? (
              <Image
                source={{ uri: item.avatar }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full flex items-center justify-center">
                <Text className="text-gray-500 font-medium">
                  {item.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-sm font-medium text-gray-800">{item.name}</Text>
            <Text className="text-xs text-gray-500">{item.email}</Text>
            {item.phone && (
              <Text className="text-xs text-gray-400 mt-0.5">📱 {item.phone}</Text>
            )}
          </View>

          {/* Role Tag */}
          <View className={`px-2 py-0.5 rounded-full ${roleColor} self-center`}>
            <Text className="text-xs font-medium capitalize">{item.role}</Text>
          </View>
        </View>

        {/* Bottom: Status Toggle + Edit */}
        <View className="flex-row items-center justify-between p-3 bg-gray-50 border-t border-gray-100">
          {/* Status Toggle */}
          <TouchableOpacity
            onPress={() => toggleAvailability(item)}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 ${
              item.isAvailable ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <View
              className={`bg-white w-4 h-4 rounded-full shadow-sm transform ${
                item.isAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </TouchableOpacity>
          <Text className="text-xs text-gray-600 mr-2">
            {item.isAvailable ? 'Active' : 'Inactive'}
          </Text>

          {/* Edit Button */}
          <CustomButton
            title="✏️"
            onPress={() => router.push(`/admin/users/edit?id=${item.$id}`)}
            style="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
            textStyle="text-white text-sm"
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CustomHeader title="Users" />

      {/* Search & Filter */}
      <View className="px-4 pt-2 pb-3 bg-white">
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Image source={images.search} className="w-4 h-4 mr-2" tintColor="#6B7280" />
          <TextInput
            className="flex-1 text-sm"
            placeholder="Search name or email…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text className="text-gray-500 text-sm">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Role Filter — Minimal Segmented */}
        <View className="flex-row bg-gray-100 rounded-lg p-1 mb-3">
          {(['all', 'user', 'chef', 'admin'] as const).map((role) => (
            <TouchableOpacity
              key={role}
              className={`flex-1 py-1.5 rounded-md items-center ${
                roleFilter === role ? 'bg-primary' : 'bg-transparent'
              }`}
              onPress={() => setRoleFilter(role)}
            >
              <Text
                className={`text-xs font-medium ${
                  roleFilter === role ? 'text-white' : 'text-gray-600'
                }`}
              >
                {role === 'all' ? 'All' : role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Floating Add Button (Top-Right) */}
      <View className="absolute top-16 right-4 z-10">
        <CustomButton
          title="➕"
          onPress={() => router.push('/admin/users/edit')}
          style="w-10 h-10 rounded-full bg-primary items-center justify-center shadow"
          textStyle="text-white text-lg"
        />
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading users…</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-4xl mb-3">👥</Text>
          <Text className="font-medium text-gray-700 mb-1">
            {search || roleFilter !== 'all' ? 'No matches' : 'No users yet'}
          </Text>
          <Text className="text-gray-500 text-center text-sm">
            {search || roleFilter !== 'all'
              ? 'Try a different search or filter.'
              : 'Add your first user to get started.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-24"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}