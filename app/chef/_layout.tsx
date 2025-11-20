// 📄 app/chef/_layout.tsx

import useAuthStore from '@/store/auth.store';
import { Redirect, Stack } from 'expo-router';

export default function ChefLayout() {
  const { role, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated || role !== 'chef') {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#10B981' }, // green theme
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Chef Dashboard' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order Detail', headerBackTitle: 'Back' }} />
    </Stack>
  );
}