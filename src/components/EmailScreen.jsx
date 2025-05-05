import React, { useState, useEffect, useRef } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  ScrollView, 
  Image,
  Dimensions 
} from 'react-native'
import { useAppContext } from '../../context/AppContext'
import { loginWithPassword } from '../utils/api'
import { handleGoogleSignIn } from '../utils/googleSignIn'
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { MaterialIcons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

const EmailScreen = ({ handleContinue, navigation, onGoBack }) => {
  // Context state
  const { 
    email, 
    setEmail, 
    currentScreen,
    emailFocused,
    isAuthLoading,
    setIsAuthLoading,
    changeToOtpScreen,
    setAuthenticated,
    usePassword,
    setUsePassword,
  } = useAppContext()
  
  // Local state
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  
  // Refs
  const inputRef = useRef(null)
  const passwordInputRef = useRef(null)
  const firstRender = useRef(true)

  // Configure Google Sign-in
  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['email'],
      webClientId: "910710690784-r7iksbeb63oamj5uaocb4qs3va1qpvhc.apps.googleusercontent.com",
    })
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Keyboard.dismiss()
      // Clear email and password when component unmounts
      setEmail('')
      setPassword('')
    }
  }, [])

  // Focus email input on initial render
  useEffect(() => {
    if (emailFocused && currentScreen === 'email' && inputRef.current && !firstRender.current) {
      setTimeout(() => {
        inputRef.current.focus()
      }, 300)
    }
    firstRender.current = false
  }, [emailFocused, currentScreen])

  // Form validation
  const validateForm = () => {
    let newErrors = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (usePassword && !password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handlers
  const handlePasswordSubmit = async () => {
    Keyboard.dismiss()
    if (validateForm()) {
      setLoading(true)
      try {
        const result = await loginWithPassword(email, password)
        
        if (result.success) {
          setAuthenticated(true)
        } else {
          Alert.alert("Login Failed", result.error || "Invalid email or password")
        }
      } catch (error) {
        Alert.alert("Error", error.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
  }

  const onContinue = async () => {
    Keyboard.dismiss()
    if (validateForm()) {
      setLoading(true)
      try {
        if (usePassword) {
          await handlePasswordSubmit()
        } else {
          await changeToOtpScreen(email)
          
          if (handleContinue) {
            handleContinue(email)
          }
        }
      } catch (error) {
        Alert.alert("Error", error.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible)
  }

  const handleEmailSubmit = () => {
    if (usePassword && passwordInputRef.current) {
      passwordInputRef.current.focus()
    } else {
      onContinue()
    }
  }

  // Update back button to dismiss keyboard
  const handleBackPress = () => {
    Keyboard.dismiss()
    // Clear fields
    setEmail('')
    setPassword('')
    onGoBack()
  }

  // UI Components
  const renderEmailInput = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <MaterialIcons name="alternate-email" size={22} color="#727888" style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email address"
          placeholderTextColor="#727888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType={usePassword ? "next" : "done"}
          onSubmitEditing={handleEmailSubmit}
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
    </View>
  )

  const renderPasswordInput = () => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, styles.passwordWrapper]}>
        <MaterialIcons name="lock-outline" size={22} color="#727888" style={styles.inputIcon} />
        <TextInput
          ref={passwordInputRef}
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Enter your password"
          placeholderTextColor="#727888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={onContinue}
        />
        <Pressable 
          style={styles.visibilityToggle}
          onPress={togglePasswordVisibility}
        >
          <MaterialIcons 
            name={passwordVisible ? "visibility" : "visibility-off"} 
            size={22} 
            color="#727888" 
          />
        </Pressable>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
    </View>
  )

  const renderContinueButton = () => (
    <Pressable
      style={({pressed}) => [
        styles.button,
        pressed && styles.buttonPressed
      ]}
      onPress={onContinue}
      disabled={loading || isAuthLoading}
    >
      {loading || isAuthLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Text style={styles.buttonText}>{usePassword ? 'Login' : 'Send OTP'}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
        </>
      )}
    </Pressable>
  )

  // Updated back button
  const renderBackButton = () => (
    <Pressable 
      onPress={handleBackPress} 
      style={styles.backButton}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <MaterialIcons name="arrow-back-ios" size={24} color="#ffffff" />
    </Pressable>
  )

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
          {renderBackButton()}
          <Text style={styles.title}>{usePassword ? 'Sign in' : 'Verify your email'}</Text>
          <Text style={styles.subtitle}>
            {usePassword 
              ? 'Enter your credentials to continue' 
              : 'We\'ll send you a one-time code to verify your identity'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {renderEmailInput()}
          {usePassword && renderPasswordInput()}
          
          {!usePassword && (
            <Pressable 
              style={styles.toggleAuthType}
              onPress={() => setUsePassword(true)}
            >
              <Text style={styles.toggleAuthTypeText}>Login with password instead</Text>
            </Pressable>
          )}
          
          {usePassword && (
            <Pressable 
              style={styles.toggleAuthType}
              onPress={() => setUsePassword(false)}
            >
              <Text style={styles.toggleAuthTypeText}>Use OTP verification instead</Text>
            </Pressable>
          )}
          
          {renderContinueButton()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default EmailScreen

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
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#161529',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#232042',
  },
  passwordWrapper: {
    position: 'relative',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#ffffff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 8,
  },
  visibilityToggle: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
  },
  toggleAuthType: {
    alignSelf: 'flex-start',
    marginBottom: 30,
    paddingVertical: 6,
  },
  toggleAuthTypeText: {
    color: '#a29aff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#232042',
    height: 60,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
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
}) 