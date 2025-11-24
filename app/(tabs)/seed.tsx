// app/seed.tsx
import CustomButton from '@/components/CustomButton'; // ✅ your existing component

import seedData from '@/lib/seed'; // ✅ your updated seeding function
import { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text, View } from 'react-native';

const SeedScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);


 

  const handleSeed = async () => {
    if (isLoading) return;

    Alert.alert(
      '⚠️ Confirm Seeding',
      'This will DELETE all existing data and re-upload grocery items. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Seed!',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setStatus('Clearing data...');
            try {
              await seedData(); // ✅ runs your updated seed()
              setStatus('✅ Seeding complete!');
              Alert.alert('🎉 Success!', 'Grocery data seeded successfully.');
            } catch (error) {
              console.error('Seeding failed:', error);
              setStatus('❌ Failed. Check logs.');
              Alert.alert(
                '❌ Error',
                'Seeding failed. See console for details.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6">
      <View className="flex-1 justify-center items-center">
        <View className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            🌱 Grocery Data Seeder
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Reset and populate Appwrite with fresh grocery items.
          </Text>

          {status && (
            <View className="mb-4 p-3 rounded-lg bg-blue-50">
              <Text className="text-blue-700 font-medium text-center">
                {status}
              </Text>
            </View>
          )}

          <CustomButton
            title={isLoading ? "Seeding..." : "🚀 Seed Grocery Data"}
            onPress={handleSeed}
            isLoading={isLoading}
            style="bg-emerald-600 w-full py-4 rounded-xl"
            textStyle="text-white font-semibold text-lg"
          />

          {isLoading && (
            <View className="mt-4 flex-row items-center">
              <ActivityIndicator size="small" color="#10b981" />
              <Text className="ml-2 text-gray-500">Uploading images...</Text>
            </View>
          )}

          <Text className="mt-6 text-xs text-gray-400 text-center">
            {__DEV__ ? '💡 Dev mode: Safe to use' : '🔒 Production: Admin-only'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SeedScreen;