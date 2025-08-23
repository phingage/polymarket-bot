import express from 'express';
import authenticateToken from '../middleware/auth';
import { restartPolymarketMM, stopPolymarketMM, getPolymarketMMStatus, sendCommand } from '../controllers/serviceController';

const router = express.Router();

// Get polymarket-mm service status
router.get('/polymarket-mm/status', authenticateToken, getPolymarketMMStatus);

// Restart polymarket-mm service
router.post('/polymarket-mm/restart', authenticateToken, restartPolymarketMM);

// Stop polymarket-mm service
router.post('/polymarket-mm/stop', authenticateToken, stopPolymarketMM);

// Send custom command to polymarket-mm
router.post('/polymarket-mm/command', authenticateToken, sendCommand);

export default router;