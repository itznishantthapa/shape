import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Animated, Dimensions } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'
import { MaterialIcons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

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
      style={styles.mainContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable 
            onPress={handleGoBack} 
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialIcons name="arrow-back-ios" size={24} color="#ffffff" />
          </Pressable>
          
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to
          </Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <View style={styles.formContainer}>
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
              pressed && styles.buttonPressed,
              otp.length !== 6 && styles.buttonDisabled
            ]}
            onPress={handleVerify}
            disabled={loading || isAuthLoading || otp.length !== 6}
          >
            {loading || isAuthLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verify Code</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
              </>
            )}
          </Pressable>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <Pressable 
              onPress={handleResendCode} 
              disabled={!isResendActive}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default OtpScreen

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#1c1835',
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 24,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 8,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a29aff',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    position: 'relative',
  },
  otpBox: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: '#232042',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#161529',
  },
  otpBoxFilled: {
    borderColor: '#a29aff',
    backgroundColor: '#232042',
  },
  otpBoxActive: {
    borderColor: '#a29aff',
    borderWidth: 2,
  },
  otpText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  button: {
    backgroundColor: '#232042',
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  resendButton: {
    color: '#a29aff',
    fontWeight: '600',
    fontSize: 14,
  },
  resendButtonDisabled: {
    color: '#666666',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: '#ffffff',
    top: '50%',
    left: '50%',
    transform: [{ translateY: -12 }],
  },
}) 