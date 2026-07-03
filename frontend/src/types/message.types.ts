import { User } from './auth.types';

export interface Message {
  id: number;
  senderId: number;
  receiverId?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}

export interface SendMessagePayload {
  senderId: number;
  receiverId?: number;
  content: string;
}
