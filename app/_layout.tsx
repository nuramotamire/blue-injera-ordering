// 📄 app/_layout.tsx

import useAuthStore from '@/store/auth.store';
import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import './globals.css';

Sentry.init({
  dsn: 'https://11c26b5b72c6d3724a16c1244baec685@o4510362441416704.ingest.us.sentry.io/4510362481590272',
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true, // needed for user context
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
    Sentry.breadcrumbsIntegration({
      console: true,
    }),
  ],
});

// ✅ CORRECT: Use `addEventProcessor`, not `addGlobalEventProcessor`
Sentry.addEventProcessor((event) => {
  // 🔒 Scrub sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['Cookie'];
    // Optional: Mask IP
    if (event.user) {
      event.user.ip_address = '0.0.0.0';
    }
  }
  return event;
});

export default function RootLayout() {
  const { isLoading, fetchAuthenticatedUser } = useAuthStore();
  const [fontsLoaded, fontError] = useFonts({
    'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
    'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
    'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
  });

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FE8C00" />
      </View>
    );
  }

  return <Slot />;
}