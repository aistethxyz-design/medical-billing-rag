import express from 'express';
import { AIService } from '../services/aiService';
import { logger } from '../utils/logger';

const router = express.Router();
const aiService = new AIService();

// Simple chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    logger.info('Chatbot request received:', { message: message.substring(0, 100) });

    // Initialize AI service if not already done
    if (!aiService.isInitialized) {
      await aiService.initialize();
    }

    // Generate response using the chatbot method
    const response = await aiService.chatbotResponse(message, context);

    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for chatbot
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Chatbot service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
