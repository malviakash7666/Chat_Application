import Constants from 'expo-constants';

// Retrieve configuration variables from Expo's manifest/extra config
const extra = 
  Constants.expoConfig?.extra || 
  (Constants.manifest as any)?.extra || 
  (Constants.manifest2 as any)?.extra || 
  {};

// Fallback to the production backend URL if not defined in the environment
const BASE_URL = extra.apiUrl || 'https://chat-application-3izs.onrender.com';

export const config = {
  BASE_URL,
  SOCKET_URL: BASE_URL
};
