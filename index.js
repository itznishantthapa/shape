import { registerRootComponent } from 'expo';
import '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';
import App from './App';

// 🔧 Background message handler (MUST be outside any component)
try {
  const messaging = getMessaging();
  
  messaging.setBackgroundMessageHandler(async remoteMessage => {
    console.log('📩 Background message received:', remoteMessage);
  });
} catch (error) {
  console.error('Error setting up background message handler:', error);
}

// 👇 Main app entry
registerRootComponent(App);
