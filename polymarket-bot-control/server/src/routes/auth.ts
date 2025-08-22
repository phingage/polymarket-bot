import express from 'express';
import authController from '../controllers/authController';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', authController.login.bind(authController));

// GET /api/auth/verify - Verify JWT token
router.get('/verify', authController.verify.bind(authController));

// GET /api/auth/profile - Get user profile (protected route)
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

export default router;