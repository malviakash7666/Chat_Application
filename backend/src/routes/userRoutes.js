import { Router } from 'express';
import { login, register, refreshToken, getAllUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshToken);
router.get('/', authenticateToken, getAllUsers);

export default router;
