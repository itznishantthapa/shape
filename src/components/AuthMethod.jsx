import { StyleSheet, Text, View, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'
import { handleGoogleSignIn } from '../utils/googleSignIn'
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence, 
  withDelay,
  withSpring
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

const AuthMethod = ({ navigation }) => {
  const { 
    setUsePassword,
    setCurrentScreen,
    animateTransition
  } = useAppContext()

  const [loading, setLoading] = useState({
    otp: false,
    google: false,
    email: false
  })

  // Animated text setup
  const underscoreOpacity = useSharedValue(1)
  
  // Animation values for each letter of "Shape"
  const letterValues = {
    s: { opacity: useSharedValue(0), y: useSharedValue(20) },
    h: { opacity: useSharedValue(0), y: useSharedValue(20) },
    a: { opacity: useSharedValue(0), y: useSharedValue(20) },
    p: { opacity: useSharedValue(0), y: useSharedValue(20) },
    e: { opacity: useSharedValue(0), y: useSharedValue(20) },
  }
  
  // Animation for underscore and Shape letters
  useEffect(() => {
    // Blinking underscore animation
    underscoreOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    )

    // Animate each letter with a slight delay between them
    const letters = ['s', 'h', 'a', 'p', 'e']
    
    letters.forEach((letter, index) => {
      // Initial animation when component mounts
      letterValues[letter].opacity.value = withDelay(
        index * 150,
        withTiming(1, { duration: 500 })
      )
      
      letterValues[letter].y.value = withDelay(
        index * 150,
        withSpring(0, { damping: 8 })
      )
      
      // Set up continuous subtle animation
      setTimeout(() => {
        letterValues[letter].y.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1000 }),
            withTiming(2, { duration: 1000 })
          ),
          -1,
          true
        )
      }, 1500 + index * 150)
    })
  }, [])

  const animatedUnderscoreStyle = useAnimatedStyle(() => {
    return {
      opacity: underscoreOpacity.value
    }
  })

  // Create animated styles for each letter
  const letterStyles = {
    s: useAnimatedStyle(() => ({
      opacity: letterValues.s.opacity.value,
      transform: [{ translateY: letterValues.s.y.value }]
    })),
    h: useAnimatedStyle(() => ({
      opacity: letterValues.h.opacity.value,
      transform: [{ translateY: letterValues.h.y.value }]
    })),
    a: useAnimatedStyle(() => ({
      opacity: letterValues.a.opacity.value,
      transform: [{ translateY: letterValues.a.y.value }]
    })),
    p: useAnimatedStyle(() => ({
      opacity: letterValues.p.opacity.value,
      transform: [{ translateY: letterValues.p.y.value }]
    })),
    e: useAnimatedStyle(() => ({
      opacity: letterValues.e.opacity.value,
      transform: [{ translateY: letterValues.e.y.value }]
    })),
  }

  const handleOtpAuth = () => {
    setLoading(prev => ({ ...prev, otp: true }))
    setUsePassword(false)
    animateTransition('email')
    setLoading(prev => ({ ...prev, otp: false }))
  }

  const handleGoogleAuth = async () => {
    setLoading(prev => ({ ...prev, google: true }))
    try {
      await handleGoogleSignIn()
    } catch (error) {
      console.error('Google sign in error:', error)
    } finally {
      setLoading(prev => ({ ...prev, google: false }))
    }
  }

  const handleEmailPasswordAuth = () => {
    setLoading(prev => ({ ...prev, email: true }))
    setUsePassword(true)
    animateTransition('email')
    setLoading(prev => ({ ...prev, email: false }))
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={{alignItems:'center',justifyContent:'center',flexDirection:'row',gap:15}}>
              <Image 
                source={require('../assets/shape.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <View >
                <View style={{flexDirection: 'row'}}>
                  <Animated.Text style={[styles.letterText, letterStyles.s]}>S</Animated.Text>
                  <Animated.Text style={[styles.letterText, letterStyles.h]}>h</Animated.Text>
                  <Animated.Text style={[styles.letterText, letterStyles.a]}>a</Animated.Text>
                  <Animated.Text style={[styles.letterText, letterStyles.p]}>p</Animated.Text>
                  <Animated.Text style={[styles.letterText, letterStyles.e]}>e</Animated.Text>
                </View>
                <View style={styles.animatedTextContainer}>
                  <Text style={styles.animatedText}>Let's elevate hardwork</Text>
                  <Animated.Text style={[styles.underscore, animatedUnderscoreStyle]}>_</Animated.Text>
                </View>
              </View>
            </View>
          </View>

          {/* Auth Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={({pressed}) => [
                styles.button,
                styles.otpButton,
                pressed && styles.buttonPressed,
                loading.otp && styles.buttonDisabled
              ]}
              onPress={handleOtpAuth}
              disabled={loading.otp}
            >
              {loading.otp ? (
                <ActivityIndicator size="small" color="#ffffff" style={styles.activityIndicator} />
              ) : (
                <MaterialIcons name="password" size={24} color="white" style={styles.buttonIcon} />
              )}
              <Text style={styles.buttonText}>Continue with OTP</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.button,
                styles.googleButton,
                pressed && styles.buttonPressed,
                loading.google && styles.buttonDisabled
              ]}
              onPress={handleGoogleAuth}
              disabled={loading.google}
            >
              {loading.google ? (
                <ActivityIndicator size="small" color="#ffffff" style={styles.activityIndicator} />
              ) : (
                <FontAwesome name="google" size={24} color="white" style={styles.buttonIcon} />
              )}
              <Text style={styles.buttonText}>Continue with Google</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.button,
                styles.emailButton,
                pressed && styles.buttonPressed,
                loading.email && styles.buttonDisabled
              ]}
              onPress={handleEmailPasswordAuth}
              disabled={loading.email}
            >
              {loading.email ? (
                <ActivityIndicator size="small" color="#ffffff" style={styles.activityIndicator} />
              ) : (
                <MaterialIcons name="alternate-email" size={24} color="white" style={styles.buttonIcon} />
              )}
              <Text style={styles.buttonText}>Login with Email</Text>
            </Pressable>
          </View>
          <View style={styles.footer}>
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#a29aff" />
            </View>
            <Text style={styles.footerText}>
              This site is protected by reCAPTCHA and the{"\n"}
              Google <Text style={styles.footerLink}>Privacy Policy</Text> and{" "}
              <Text style={styles.footerLink}>Terms of Service</Text> apply.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AuthMethod

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#1c1835',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1c1835',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    height: height * 0.9,
    justifyContent: 'center',
    paddingVertical: 40,
    gap:30
  },
  logoContainer: {
    alignItems: 'center',
    // marginBottom: 20,
    // marginTop: 30,
  },
  logo: {
    width: 100,
    height: 100,
    // marginBottom: 20,
  },
  animatedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    
    // marginTop: 20,
  },
  animatedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  underscore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: '#161529',
  },
  otpButton: {
    backgroundColor: '#232042',
  },
  googleButton: {
    backgroundColor: '#232042',
  },
  emailButton: {
    backgroundColor: '#232042',
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f5f5',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  securityIcon: {
    marginTop: -8,
  },
  footerText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#a29aff',
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  activityIndicator: {
    marginRight: 16,
  },
  letterText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
  },
})