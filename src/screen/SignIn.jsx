import { StyleSheet, Text, View, Animated } from 'react-native'
import React, { useRef, useEffect, useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import { SafeAreaView } from 'react-native-safe-area-context'
import EmailScreen from '../components/EmailScreen'
import OtpScreen from '../components/OtpScreen'
import SetPassword from '../components/SetPassword'

const SignIn = ({navigation}) => {
  const { 
    currentScreen, 
    setCurrentScreen,
    isAnimating,
    setIsAnimating,
    email,
    emailFocused,
    setEmailFocused,
    setStatusbarTheme,
    isNewUser,
    setAuthenticated
  } = useAppContext()
  
  // References to screens for smoother transitions
  const emailScreenOpacity = useRef(new Animated.Value(1)).current
  const otpScreenOpacity = useRef(new Animated.Value(0)).current
  const passwordScreenOpacity = useRef(new Animated.Value(0)).current

  // Animate between screens
  const animateTransition = useCallback((toScreen) => {
    // Prevent multiple animations running at once
    if (isAnimating) return
    setIsAnimating(true)

    // Determine which screens to animate
    let screenFadingIn, screenFadingOut
    
    if (toScreen === 'email') {
      screenFadingIn = emailScreenOpacity
      screenFadingOut = currentScreen === 'otp' ? otpScreenOpacity : passwordScreenOpacity
    } else if (toScreen === 'otp') {
      screenFadingIn = otpScreenOpacity
      screenFadingOut = currentScreen === 'email' ? emailScreenOpacity : passwordScreenOpacity
    } else if (toScreen === 'password') {
      screenFadingIn = passwordScreenOpacity
      screenFadingOut = currentScreen === 'otp' ? otpScreenOpacity : emailScreenOpacity
    }
    
    // First fade out current screen
    Animated.timing(screenFadingOut, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Then switch screens internally (no flicker)
      setCurrentScreen(toScreen)
      
      // Finally fade in the new screen
      Animated.timing(screenFadingIn, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false)
      })
    })
  }, [isAnimating, setCurrentScreen, setIsAnimating, currentScreen])

  const handleContinue = useCallback((emailValue) => {
    // Using context's changeToOtpScreen method would be simpler,
    // but we need the animation logic, so we'll handle it here
    animateTransition('otp')
    
  }, [animateTransition])

  const handleVerificationComplete = useCallback((isNewUser) => {
    console.log('talking from the signin screen and handling the verification complete--------------------------------------------------------------------->',isNewUser);
    // If user is new, show password screen, otherwise navigate to Home
    if (isNewUser) {
      console.log('here in the password screen')
      animateTransition('password');
    } else {
      console.log('here in the mainttabs')
      // navigation.navigate('MainTabs');
    }
  }, [animateTransition, isNewUser, navigation])

  const handleGoBack = useCallback(() => {
    setEmailFocused(true)
    animateTransition('email')
  }, [animateTransition, setEmailFocused])

  const handleSkip = useCallback(() => {
    setAuthenticated(true);
  }, [setAuthenticated])

  const handlePasswordSaved = useCallback(() => {
    setAuthenticated(true);
  }, [setAuthenticated])

  // Render all screens at all times, but control their visibility
  // This prevents the flickering during transitions
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screensContainer}>
        <Animated.View
          style={[
            styles.screenContainer,
            styles.absolutePosition,
            { 
              opacity: emailScreenOpacity,
              zIndex: currentScreen === 'email' ? 3 : 1,
            }
          ]}
        >
          <EmailScreen 
            handleContinue={handleContinue}
            navigation={navigation}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.screenContainer,
            styles.absolutePosition,
            { 
              opacity: otpScreenOpacity,
              zIndex: currentScreen === 'otp' ? 3 : 1,
            }
          ]}
        >
          <OtpScreen
            onVerificationComplete={handleVerificationComplete}
            onGoBack={handleGoBack}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.screenContainer,
            styles.absolutePosition,
            { 
              opacity: passwordScreenOpacity,
              zIndex: currentScreen === 'password' ? 3 : 1,
            }
          ]}
        >
          <SetPassword
            onPasswordSaved={handlePasswordSaved}
            onSkip={handleSkip}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

export default SignIn

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screensContainer: {
    flex: 1,
    position: 'relative',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  absolutePosition: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
})