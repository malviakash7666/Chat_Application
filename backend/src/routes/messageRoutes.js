import { Router } from 'express';
import { createMessage, getAllMessages, getConversations } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, createMessage);
router.get('/', authenticateToken, getAllMessages);
router.get('/conversations', authenticateToken, getConversations);

export default router;
