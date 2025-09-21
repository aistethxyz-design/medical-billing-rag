import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { generateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { practice: true }
      });

      if (!user) {
        logger.warn('Login attempt with non-existent email', { email });
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { userId: user.id });
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        practiceId: user.practiceId || undefined
      });

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        practiceId: user.practiceId
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          practiceId: user.practiceId,
          npi: user.npi,
          specialty: user.specialty
        },
        token,
        practice: user.practice ? {
          id: user.practice.id,
          name: user.practice.name,
          specialties: user.practice.specialties
        } : null
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login'
      });
    }
  })
);

// POST /api/auth/register
router.post('/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['PROVIDER', 'PRACTICE_MANAGER', 'CODER', 'BILLER']),
    body('npi').optional().isLength({ min: 10, max: 10 }).withMessage('NPI must be 10 digits'),
    body('specialty').optional().isString()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, role = 'PROVIDER', npi, specialty } = req.body;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role,
          npi,
          specialty
        }
      });

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        practiceId: user.practiceId || undefined
      });

      // Log successful registration
      logger.info('New user registered', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          npi: user.npi,
          specialty: user.specialty
        },
        token
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration'
      });
    }
  })
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Since we're using JWT tokens, logout is handled client-side
  // We just log the action for audit purposes
  const authHeader = req.headers.authorization;
  if (authHeader) {
    logger.info('User logged out', {
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    // This would normally use the auth middleware, but for simplicity:
    res.json({
      success: true,
      message: 'User info endpoint - implement with auth middleware'
    });

  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router; 