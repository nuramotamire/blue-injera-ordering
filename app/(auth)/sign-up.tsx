// 📄 signUp.tsx

import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { createUser } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // 🔹 Simple validation
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const submit = async () => {
    const { name, email, password } = form;

    // 🔹 Validate client-side first
    if (!name.trim()) return Alert.alert('Validation', 'Please enter your name.');
    if (!isValidEmail(email)) return Alert.alert('Validation', 'Please enter a valid email.');
    if (password.length < 6) {
      return Alert.alert('Validation', 'Password must be at least 6 characters.');
    }

    setIsSubmitting(true);

    try {
      await createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // ✅ Hydrate Zustand state
      const { fetchAuthenticatedUser } = useAuthStore.getState();
      await fetchAuthenticatedUser();

      // ✅ Navigate to home tab (not root `/`)
      router.replace('/(tabs)/home'); // or '/profile'
    } catch (error: any) {
      let message = error.message || 'Failed to create account.';

      // 🔹 Map Appwrite errors to user-friendly messages
      if (message.includes('email_already_exists')) {
        message = 'An account with this email already exists.';
      } else if (message.includes('invalid_email')) {
        message = 'Please enter a valid email address.';
      } else if (message.includes('password_short')) {
        message = 'Password must be at least 6 characters.';
      } else if (message.includes('name_long')) {
        message = 'Name is too long.';
      }

      Alert.alert('Sign Up Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center p-5">
        <View className="gap-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Create Account</Text>
            <Text className="text-gray-500 mt-1">
              Sign up to start ordering
            </Text>
          </View>

          <View className="gap-4">
            <CustomInput
              placeholder="Enter your name"
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              label="Name"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />
            <CustomInput
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
            <CustomInput
              placeholder="Create a password"
              value={form.password}
              onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
              label="Password"
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>

          <CustomButton
            title="Sign Up"
            isLoading={isSubmitting}
            onPress={submit}
            disabled={isSubmitting || !form.name || !form.email || !form.password}
          />

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-gray-600 text-sm">
              Already have an account?
            </Text>
            <Link href="/sign-in" className="ml-1 text-primary font-semibold text-sm">
              Sign In
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUp;