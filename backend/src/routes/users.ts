import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/profile - Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { practice: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      npi: true,
      specialty: true,
      practiceId: true,
      practice: {
        select: {
          id: true,
          name: true,
          specialties: true
        }
      },
      createdAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    user
  });
}));

// PUT /api/users/profile - Update user profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { firstName, lastName, specialty, npi } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(specialty && { specialty }),
      ...(npi && { npi })
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      npi: true,
      specialty: true,
      practiceId: true
    }
  });

  logger.info('User profile updated', {
    userId,
    updatedFields: Object.keys(req.body)
  });

  res.json({
    success: true,
    user: updatedUser
  });
}));

// GET /api/users - Get all users (Admin only)
router.get('/', requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      specialty: true,
      practiceId: true,
      practice: {
        select: {
          name: true
        }
      },
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    success: true,
    users
  });
}));

export default router; 