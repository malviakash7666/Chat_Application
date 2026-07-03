import axiosClient from './axiosClient';
import { AuthResponse, User } from '../types/auth.types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const authApi = {
  async login(emailOrUsername: string, password?: string): Promise<ApiResponse<AuthResponse>> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/api/users/login', {
      emailOrUsername,
      password
    });
    return response.data;
  },

  async register(username: string, email: string, password?: string): Promise<ApiResponse<AuthResponse>> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/api/users/register', {
      username,
      email,
      password
    });
    return response.data;
  },

  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await axiosClient.get<ApiResponse<User[]>>('/api/users');
    return response.data;
  }
};
