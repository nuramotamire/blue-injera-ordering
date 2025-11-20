// 📄 /home/hope/Desktop/reactNative/client/Blue_Injera/blue_injera_ordering/app/(auth)/_layout.tsx

import { images } from '@/constants';
import useAuthStore from '@/store/auth.store';
import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ Correct import

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // 🔹 Redirect to tabs if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="bg-white h-full" keyboardShouldPersistTaps="handled">
          <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 2.25 }}>
            <ImageBackground source={images.loginGraphic} className="size-full rounded-b-lg" resizeMode="stretch" />
            <Image source={images.logo} className="self-center size-48 absolute -bottom-16 z-10" />
          </View>
          <Slot />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}