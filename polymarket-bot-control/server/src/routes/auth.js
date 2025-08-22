const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', authController.login.bind(authController));

// GET /api/auth/verify - Verify JWT token
router.get('/verify', authController.verify.bind(authController));

// GET /api/auth/profile - Get user profile (protected route)
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

module.exports = router;