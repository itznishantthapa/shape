import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
} from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === 1 || // Authorized
        authStatus === 2;   // Provisional

      if (!enabled) {
        Alert.alert('Permission denied for notifications');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const setupNotificationListeners = async () => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Foreground message handler
    const unsubscribeOnMessage = onMessage(messaging, async remoteMessage => {
      console.log('Received foreground message:', remoteMessage);
      if (remoteMessage?.notification) {
        const { title, body } = remoteMessage.notification;
        console.log('Notification Title:', title || 'No Title');
        console.log('Notification Body:', body || 'No Body');
      }
    });

    // Background notification opened handler
    const unsubscribeOnNotificationOpened = onNotificationOpenedApp(messaging, remoteMessage => {
      console.log('Notification caused app to open from background:', remoteMessage);
      if (remoteMessage?.notification) {
        // Handle navigation or any other logic here
        console.log('Background notification:', remoteMessage.notification);
      }
    });

    // Check if app was opened from a quit state
    const initialNotification = await getInitialNotification(messaging);
    if (initialNotification) {
      console.log('App opened from quit state:', initialNotification);
      // Handle navigation or any other logic here
    }

    // Return cleanup function
    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpened();
    };
  } catch (error) {
    console.error('Error setting up notification listeners:', error);
  }
};
