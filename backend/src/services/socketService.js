import { Message, User } from '../database/models/index.js';

let io = null;
const activeUsers = new Map(); // Maps socket.id -> { userId, username }

export const initSocket = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Register user when they join
    socket.on('register_user', (userData) => {
      const { userId, username } = userData;
      if (userId && username) {
        activeUsers.set(socket.id, { userId, username });
        console.log(`User registered: ${username} (Socket: ${socket.id})`);
        
        // Broadcast the list of online users to all clients
        io.emit('active_users', Array.from(activeUsers.values()));
      }
    });

    // Handle sending a message via socket
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        if (!senderId || !content) {
          console.error('Invalid message payload received via socket:', data);
          return;
        }

        // Save message to PostgreSQL database
        const message = await Message.create({
          senderId,
          receiverId: receiverId || null,
          content
        });

        // Retrieve message with sender & receiver details
        const messageWithSender = await Message.findByPk(message.id, {
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'email'] },
            { model: User, as: 'receiver', attributes: ['id', 'username', 'email'] }
          ]
        });

        // Broadcast/Emit message
        if (receiverId) {
          emitToUser(senderId, 'receive_message', messageWithSender);
          emitToUser(receiverId, 'receive_message', messageWithSender);
        } else {
          io.emit('receive_message', messageWithSender);
        }
      } catch (error) {
        console.error('Error saving socket message:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { userId, username, receiverId } = data;
      if (receiverId) {
        emitToUser(receiverId, 'typing', { userId, username });
      } else {
        socket.broadcast.emit('typing', data);
      }
    });

    socket.on('stop_typing', (data) => {
      const { userId, receiverId } = data;
      if (receiverId) {
        emitToUser(receiverId, 'stop_typing', { userId });
      } else {
        socket.broadcast.emit('stop_typing', data);
      }
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        console.log(`User disconnected: ${user.username} (Socket: ${socket.id})`);
        activeUsers.delete(socket.id);
        
        // Broadcast the updated list of online users
        io.emit('active_users', Array.from(activeUsers.values()));
      } else {
        console.log(`Socket disconnected: ${socket.id}`);
      }
    });
  });
};

export const getIO = () => io;

// Emit event specifically to user sockets
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  for (const [socketId, user] of activeUsers.entries()) {
    if (user.userId === parseInt(userId)) {
      io.to(socketId).emit(event, payload);
    }
  }
};
