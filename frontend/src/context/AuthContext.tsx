import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, AuthState } from '../types/auth.types';
import { storage } from '../utils/storage';
import { authApi } from '../api/authApi';
import socketService from '../services/socket';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (emailOrUsername: string, password?: string) => Promise<void>;
  register: (username: string, email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true
  });

  useEffect(() => {
    restoreToken();
  }, []);

  const restoreToken = async () => {
    try {
      const accessToken = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();
      const user = await storage.getUser();

      if (accessToken && refreshToken && user) {
        setState({ user, accessToken, refreshToken, loading: false });
        socketService.connect(user.id, user.username);
      } else {
        setState({ user: null, accessToken: null, refreshToken: null, loading: false });
      }
    } catch (e) {
      console.error('Failed to restore token session:', e);
      setState({ user: null, accessToken: null, refreshToken: null, loading: false });
    }
  };

  const login = async (emailOrUsername: string, password?: string) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await authApi.login(emailOrUsername, password);
      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        await storage.setTokens(accessToken, refreshToken);
        await storage.setUser(user);
        
        setState({ user, accessToken, refreshToken, loading: false });
        socketService.connect(user.id, user.username);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const register = async (username: string, email: string, password?: string) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await authApi.register(username, email, password);
      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        await storage.setTokens(accessToken, refreshToken);
        await storage.setUser(user);
        
        setState({ user, accessToken, refreshToken, loading: false });
        socketService.connect(user.id, user.username);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await storage.clearTokens();
      await storage.clearUser();
      socketService.disconnect();
      setState({ user: null, accessToken: null, refreshToken: null, loading: false });
    } catch (e) {
      console.error('Failed to log out:', e);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        loading: state.loading,
        login,
        register,
        logout,
        restoreToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
