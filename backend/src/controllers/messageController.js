import { Message, User } from '../database/models/index.js';
import { getIO, emitToUser } from '../services/socketService.js';
import { Op } from 'sequelize';

export const createMessage = async (req, res, next) => {
  try {
    const { senderId, receiverId, content } = req.body;
    if (!senderId || !content) {
      return res.status(400).json({
        success: false,
        message: 'senderId and content are required'
      });
    }

    // Verify sender exists
    const senderUser = await User.findByPk(senderId);
    if (!senderUser) {
      return res.status(404).json({
        success: false,
        message: 'Sender User not found'
      });
    }

    // Verify receiver exists if provided
    if (receiverId) {
      const receiverUser = await User.findByPk(receiverId);
      if (!receiverUser) {
        return res.status(404).json({
          success: false,
          message: 'Receiver User not found'
        });
      }
    }

    const message = await Message.create({
      senderId,
      receiverId: receiverId || null,
      content
    });

    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'email'] }
      ]
    });

    // Send through Socket.io
    const io = getIO();
    if (io) {
      if (receiverId) {
        emitToUser(senderId, 'receive_message', messageWithSender);
        emitToUser(receiverId, 'receive_message', messageWithSender);
      } else {
        io.emit('receive_message', messageWithSender);
      }
    }

    return res.status(201).json({
      success: true,
      data: messageWithSender,
      message: 'Message sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMessages = async (req, res, next) => {
  try {
    const { receiverId } = req.query;
    const currentUserId = req.user.id;

    let whereClause = { receiverId: null }; // Default to general group chat

    if (receiverId) {
      whereClause = {
        [Op.or]: [
          { senderId: currentUserId, receiverId: receiverId },
          { senderId: receiverId, receiverId: currentUserId }
        ]
      };
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'email'] }
      ]
    });

    return res.status(200).json({
      success: true,
      data: messages,
      message: 'Messages retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Find all messages involving the current user
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'email'] }
      ]
    });

    // Group messages by conversation partner
    const conversationsMap = new Map();
    messages.forEach((msg) => {
      // Determine the partner (the other user)
      const partner = msg.senderId === currentUserId ? msg.receiver : msg.sender;
      if (!partner) return; // Skip if partner is not found

      if (!conversationsMap.has(partner.id)) {
        conversationsMap.set(partner.id, {
          user: partner,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            receiverId: msg.receiverId
          }
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    return res.status(200).json({
      success: true,
      data: conversations,
      message: 'Conversations retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};
