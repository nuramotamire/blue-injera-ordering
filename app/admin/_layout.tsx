// 📄 app/admin/_layout.tsx

import useAuthStore from '@/store/auth.store';
import { Redirect, Stack } from 'expo-router';

export default function AdminLayout() {
  const { role, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated || role !== 'admin') {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor:" #34a9ca" },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="menu" options={{ title: 'Menu Management' }} />
      <Stack.Screen name="menu/edit" options={{ title: 'Edit Item' }} />
      <Stack.Screen name="orders" options={{ title: 'Order Management' }} />
    </Stack>
  );
}