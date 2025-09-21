import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const prisma = new PrismaClient();

// Type definitions for roles
type UserRole = 'ADMIN' | 'PROVIDER' | 'CODER' | 'BILLER';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    practiceId?: string;
  };
}

// JWT configuration
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'aisteth-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Fixed value to avoid type issues

// Rate limiting for authentication attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: '7d', // Using fixed value
    issuer: 'aisteth',
    audience: 'aisteth-users'
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'aisteth',
      audience: 'aisteth-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Authentication middleware
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token
    const decoded = verifyToken(token);
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        practiceId: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      practiceId: user.practiceId || undefined
    };

    // Log the authenticated request
    logger.info('User authenticated', {
      userId: user.id,
      email: user.email,
      route: req.path,
      method: req.method,
      ip: req.ip
    });

    next();
  } catch (error: any) {
    logger.error('Authentication error', {
      error: error.message,
      route: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(401).json({
      error: 'Access denied. Invalid token.',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        route: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Practice-based authorization middleware
export const requirePracticeAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin users have access to all practices
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const practiceId = req.params.practiceId || req.body.practiceId || req.query.practiceId;
    
    if (!practiceId) {
      return res.status(400).json({
        error: 'Practice ID is required',
        code: 'PRACTICE_ID_REQUIRED'
      });
    }

    // Check if user belongs to the practice
    if (req.user.practiceId !== practiceId) {
      logger.warn('Unauthorized practice access attempt', {
        userId: req.user.id,
        userPracticeId: req.user.practiceId,
        requestedPracticeId: practiceId,
        route: req.path
      });

      return res.status(403).json({
        error: 'Access denied. You do not have access to this practice.',
        code: 'PRACTICE_ACCESS_DENIED'
      });
    }

    next();
  } catch (error: any) {
    logger.error('Practice authorization error', {
      error: error.message,
      userId: req.user?.id,
      route: req.path
    });

    return res.status(500).json({
      error: 'Internal server error during authorization',
      code: 'AUTH_ERROR'
    });
  }
};

// Rate limiting by user
export const userRateLimit = new Map<string, { count: number; resetTime: number }>();

export function rateLimitByUser(maxRequests: number = 100, windowMs: number = 900000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const now = Date.now();
    const userLimit = userRateLimit.get(req.user.id);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize rate limit
      userRateLimit.set(req.user.id, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        userId: req.user.id,
        count: userLimit.count,
        maxRequests
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this user'
      });
      return;
    }

    userLimit.count++;
    next();
  };
} 