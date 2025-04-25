import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Image } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'
import { loginWithPassword } from '../utils/api'

const EmailScreen = ({ handleContinue, navigation }) => {
  // Get state from context
  const { 
    email, 
    setEmail, 
    currentScreen,
    emailFocused,
    isAuthLoading,
    setIsAuthLoading,
    changeToOtpScreen
  } = useAppContext()
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const inputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const firstRender = useRef(true);

  // Focus input when emailFocused is true and component is visible
  useEffect(() => {
    // This condition ensures input is focused only when emailFocused is true
    // and we're on the email screen, and not on first render
    if (emailFocused && currentScreen === 'email' && inputRef.current && !firstRender.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300); // Small delay to ensure focus happens after animation
    }
    // Mark first render as complete after the first effect run
    firstRender.current = false;
  }, [emailFocused, currentScreen]);

  // Clean up keyboard on unmount
  useEffect(() => {
    return () => {
      Keyboard.dismiss()
    }
  }, [])

  // Focus password input when usePassword is toggled to true
  useEffect(() => {
    if (usePassword && passwordInputRef.current) {
      setTimeout(() => {
        passwordInputRef.current.focus();
      }, 100);
    }
  }, [usePassword]);

  const validateForm = () => {
    let newErrors = {}
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }
    
    // Password validation if usePassword is checked
    if (usePassword && !password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordSubmit = async () => {
    Keyboard.dismiss()
    if (validateForm()) {
      setLoading(true);
      try {
        // Call the login API
        const result = await loginWithPassword(email, password);
        
        if (result.success) {
          // Navigate directly to home screen
          navigation.navigate('Home');
        } else {
          Alert.alert("Login Failed", result.error || "Invalid email or password");
        }
      } catch (error) {
        Alert.alert("Error", error.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
  }

  const onContinue = async () => {
    Keyboard.dismiss()
    if (validateForm()) {
      setLoading(true);
      try {
        if (usePassword) {
          // Use password login flow
          await handlePasswordSubmit();
        } else {
          // Use OTP flow
          const result = await changeToOtpScreen(email);
          
          // If successful, call parent's handleContinue to transition to OTP screen
          if (handleContinue) {
            handleContinue(email);
          }
        }
      } catch (error) {
        Alert.alert("Error", error.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  }

  const handleEmailSubmit = () => {
    if (usePassword && passwordInputRef.current) {
      passwordInputRef.current.focus();
    } else {
      onContinue();
    }
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
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Let's get you started.</Text>
            <Text style={styles.subtitle}>Enter your email to continue.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="example@mail.com"
                placeholderTextColor="#777"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType={usePassword ? "next" : "done"}
                onSubmitEditing={handleEmailSubmit}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {usePassword && (
              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Enter password"
                    placeholderTextColor="#777"
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
                    <Text style={styles.visibilityToggleText}>
                      {passwordVisible ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            )}

            <Pressable
              style={({pressed}) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={onContinue}
              disabled={loading || isAuthLoading}
            >
              {loading || isAuthLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{usePassword ? 'Login' : 'Let\'s Go'}</Text>
              )}
            </Pressable>
            
            <View style={styles.checkboxContainer}>
              <Pressable 
                style={styles.checkbox} 
                onPress={() => setUsePassword(!usePassword)}
              >
                <View style={[styles.checkboxBox, usePassword && styles.checkboxChecked]}>
                  {usePassword && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Login With Password</Text>
              </Pressable>
            </View>

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <Pressable
              style={({pressed}) => [
                styles.googleButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => {
                // Handle Google Sign In
                Alert.alert("Google Sign In", "Google sign in functionality will be implemented here")
              }}
            >
              <Image 
                source={require('../assets/googlelogo.png')} 
                style={styles.googleIcon} 
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This site is protected by reCAPTCHA and the{"\n"}
            Google <Text style={styles.footerLink}>Privacy Policy</Text> and{" "}
            <Text style={styles.footerLink}>Terms of Service</Text> apply.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default EmailScreen

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 56,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60, // Make room for the show/hide button
  },
  visibilityToggle: {
    position: 'absolute',
    right: 16,
    top: 0,
    height: '100%',
    justifyContent: 'center',
  },
  visibilityToggleText: {
    color: '#000',
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
  checkboxContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkboxChecked: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  button: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  orText: {
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
}) 