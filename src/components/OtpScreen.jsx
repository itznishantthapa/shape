import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'

const OtpScreen = ({ onVerificationComplete, onGoBack }) => {
  // Get state from context
  const { 
    email,
    otp, 
    setOtp,
    currentScreen,
    isAuthLoading,
    setIsAuthLoading,
    otpTimer,
    setOtpTimer,
    isResendActive,
    setIsResendActive,
    activeBoxIndex,
    setActiveBoxIndex,
    resendOtp,
    verifyUserOtp,
    isNewUser
  } = useAppContext()
  
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const firstRender = useRef(true)
  const cursorAnim = useRef(new Animated.Value(0)).current
  
  // Cursor blinking animation
  useEffect(() => {
    const startBlinkAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    startBlinkAnimation();
    
    return () => {
      cursorAnim.stopAnimation();
    };
  }, []);

  // Clean up keyboard on unmount
  useEffect(() => {
    return () => {
      Keyboard.dismiss()
    }
  }, [])

  // Auto-focus the OTP input field only when this is the current screen
  useEffect(() => {
    if (currentScreen === 'otp') {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 500)
    }
  }, [currentScreen])

  // Reset OTP when navigating to this screen
  useEffect(() => {
    if (currentScreen === 'otp') {
      // When entering OTP screen
      setActiveBoxIndex(0);
    }
  }, [currentScreen, setActiveBoxIndex])

  // Update active box based on OTP length
  useEffect(() => {
    setActiveBoxIndex(Math.min(otp.length, 5));
  }, [otp, setActiveBoxIndex])

  // Start and manage timer for OTP resend
  useEffect(() => {
    let interval
    
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prevTimer => prevTimer - 1)
      }, 1000)
    } else {
      setIsResendActive(true)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpTimer, setOtpTimer, setIsResendActive])

  const handleOtpChange = (value) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, '')
    if (numericValue.length <= 6) {
      setOtp(numericValue)
    }
  }

  const handleResendCode = async () => {
    if (isResendActive) {
      try {
        // Use the resendOtp function from context
        await resendOtp();
      } catch (error) {
        Alert.alert("Error", "Failed to resend verification code. Please try again.");
      }
    }
  }

  const handleVerify = async () => {
    try {
      setLoading(true);
      // Use the verifyUserOtp function from context
      const result = await verifyUserOtp();
      
      if (result.success) {
        console.log("OtpScreen received isNewUser value:", result.isNewUser);
        
        // Always call onVerificationComplete after successful verification
        // Pass the isNewUser value directly to ensure we have latest value
        onVerificationComplete(result.isNewUser);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoBack = () => {
    // Reset all OTP-related states when going back to email screen
    setOtpTimer(30);
    setIsResendActive(false);
    
    // Call the parent component's onGoBack function first
    // This will set emailFocused to true in the SignIn component
    onGoBack();
    
    // Reset OTP after transition starts to avoid visual glitches
    setTimeout(() => {
      setOtp('');
    }, 100);
  };

  const renderOtpBoxes = () => {
    const boxes = []
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            otp[i] ? styles.otpBoxFilled : null,
            i === activeBoxIndex && !otp[i] ? styles.otpBoxActive : null
          ]}
        >
          <Text style={styles.otpText}>{otp[i] || ''}</Text>
          {i === activeBoxIndex && !otp[i] && (
            <Animated.View 
              style={[
                styles.cursor,
                { opacity: cursorAnim }
              ]} 
            />
          )}
        </View>
      )
    }
    return boxes
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 30}
      enabled
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {renderOtpBoxes()}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="default"
              maxLength={6}
              autoFocus={false}
            />
          </View>

          <Pressable
            style={({pressed}) => [
              styles.button,
              pressed && styles.buttonPressed
            ]}
            onPress={handleVerify}
            disabled={loading || isAuthLoading}
          >
            {loading || isAuthLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <Pressable onPress={handleResendCode} disabled={!isResendActive}>
              <Text 
                style={[
                  styles.resendButton, 
                  !isResendActive && styles.resendButtonDisabled
                ]}
              >
                {isResendActive ? "Resend" : `Resend in ${otpTimer}s`}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Change Email</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default OtpScreen

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 40,
    textAlign: 'center',
  },
  emailText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    position: 'relative',
  },
  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpBoxFilled: {
    borderColor: '#000',
    backgroundColor: '#f8f8f8',
  },
  otpBoxActive: {
    borderColor: '#000',
    borderWidth: 2,
  },
  otpText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  button: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
  },
  resendButton: {
    color: '#000',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#999',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#000',
    textDecorationLine: 'underline',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: '#000',
    opacity: 0.7,
    top: '50%',
    left: '50%',
    transform: [{ translateY: -12 }],
  },
}) 