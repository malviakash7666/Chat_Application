import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { height: screenHeight } = useWindowDimensions();

  // Responsive design scaling based on screen height
  const isSmallScreen = screenHeight < 760;

  const heroPadding = isSmallScreen ? 30 : 50;
  const logoSize = isSmallScreen ? 74 : 100;
  const logoEmojiSize = isSmallScreen ? 38 : 50;
  const titleFontSize = isSmallScreen ? 22 : 28;
  const subtitleFontSize = isSmallScreen ? 13 : 15;
  const subtitleMarginBottom = isSmallScreen ? 18 : 32;
  const ctaPaddingVertical = isSmallScreen ? 11 : 14;
  const featureSectionPaddingTop = isSmallScreen ? 24 : 40;
  const featureCardPadding = isSmallScreen ? 14 : 20;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { paddingVertical: heroPadding }]}>
        <Animated.View 
          entering={ZoomIn.delay(200).duration(800)} 
          style={[styles.logoContainer, { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }]}
        >
          <Image 
            source={require('../../assets/images/app_logo.png')} 
            style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }} 
          />
        </Animated.View>
        
        <Animated.Text 
          entering={FadeInUp.delay(400).duration(600)} 
          style={[styles.heroTitle, { fontSize: titleFontSize }]}
        >
          Welcome to ChatApp
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeInUp.delay(600).duration(600)} 
          style={[styles.heroSubtitle, { fontSize: subtitleFontSize, marginBottom: subtitleMarginBottom }]}
        >
          Connect with friends and colleagues instantly. Fast, secure, and beautiful private messaging between all members.
        </Animated.Text>

        {/* CTA Buttons */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.ctaContainer}>
          {!user ? (
            <>
              <TouchableOpacity 
                style={[styles.primaryButton, { paddingVertical: ctaPaddingVertical }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.primaryButtonText}>Get Started / Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, { paddingVertical: ctaPaddingVertical }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.secondaryButtonText}>Create New Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.primaryButton, { paddingVertical: ctaPaddingVertical }]}
                onPress={() => navigation.navigate('ChatList')}
              >
                <Text style={styles.primaryButtonText}>Open Conversations</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, { paddingVertical: ctaPaddingVertical }]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.secondaryButtonText}>View My Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>

      {/* Feature Cards Section */}
      <Animated.View 
        entering={FadeIn.delay(1000).duration(800)} 
        style={[styles.featuresSection, { paddingTop: featureSectionPaddingTop }]}
      >
        <Text style={styles.featuresTitle}>App Features</Text>
        
        <View style={styles.featuresGrid}>
          <View style={[styles.featureCard, { padding: featureCardPadding }]}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureCardTitle}>Real-time Chats</Text>
            <Text style={styles.featureCardDesc}>
              Experience lightning fast messaging powered by Socket.io with typing indicators and online statuses.
            </Text>
          </View>

          <View style={[styles.featureCard, { padding: featureCardPadding }]}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureCardTitle}>Secure Auth</Text>
            <Text style={styles.featureCardDesc}>
              Accounts are secured using industry-standard password hashing (bcrypt) and JSON Web Tokens (JWT).
            </Text>
          </View>

          <View style={[styles.featureCard, { padding: featureCardPadding }]}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureCardTitle}>All Members DMs</Text>
            <Text style={styles.featureCardDesc}>
              Message any registered member directly. Simply search for their name and start chatting instantly.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 ChatApp. Built with Expo & React Native.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#075E54',
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoContainer: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroLogo: {
    // Dynamically set in render
  },
  heroTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#E0F2F1',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  ctaContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  featuresSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresGrid: {
    width: '100%',
    maxWidth: 600,
    gap: 14,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 4,
  },
  featureCardDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#999999',
  },
});
