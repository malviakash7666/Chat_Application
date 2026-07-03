import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ navigation, route }: NativeStackHeaderProps) {
  const { user, logout } = useAuth();
  const currentRouteName = route.name;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Optimize spacing on smaller viewports
  const isSmallDevice = screenWidth < 380;
  const showHomeLink = screenWidth > 420; // Only show text "Home" link on wider screens (web/tablet)

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.logoContainer} 
          onPress={() => navigation.navigate(user ? 'ChatList' : 'Home')}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoEmoji, isSmallDevice && styles.smallLogoEmoji]}>💬</Text>
          <Text style={[styles.logoText, isSmallDevice && styles.smallLogoText]}>ChatApp</Text>
        </TouchableOpacity>

        <View style={styles.navLinks}>
          {!user ? (
            <>
              {showHomeLink && (
                <TouchableOpacity
                  style={[styles.linkButton, currentRouteName === 'Home' && styles.activeLinkButton]}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={[styles.linkText, currentRouteName === 'Home' && styles.activeLinkText]}>Home</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.linkButton, 
                  currentRouteName === 'Login' && styles.activeLinkButton,
                  isSmallDevice && styles.smallLinkButton
                ]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[
                  styles.linkText, 
                  currentRouteName === 'Login' && styles.activeLinkText,
                  isSmallDevice && styles.smallLinkText
                ]}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.linkButton, 
                  currentRouteName === 'Register' && styles.activeLinkButton,
                  isSmallDevice && styles.smallLinkButton
                ]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[
                  styles.linkText, 
                  currentRouteName === 'Register' && styles.activeLinkText,
                  isSmallDevice && styles.smallLinkText
                ]}>Register</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {showHomeLink && (
                <TouchableOpacity
                  style={[styles.linkButton, currentRouteName === 'Home' && styles.activeLinkButton]}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={[styles.linkText, currentRouteName === 'Home' && styles.activeLinkText]}>Home</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.linkButton, 
                  (currentRouteName === 'ChatList' || currentRouteName === 'ChatRoom') && styles.activeLinkButton,
                  isSmallDevice && styles.smallLinkButton
                ]}
                onPress={() => navigation.navigate('ChatList')}
              >
                <Text style={[
                  styles.linkText, 
                  (currentRouteName === 'ChatList' || currentRouteName === 'ChatRoom') && styles.activeLinkText,
                  isSmallDevice && styles.smallLinkText
                ]}>Chats</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.linkButton, 
                  currentRouteName === 'Profile' && styles.activeLinkButton,
                  isSmallDevice && styles.smallLinkButton
                ]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={[
                  styles.linkText, 
                  currentRouteName === 'Profile' && styles.activeLinkText,
                  isSmallDevice && styles.smallLinkText
                ]}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.linkButton, 
                  styles.logoutButton,
                  isSmallDevice && styles.smallLinkButton
                ]}
                onPress={handleLogout}
              >
                <Text style={[
                  styles.linkText, 
                  styles.logoutText,
                  isSmallDevice && styles.smallLinkText
                ]}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#075E54',
  },
  container: {
    height: 56,
    backgroundColor: '#075E54',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 22,
    marginRight: 4,
  },
  smallLogoEmoji: {
    fontSize: 18,
  },
  logoText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  smallLogoText: {
    fontSize: 16,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 2,
  },
  smallLinkButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  activeLinkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  smallLinkText: {
    fontSize: 12.5,
  },
  activeLinkText: {
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#054C43',
    marginLeft: 6,
  },
  logoutText: {
    color: '#FFFFFF',
  },
});
