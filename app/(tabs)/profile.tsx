// 📄 app/(tabs)/profile.tsx

import { images } from '@/constants';
import { account } from '@/lib/appwrite'; // ✅ Critical import
import useAuthStore from '@/store/auth.store';
import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 🔹 Safe image fallbacks (use only images you know exist)
const getIcon = (key: keyof typeof images) => {
  return images[key] || images.person; // fallback to person
};

export default function Profile() {
  const { user, role, setIsAuthenticated, setUser } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);


const handleLogout = async () => {
  if (isLoggingOut) return;
  setIsLoggingOut(true);

  try {
    // 🔥 The Fix: SDK-managed session deletion
    await account.deleteSession('current');

    // 🧹 Clear app state
    setIsAuthenticated(false);
    setUser(null);
    Sentry.setUser?.(null);

    router.replace('/sign-in');
  } catch (error: any) {
    console.error('Logout error:', error);
    // User-friendly message
    const message = error.code === 401 
      ? 'Already signed out.' 
      : 'Failed to log out. Please try again.';
    Alert.alert('Logout', message);
  } finally {
    setIsLoggingOut(false);
  }
};
  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      {/* User Info */}
      <View className="items-center mb-8">
        <Image
          source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
          className="size-20 rounded-full bg-gray-200"
          resizeMode="cover"
        />
        <Text className="h2-bold text-dark-100 mt-4">
          {user?.name || 'User'}
        </Text>
        <Text className="body-regular text-gray-500">
          {user?.email || 'No email'}
        </Text>
        {role && role !== 'user' && (
          <View className={`mt-2 px-3 py-1 rounded-full ${
            role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            <Text className={`body-medium font-bold uppercase ${
              role === 'admin' ? 'text-blue-800' : 'text-green-800'
            }`}>
              {role}
            </Text>
          </View>
        )}
      </View>

      <View className="gap-3">
        {/* Order History */}
        <ProfileMenuCard
          title="Order History"
          icon={getIcon('bag')}
          onPress={() => router.push('/profile/orders')}
        />

        {/* Loyalty */}
        <ProfileMenuCard
          title="Loyalty Points"
          icon={getIcon('star') || getIcon('person')} // fallback if 'star' missing
          onPress={() => router.push('/profile/loyalty')}
        />

        {/* Admin & Chef — ONLY if authorized */}
        {role === 'admin' && (
          <ProfileMenuCard
            title="Admin Dashboard"
            icon={getIcon('settings') || getIcon('person')}
            onPress={() => router.push('/admin')}
            textColor="text-blue-600"
          />
        )}
        {role === 'chef' && (
          <ProfileMenuCard
            title="Chef Dashboard"
            icon={getIcon('burger') || getIcon('person')}
            onPress={() => router.push('/chef')}
            textColor="text-green-600"
          />
        )}

        {/* Logout */}
        <ProfileMenuCard
          title="Logout"
          icon={getIcon('logout') || getIcon('person')}
          onPress={handleLogout}
          textColor="text-red-500"
          disabled={isLoggingOut}
        />
      </View>
    </SafeAreaView>
  );
}

type ProfileMenuCardProps = {
  title: string;
  icon: any;
  onPress: () => void;
  textColor?: string;
  disabled?: boolean;
};

const ProfileMenuCard = ({ 
  title, 
  icon, 
  onPress, 
  textColor = 'text-dark-100',
  disabled = false,
}: ProfileMenuCardProps) => (
  <TouchableOpacity
    className={`flex-row items-center p-4 bg-gray-50 rounded-xl ${
      disabled ? 'opacity-50' : ''
    }`}
    onPress={onPress}
    disabled={disabled}
  >
    <Image 
      source={icon} 
      className="size-5 mr-3" 
      resizeMode="contain" 
      tintColor={textColor.includes('red') ? '#EF4444' : undefined}
    />
    <Text className={`body-medium flex-1 ${textColor}`}>{title}</Text>
    <Image 
      source={getIcon('arrowRight') || { uri: 'https://via.placeholder.com/16' }} 
      className="size-4" 
      resizeMode="contain" 
    />
  </TouchableOpacity>
);