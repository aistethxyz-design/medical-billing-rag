import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'redis';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import practiceRoutes from './routes/practices';
import encounterRoutes from './routes/encounters';
import documentRoutes from './routes/documents';
import codingRoutes from './routes/coding';
import analyticsRoutes from './routes/analytics';
import chatbotRoutes from './routes/chatbot';
import billingRoutes from './routes/billing';

// Import middleware
import { authenticate } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { errorHandler } from './middleware/errorHandler';

// Import services
import { initializeAI } from './services/aiService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize database and redis
const prisma = new PrismaClient();
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002', 
    'http://localhost:3003',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for AI features
  message: {
    error: 'AI analysis rate limit exceeded. Please wait before making more requests.',
  },
});

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/coding/analyze', aiLimiter);
app.use('/api/chatbot', aiLimiter);
app.use('/api/billing/analyze', aiLimiter);

// Audit logging middleware (HIPAA compliance)
app.use('/api/', auditMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        ai: 'available'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service dependency failure'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/practices', authenticate, practiceRoutes);
app.use('/api/encounters', authenticate, encounterRoutes);
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/coding', authenticate, codingRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/chatbot', authenticate, chatbotRoutes);
app.use('/api/billing', authenticate, billingRoutes);

// Serve Frontend App (Protected Dashboard)
app.use('/app', express.static(path.join(__dirname, '../../frontend/dist')));
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Serve Public Landing Page (Root)
app.use(express.static(path.join(__dirname, '../../landing/dist')));
app.get('*', (req, res) => {
  // Check if request is for API
  if (req.path.startsWith('/api')) {
    // Let 404 handler handle API 404s
    return res.status(404).json({
      error: 'Endpoint not found',
      message: 'The requested resource does not exist'
    });
  }
  // Otherwise serve landing page
  res.sendFile(path.join(__dirname, '../../landing/dist/index.html'));
});

// Medical Coding AI Features Demo Endpoint
app.get('/api/demo/features', (req, res) => {
  res.json({
    features: {
      documentProcessing: {
        supportedFormats: ['PDF', 'DOCX', 'TXT', 'EHR_EXPORT'],
        ocrCapabilities: ['Tesseract.js', 'AWS Textract'],
        aiParsing: 'GPT-4 powered medical text analysis'
      },
      medicalCoding: {
        codeTypes: ['CPT', 'ICD-10', 'HCPCS', 'Modifiers'],
        validationRules: ['CMS/NCCI edits', 'Specialty-specific rules'],
        optimization: 'AI-powered revenue optimization suggestions'
      },
      billingOptimization: {
        undercoding: 'Detects missed opportunities',
        overcoding: 'Flags audit risks',
        bundling: 'NCCI bundling rule validation',
        modifiers: 'Appropriate modifier suggestions'
      },
      aiAssistant: {
        chatbot: 'Natural language coding questions',
        explanations: 'AMA/CMS guideline references',
        riskAssessment: 'Audit probability scoring'
      },
      compliance: {
        hipaa: 'Full HIPAA compliance with encryption',
        auditLogs: 'Comprehensive audit trail',
        deidentification: 'Automatic PHI removal',
        retention: 'Configurable data retention policies'
      },
      analytics: {
        revenueTracking: 'Revenue optimization metrics',
        usagePatterns: 'Code usage analytics',
        riskScoring: 'Compliance risk assessment',
        benchmarking: 'Specialty-specific comparisons'
      }
    },
    exampleWorkflow: {
      step1: 'Upload encounter documents (PDF/DOCX/TXT)',
      step2: 'AI extracts clinical data and suggests codes',
      step3: 'System validates against NCCI/CMS rules',
      step4: 'Optimization suggestions with revenue impact',
      step5: 'Provider reviews and approves changes',
      step6: 'Export optimized codes to billing system'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested resource does not exist'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await prisma.$disconnect();
    await redis.disconnect();
    logger.info('Database and Redis connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('Connected to Redis');
    
    // Initialize AI services
    await initializeAI();
    logger.info('AI services initialized');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🏥 CodeMax AI Backend Server running on port ${PORT}`);
      logger.info(`📊 Medical Coding Optimization API Ready`);
      logger.info(`🔒 HIPAA-compliant healthcare data processing enabled`);
      logger.info(`🤖 AI-powered billing optimization active`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, prisma, redis }; 