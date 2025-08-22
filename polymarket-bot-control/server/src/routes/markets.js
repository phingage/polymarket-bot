const express = require('express');
const marketsController = require('../controllers/marketsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware di autenticazione per tutte le route dei mercati
router.use(authMiddleware);

// GET /api/markets - Get paginated markets with filtering and sorting
router.get('/', marketsController.getMarkets.bind(marketsController));

// GET /api/markets/top - Get top markets by reward
router.get('/top', marketsController.getTopMarkets.bind(marketsController));

// GET /api/markets/stats - Get markets statistics
router.get('/stats', marketsController.getMarketsStats.bind(marketsController));

module.exports = router;