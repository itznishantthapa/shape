// Configuration file for environment variables

// API configuration
const DEV_API_URL = 'http://192.168.1.72:8000'; // Tested and valid API endpoint
const PROD_API_URL = 'https://your-production-api-url.com';

// Current environment
const IS_PRODUCTION = false; // Set to true for production builds

// Export environment variables
export const API_URL = IS_PRODUCTION ? PROD_API_URL : DEV_API_URL;

// Other config exports
export const APP_NAME = 'Chat App';
export const APP_VERSION = '1.0.0'; 