// 📄 lib/notifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { appwriteConfig, databases } from './appwrite';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push & save token to user doc
export const registerForPushNotifications = async (userId: string) => {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission required', 'Allow notifications to get updates');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'YOUR_EXPO_PROJECT_ID', // ← replace with yours
  })).data;

  // Save token to user doc
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userTableId,
      userId,
      { pushToken: token }
    );
    console.log('✅ Push token saved');
    return token;
  } catch (e) {
    console.error('Failed to save token:', e);
    return null;
  }
};

// Send local notification (no network)
export const sendLocalNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // immediate
  });
};

// Send push via Appwrite Function (backend)
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    const response = await fetch(`${appwriteConfig.endpoint}/functions/notifyUser/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': appwriteConfig.projectId,
        'X-Appwrite-Key': process.env.EXPO_PUBLIC_APPWRITE_API_KEY!, // ← add to .env
      },
      body: JSON.stringify({
        data: {
          userId,
          title,
          body,
          data: data || {},
        },
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log('✅ Push notification triggered');
  } catch (e) {
    console.error('Push notification failed:', e);
    await sendLocalNotification(title, body); // fallback
  }
};