// 📄 signIn.tsx (polished)

import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { sign_In } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import * as Sentry from '@sentry/react-native';
import { Link, router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const passwordRef = useRef<any>(null);

  const submit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      return Alert.alert('Validation Error', 'Please enter both email and password.');
    }

    if (isSubmitting) return; // prevent double-submit
    setIsSubmitting(true);

    try {
      await sign_In({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // ✅ Sync Zustand state
      const { fetchAuthenticatedUser } = useAuthStore.getState();
      await fetchAuthenticatedUser();

      router.replace('/'); // or '/profile'
    } catch (error: any) {
      let message = error.message || 'Failed to sign in. Please try again.';
      
      // User-friendly messages
      if (message.includes('Invalid credentials')) {
        message = 'Incorrect email or password.';
      } else if (message.includes('prohibited')) {
        message = 'Session conflict. Please restart the app or try again later.';
      }

      Alert.alert('Sign In Failed', message);

      // Log to Sentry with context
      Sentry.captureException(error, {
        extra: {
          email: form.email,
          phase: 'sign_in_attempt',
        },
        tags: {
          component: 'SignInScreen',
        },
      });
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
           
          
          </View>

          <View className="gap-4">
            <CustomInput
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <CustomInput
              ref={passwordRef}
              placeholder="Enter your password"
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
            title="Sign In"
            isLoading={isSubmitting}
            onPress={submit}
            disabled={isSubmitting || !form.email || !form.password}
          />

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-gray-600 text-sm">
              Don't have an account?
            </Text>
            <Link href="/sign-up" className="ml-1 text-primary font-semibold text-sm">
              Sign Up
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignIn;