import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import Navbar from '../components/Navbar';

export type AppStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ChatList: undefined;
  ChatRoom: { userId?: number; username: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#075E54' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#FFFFFF' }
          }}
        >
          {user ? (
            <>
              {/* Default screen for authenticated users is ChatList */}
              <Stack.Screen 
                name="ChatList" 
                component={ChatListScreen} 
                options={{
                  header: (props) => <Navbar {...props} />
                }}
              />
              <Stack.Screen 
                name="ChatRoom" 
                component={ChatRoomScreen} 
                options={({ route }) => ({ 
                  title: route.params.username
                })}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{
                  header: (props) => <Navbar {...props} />
                }}
              />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{
                  header: (props) => <Navbar {...props} />
                }}
              />
            </>
          ) : (
            <>
              {/* Default screen for guest users is Home */}
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{
                  header: (props) => <Navbar {...props} />
                }}
              />
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{
                  header: (props) => <Navbar {...props} />
                }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen} 
                options={{
                  header: (props) => <Navbar {...props} />
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
