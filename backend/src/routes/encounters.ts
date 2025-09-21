import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/encounters - Get encounters
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  res.json({
    success: true,
    encounters: [],
    message: 'Encounters endpoint'
  });
}));

export default router; 