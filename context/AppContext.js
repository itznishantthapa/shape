// AppContext.js
import React, { createContext, useContext, useReducer, useState } from 'react';
import { sendOTP, verifyOTP, setPassword as apiSetPassword } from '../src/utils/api';
import { Alert } from 'react-native';
import { clearAuthData } from '../src/utils/secureStorage';
import { userReducer,userInitialState } from './userReducer';

// 1. Create context
const AppContext = createContext();

// 2. Custom hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('Must be used within AppProvider');
  return context;
};

// 4. Provider
export const AppProvider = ({ children }) => {
  // UI theme states
  const [statusBarTheme, setStatusbarTheme] = useState('black');
  const [userState, userDispatch] = useReducer(userReducer, userInitialState);

  
  // Authentication states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [currentScreen, setCurrentScreen] = useState('email');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  // OTP screen states
  const [otpTimer, setOtpTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Navigation and transitions
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Authentication methods
  const clearAuthStates = () => {
    setOtp('');
    setOtpTimer(30);
    setIsResendActive(false);
    setActiveBoxIndex(0);

  };

  const logout = async () => {
    try {
      // Clear all authentication data from secure storage
      await clearAuthData();
      
      // Reset authentication state
      setAuthenticated(false);
      setEmail('');
      setPassword('');
      setCurrentScreen('email');
      userDispatch({ type: 'RESET_USER' });

      
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  };

  const changeToEmailScreen = () => {
    setEmailFocused(true);
    setCurrentScreen('email');
  };

  const changeToOtpScreen = async (emailValue) => {
    setIsAuthLoading(true);
    try {
      // Send OTP to the provided email
      const result = await sendOTP(emailValue);
      
      if (result.success) {
        setEmail(emailValue);
        setCurrentScreen('otp');
        startOtpTimer();
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      console.error('Error sending OTP:', error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const changeToPasswordScreen = () => {
    setCurrentScreen('password');
  };
  
  // Start OTP timer for resend functionality
  const startOtpTimer = () => {
    setOtpTimer(30);
    setIsResendActive(false);
    
    // Clear any existing timer
    if (window.otpTimerInterval) {
      clearInterval(window.otpTimerInterval);
    }
    
    // Set up a new timer
    window.otpTimerInterval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(window.otpTimerInterval);
          setIsResendActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Resend OTP
  const resendOtp = async () => {
    if (!isResendActive) return;
    
    setIsAuthLoading(true);
    try {
      const result = await sendOTP(email);
      
      if (result.success) {
        startOtpTimer();
        Alert.alert('Success', 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      console.error('Error resending OTP:', error);
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  // Verify OTP
  const verifyUserOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP code');
      return { success: false };
    }
    
    setIsAuthLoading(true);
    try {
      const result = await verifyOTP(email, otp);
      console.log("API Response:", result);
    
      if (result.success) {
        setIsOtpVerified(true);
        
        // Only set authenticated if not a new user
        let isNewUserValue = false;
        if (result.data && result.data.isNewUser !== undefined) {
          isNewUserValue = result.data.isNewUser;
          setIsNewUser(isNewUserValue);
          // Only set authenticated if NOT a new user
          if (!isNewUserValue) {
            setAuthenticated(true);
          }
        }
        
        return { success: true, isNewUser: result?.data?.isNewUser};
      } else {
        Alert.alert('Error', result.error || 'Invalid verification code. Please try again.');
        return { success: false };
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      console.error('Error verifying OTP:', error);
      return { success: false };
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Save password
  const savePassword = async (passwordValue) => {
    setIsAuthLoading(true);
    try {
      // Call API to save password
      const result = await apiSetPassword(email, passwordValue);
      
      if (result.success) {
        setPassword(passwordValue);
        setAuthenticated(true);
        setIsAuthLoading(false);
        return true;
      } else {
        Alert.alert('Error', result.error || 'Failed to save password. Please try again.');
        setIsAuthLoading(false);
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save password. Please try again.');
      console.error('Error saving password:', error);
      setIsAuthLoading(false);
      return false;
    }
  };
  
  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (window.otpTimerInterval) {
        clearInterval(window.otpTimerInterval);
      }
    };
  }, []);
  
  return (
    <AppContext.Provider
      value={{
        // UI theme
        statusBarTheme,
        setStatusbarTheme,
        
        // Authentication states
        email,
        setEmail,
        otp,
        setOtp,
        password,
        setPassword,
        currentScreen,
        setCurrentScreen,
        isAuthLoading,
        setIsAuthLoading,
        emailFocused,
        setEmailFocused,
        isOtpVerified,
        setIsOtpVerified,
        isNewUser,
        setIsNewUser,
        authenticated,
        setAuthenticated,
        
        // OTP states
        otpTimer,
        setOtpTimer,
        isResendActive,
        setIsResendActive,
        activeBoxIndex,
        setActiveBoxIndex,
        
        // Navigation/transitions
        isAnimating,
        setIsAnimating,
        
        // Methods
        clearAuthStates,
        changeToEmailScreen,
        changeToOtpScreen,
        changeToPasswordScreen,
        startOtpTimer,
        resendOtp,
        verifyUserOtp,
        savePassword,
        logout,

        //user state
        userState,
        userDispatch,
      }}>
      {children}
    </AppContext.Provider>
  );
};
