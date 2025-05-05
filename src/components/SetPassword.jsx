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
  ScrollView 
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'

const SetPassword = ({ onPasswordSaved, onSkip }) => {
  // Get state from context
  const { 
    email,
    currentScreen,
    isAuthLoading,
    savePassword
  } = useAppContext()
  
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const passwordInputRef = useRef(null)
  const firstRender = useRef(true)
  
  // Clean up keyboard on unmount
  useEffect(() => {
    return () => {
      Keyboard.dismiss()
    }
  }, [])

  // Auto-focus the password input field when this is the current screen
  useEffect(() => {
    if (currentScreen === 'password' && !firstRender.current) {
      setTimeout(() => {
        if (passwordInputRef.current) {
          passwordInputRef.current.focus()
        }
      }, 500)
    }
    firstRender.current = false
  }, [currentScreen])

  const validateForm = () => {
    let newErrors = {}
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSavePassword = async () => {
    Keyboard.dismiss()
    
    if (validateForm()) {
      setLoading(true)
      try {
        // Save password using the context method which now calls the API
        const success = await savePassword(password)
        
        if (success) {
          // Call parent component's handler on success
          if (onPasswordSaved) {
            onPasswordSaved()
          }
        }
      } catch (error) {
        Alert.alert("Error", "Failed to save password. Please try again.")
        console.error('Error saving password:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible)
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 30}
      enabled
    >
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={styles.title}>Create Password</Text>
        <Pressable onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Create password"
                  placeholderTextColor="#777"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSavePassword}
                />
                <Pressable 
                  style={styles.visibilityToggle}
                  onPress={togglePasswordVisibility}
                >
                  <Text style={styles.visibilityToggleText}>
                    {passwordVisible ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <Pressable
              style={({pressed}) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleSavePassword}
              disabled={loading || isAuthLoading}
            >
              {loading || isAuthLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default SetPassword

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a66f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    height: 56,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
    paddingRight: 60,
  },
  visibilityToggle: {
    position: 'absolute',
    right: 16,
    top: 0,
    height: '100%',
    justifyContent: 'center',
  },
  visibilityToggleText: {
    color: '#aaaaaa',
    fontSize: 14,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
  button: {
    backgroundColor: '#4a66f5',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#aaaaaa',
    lineHeight: 20,
  },
}); 