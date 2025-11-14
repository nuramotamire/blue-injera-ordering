import useAuthStore from '@/store/auth.store';
import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from 'react';
import './globals.css';

Sentry.init({
  dsn: 'https://11c26b5b72c6d3724a16c1244baec685@o4510362441416704.ingest.us.sentry.io/4510362481590272',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  
  const {isLoading, fetchAuthenticatedUser}= useAuthStore();

  const [fontsLoaded , error] = useFonts({
     "Quicksand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
     "Quicksand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
     "Quicksand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
     "Quicksand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
  });

  
  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  useEffect(()=>{
      fetchAuthenticatedUser()
  }, [])

  if(!fontsLoaded || isLoading) return null;

  return <Stack screenOptions={{headerShown:false}}/>
});