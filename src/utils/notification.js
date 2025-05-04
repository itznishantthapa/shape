import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

export async function requestUserPermission() {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        // Alert.alert('Permission denied for notifications');
        return null;
      }
    }

    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      // Alert.alert('Permission denied for notifications');
      return null;
    }

    await registerDeviceForRemoteMessages(messaging);
    const fcmToken = await getToken(messaging);
    console.log('FCM Token:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('Error in requestUserPermission:', error);
    return null;
  }
}
