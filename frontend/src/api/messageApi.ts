import axiosClient from './axiosClient';
import { ApiResponse } from './authApi';
import { Message } from '../types/message.types';

export interface Conversation {
  user: {
    id: number;
    username: string;
    email?: string;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
    receiverId?: number;
  };
}

export const messageApi = {
  async sendMessage(senderId: number, content: string, receiverId?: number): Promise<ApiResponse<Message>> {
    const response = await axiosClient.post<ApiResponse<Message>>('/api/messages', {
      senderId,
      receiverId,
      content
    });
    return response.data;
  },

  async getMessages(receiverId?: number): Promise<ApiResponse<Message[]>> {
    const response = await axiosClient.get<ApiResponse<Message[]>>('/api/messages', {
      params: receiverId ? { receiverId } : {}
    });
    return response.data;
  },

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await axiosClient.get<ApiResponse<Conversation[]>>('/api/messages/conversations');
    return response.data;
  }
};
