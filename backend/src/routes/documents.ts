import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/documents - Get documents
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  res.json({
    success: true,
    documents: [],
    message: 'Documents endpoint'
  });
}));

export default router; 