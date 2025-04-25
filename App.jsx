import './gesture-handler'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import SignIn from './src/screen/SignIn'
import Home from './src/screen/Home'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider, useAppContext } from './context/AppContext'
import { getAccessToken, getUserEmail } from './src/utils/secureStorage'

const Stack = createStackNavigator();
const AppContent = () => {
  const {
    statusBarTheme,
    setEmail,
    authenticated,
    setAuthenticated
  } = useAppContext();

  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const navigationRef = useRef(null);

  // Check for stored authentication tokens on app start
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if we have an access token
        const token = await getAccessToken();
        const userEmail = await getUserEmail();

        if (token) {
          // If we have a token, user is authenticated
          setAuthenticated(true);

          // Restore email to context if available
          if (userEmail) {
            setEmail(userEmail);
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();
  }, [setAuthenticated, setEmail]);

  // Don't render anything while checking authentication
  if (isCheckingAuth) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'#fff'} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name='SignIn' component={SignIn} />
          <Stack.Screen name='Home' component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;

const styles = StyleSheet.create({});