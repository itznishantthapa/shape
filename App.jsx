import './gesture-handler'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import SignIn from './src/screen/SignIn'
import Home from './src/screen/Home'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider, useAppContext } from './context/AppContext'
import { getAccessToken, getRefreshToken, storeAuthTokens } from './src/utils/secureStorage'
import TabNavigator from './src/navigation/TabNavigator'
import Inbox from './src/screen/Inbox'
import { API_URL } from './src/utils/config'
import Profile from './src/screen/Profile'


const Stack = createStackNavigator();
const AppContent = () => {
  const {
    authenticated,
    setAuthenticated
  } = useAppContext();

  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const navigationRef = useRef(null);

  // Check for stored authentication tokens on app start


  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const token = await getAccessToken();
        const refreshToken = await getRefreshToken(); // 👈 implement this if not done yet

          if (token) {
            console.log('Access token found');
            setAuthenticated(true)
          } else if (refreshToken) {

            console.log('Refresh token found, attempting to get access token from backend, App.jsx');
            const refreshRes = await fetch(`${API_URL}/get-tokens/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            console.log('Refresh response:', refreshRes);
            if (refreshRes.success) {
              console.log('Refresh token is valid, new access token received');
              const data = await refreshRes.json();
              await storeAuthTokens(data.tokens);
              setAuthenticated(true);
            }
          }

      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();
  }, []);

  console.log('Authenticated Status:', authenticated);


 /** Here we are waiting for the authentication
 check to complete before rendering the app  **/
  if (isCheckingAuth) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#1c1835' }}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'#fff'} />
      <NavigationContainer ref={navigationRef} >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {
            authenticated ? (
              <>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="Inbox" component={Inbox} />
                <Stack.Screen name="Profile" component={Profile} />

              </>
            ) : (
              <Stack.Screen name="SignIn" component={SignIn} />
            )
          }

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <AppProvider >
      <AppContent />
    </AppProvider>
  );
};

export default App;

