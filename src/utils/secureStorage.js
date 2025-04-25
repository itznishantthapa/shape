import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// Key constants
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_EMAIL_KEY = 'user_email';

/**
 * Store access token securely
 * @param {string} token - The access token to store
 */
export const storeAccessToken = async (token) => {
  try {
    await Keychain.setGenericPassword(
      ACCESS_TOKEN_KEY,
      token,
      { service: ACCESS_TOKEN_KEY }
    );
    return true;
  } catch (error) {
    console.error('Error storing access token:', error);
    return false;
  }
};

/**
 * Get the stored access token
 * @returns {Promise<string|null>} The stored access token or null
 */
export const getAccessToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_KEY });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Store refresh token securely
 * @param {string} token - The refresh token to store
 */
export const storeRefreshToken = async (token) => {
  try {
    await Keychain.setGenericPassword(
      REFRESH_TOKEN_KEY,
      token,
      { service: REFRESH_TOKEN_KEY }
    );
    return true;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    return false;
  }
};

/**
 * Get the stored refresh token
 * @returns {Promise<string|null>} The stored refresh token or null
 */
export const getRefreshToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Store authentication tokens
 * @param {Object} tokens - Object containing access and refresh tokens
 */
export const storeAuthTokens = async (tokens) => {
  try {
    const { access, refresh } = tokens;
    const accessResult = await storeAccessToken(access);
    const refreshResult = await storeRefreshToken(refresh);
    return accessResult && refreshResult;
  } catch (error) {
    console.error('Error storing auth tokens:', error);
    return false;
  }
};

/**
 * Store user email in AsyncStorage
 * @param {string} email - The user's email
 */
export const storeUserEmail = async (email) => {
  try {
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
    return true;
  } catch (error) {
    console.error('Error storing user email:', error);
    return false;
  }
};

/**
 * Get the stored user email
 * @returns {Promise<string|null>} The stored user email or null
 */
export const getUserEmail = async () => {
  try {
    return await AsyncStorage.getItem(USER_EMAIL_KEY);
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async () => {
  try {
    await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
    await AsyncStorage.removeItem(USER_EMAIL_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
}; 