// API endpoints for authentication
import { API_URL } from './config';
import { storeAuthTokens, storeUserEmail, getAccessToken } from './secureStorage';

// Function to send OTP to email
export const sendOTP = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/send-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || 'Failed to send OTP'
      };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
};

// Function to verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || 'Failed to verify OTP'
      };
    }
    
    // If successful, store the tokens and user email
    if (data.tokens) {
      await Promise.all([
        storeAuthTokens(data.tokens),
        storeUserEmail(email)
      ]);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

// Function to set password using the stored token
export const setPassword = async (email, password) => {
  try {
    // Get the stored access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return { 
        success: false, 
        error: 'Authentication token not found. Please verify your email again.'
      };
    }
    
    const response = await fetch(`${API_URL}/api/auth/set-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || 'Failed to set password'
      };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error setting password:', error);
    return { success: false, error: error.message || 'Failed to set password' };
  }
};

// Function to login with email and password
export const loginWithPassword = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || 'Failed to login'
      };
    }
    
    // If successful, store the tokens and user email
    if (data.tokens) {
      await Promise.all([
        storeAuthTokens(data.tokens),
        storeUserEmail(email)
      ]);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: error.message || 'Failed to login' };
  }
}; 