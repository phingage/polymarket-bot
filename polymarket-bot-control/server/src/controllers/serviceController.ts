import { Request, Response } from 'express';
import { rabbitmqService } from '../services/rabbitmqService';

export const restartPolymarketMM = async (req: Request, res: Response) => {
  try {
    console.log('Restart request received for polymarket-mm');
    
    const success = await rabbitmqService.restartPolymarketMM();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Restart command sent to polymarket-mm successfully',
        timestamp: Date.now()
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send restart command to polymarket-mm' 
      });
    }
  } catch (error) {
    console.error('Error in restartPolymarketMM:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPolymarketMMStatus = async (req: Request, res: Response) => {
  try {
    const status = await rabbitmqService.getServiceStatus();
    
    res.json({
      success: true,
      service: 'polymarket-mm',
      ...status
    });
  } catch (error) {
    console.error('Error in getPolymarketMMStatus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get service status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const sendCommand = async (req: Request, res: Response) => {
  try {
    const { command, data } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }

    console.log(`Sending command to polymarket-mm: ${command}`);
    
    const success = await rabbitmqService.sendCommand(command, data);
    
    if (success) {
      return res.json({ 
        success: true, 
        message: `Command ${command} sent successfully`,
        timestamp: Date.now()
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to send command ${command}` 
      });
    }
  } catch (error) {
    console.error('Error in sendCommand:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};