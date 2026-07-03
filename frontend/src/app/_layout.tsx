process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
