import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { fileLogin, fileRegister, fileGetUser, fileGoogleLogin, isFileAuthEnabled } from '../services/fileAuthService';
import { verifyGoogleIdToken, isGoogleAuthConfigured } from '../services/googleAuthService';

const router = express.Router();

// POST /api/auth/google — Sign in with Google ID token
router.post('/google',
  [body('credential').notEmpty().withMessage('Google credential is required')],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({ error: 'Google sign-in is not configured on the server' });
    }

    const { credential } = req.body;

    try {
      const profile = await verifyGoogleIdToken(credential);
      if (!profile.emailVerified) {
        return res.status(401).json({ error: 'Google account email is not verified' });
      }

      if (isFileAuthEnabled()) {
        const result = await fileGoogleLogin(profile);
        logger.info('User logged in (Google / file auth)', { email: result.user.email });
        return res.json({ success: true, ...result });
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      let user = await prisma.user.findUnique({
        where: { email: profile.email },
        include: { practice: true },
      });

      if (!user) {
        const randomPassword = await bcrypt.hash(`google-oauth-${profile.googleId}`, 12);
        user = await prisma.user.create({
          data: {
            email: profile.email,
            password: randomPassword,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: 'PROVIDER',
            specialty: 'Ontario',
          },
          include: { practice: true },
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role as 'PROVIDER',
        practiceId: user.practiceId || undefined,
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          practiceId: user.practiceId,
          npi: user.npi,
          specialty: user.specialty,
          picture: profile.picture,
        },
        practice: user.practice
          ? { id: user.practice.id, name: user.practice.name, specialties: JSON.parse(user.practice.specialties || '[]') }
          : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google token verification failed';
      logger.error('Google auth error:', { message, error });
      return res.status(401).json({ error: message.includes('audience') ? 'Google Client ID mismatch — check GOOGLE_CLIENT_ID in backend/.env' : 'Google sign-in failed. Try again.' });
    }
  })
);

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

    // Local file auth (works without Prisma — default in development)
    if (isFileAuthEnabled()) {
      const result = await fileLogin(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      logger.info('User logged in (file auth)', { email: result.user.email });
      return res.json({ success: true, ...result });
    }

    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { practice: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        practiceId: user.practiceId || undefined
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
      res.status(500).json({ error: 'Internal server error during login' });
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

    if (isFileAuthEnabled()) {
      const result = await fileRegister({ email, password, firstName, lastName, role, npi, specialty });
      if ('error' in result) {
        return res.status(409).json({ error: result.error });
      }
      return res.status(201).json({ success: true, ...result });
    }

    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

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

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        practiceId: user.practiceId || undefined
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
      res.status(500).json({ error: 'Internal server error during registration' });
    }
  })
);

router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    logger.info('User logged out', { timestamp: new Date().toISOString() });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Public config for the login page (client ID is not a secret)
router.get('/config', (_req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  res.json({
    success: true,
    googleClientId,
    googleConfigured: Boolean(googleClientId),
    fileAuth: isFileAuthEnabled(),
  });
});

router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (isFileAuthEnabled()) {
    const result = fileGetUser(req.user!.id);
    if (result) {
      return res.json({ success: true, ...result });
    }
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { practice: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

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
      specialty: user.specialty,
    },
    practice: user.practice
      ? {
          id: user.practice.id,
          name: user.practice.name,
          specialties: JSON.parse(user.practice.specialties || '[]'),
        }
      : null,
  });
}));

export default router;
