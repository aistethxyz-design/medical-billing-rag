import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/chatbot/message - Send message to AI chatbot
router.post('/message', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    response: 'Hello! I am your AI medical coding assistant. How can I help you today?',
    message: 'Chatbot endpoint'
  });
}));

export default router; 