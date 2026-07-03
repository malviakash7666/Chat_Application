import { io, Socket } from 'socket.io-client';
import { config } from '../constants/config';
import { Message } from '../types/message.types';

let socket: Socket | null = null;

export const socketService = {
  connect(userId: number, username: string): Socket {
    if (socket) {
      if (socket.connected) return socket;
      socket.connect();
      return socket;
    }

    socket = io(config.SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    socket.on('connect', () => {
      console.log('Socket.io connected:', socket?.id);
      socket?.emit('register_user', { userId, username });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('Socket.io connection closed');
    }
  },

  sendMessage(senderId: number, receiverId: number | undefined, content: string): void {
    socket?.emit('send_message', { senderId, receiverId, content });
  },

  emitTyping(userId: number, username: string, receiverId?: number): void {
    socket?.emit('typing', { userId, username, receiverId });
  },

  emitStopTyping(userId: number, receiverId?: number): void {
    socket?.emit('stop_typing', { userId, receiverId });
  },

  onReceiveMessage(callback: (message: Message) => void): () => void {
    socket?.on('receive_message', callback);
    return () => {
      socket?.off('receive_message', callback);
    };
  },

  onTyping(callback: (data: { userId: number; username: string }) => void): () => void {
    socket?.on('typing', callback);
    return () => {
      socket?.off('typing', callback);
    };
  },

  onStopTyping(callback: (data: { userId: number }) => void): () => void {
    socket?.on('stop_typing', callback);
    return () => {
      socket?.off('stop_typing', callback);
    };
  },

  onActiveUsers(callback: (users: Array<{ userId: number; username: string }>) => void): () => void {
    socket?.on('active_users', callback);
    
    // Listen for potential compatibility fallback events
    socket?.on('user_online', (data: any) => {
      console.log('User online event:', data);
    });
    socket?.on('user_offline', (data: any) => {
      console.log('User offline event:', data);
    });

    return () => {
      socket?.off('active_users', callback);
      socket?.off('user_online');
      socket?.off('user_offline');
    };
  }
};

export default socketService;
