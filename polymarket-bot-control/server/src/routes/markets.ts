import express from 'express';
import marketsController from '../controllers/marketsController';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Middleware di autenticazione per tutte le route dei mercati
router.use(authMiddleware);

// GET /api/markets - Get paginated markets with filtering and sorting
router.get('/', marketsController.getMarkets.bind(marketsController));

// GET /api/markets/top - Get top markets by reward
router.get('/top', marketsController.getTopMarkets.bind(marketsController));

// GET /api/markets/stats - Get markets statistics
router.get('/stats', marketsController.getMarketsStats.bind(marketsController));

export default router;