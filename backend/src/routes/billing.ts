import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireRole, requireSamePractice } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ragBillingAgent, RAGQuery, RAGResponse } from '../services/ragBillingAgent';
import { billingCodeService, BillingCode } from '../services/billingCodeService';
import { logger } from '../utils/logger';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateBillingQuery = [
  body('clinicalText').notEmpty().withMessage('Clinical text is required'),
  body('encounterType').optional().isString(),
  body('patientAge').optional().isString(),
  body('timeOfDay').optional().isIn(['Day', 'Evening', 'Night', 'Weekend']),
  body('specialty').optional().isString(),
  body('existingCodes').optional().isArray(),
  body('maxSuggestions').optional().isInt({ min: 1, max: 20 })
];

const validateCodeSearch = [
  query('q').notEmpty().withMessage('Search query is required'),
  query('category').optional().isString(),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  query('timeOfDay').optional().isIn(['Day', 'Evening', 'Night', 'Weekend'])
];

// POST /api/billing/analyze - Analyze clinical text for optimal billing codes
router.post('/analyze',
  requireSamePractice,
  validateBillingQuery,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      clinicalText,
      encounterType = 'Emergency',
      patientAge,
      timeOfDay,
      specialty = 'Emergency Medicine',
      existingCodes = [],
      maxSuggestions = 10
    } = req.body;

    const userId = req.user!.id;

    try {
      const query: RAGQuery = {
        clinicalText,
        encounterType,
        patientAge,
        timeOfDay,
        specialty,
        existingCodes,
        maxSuggestions
      };

      const response: RAGResponse = await ragBillingAgent.processQuery(query);

      // Log the analysis for audit trail
      logger.info('Billing analysis completed', {
        userId,
        encounterType,
        specialty,
        codesSuggested: response.suggestedCodes.length,
        potentialRevenue: response.revenueAnalysis.revenueIncrease,
        confidence: response.confidence
      });

      res.json({
        success: true,
        analysis: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Billing analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: 'Unable to complete billing analysis'
      });
    }
  })
);

// GET /api/billing/search - Search billing codes
router.get('/search',
  validateCodeSearch,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      q: searchQuery,
      category,
      minAmount,
      maxAmount,
      timeOfDay
    } = req.query;

    try {
      const codes = await billingCodeService.searchCodes(searchQuery as string, {
        category: category as string,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        timeOfDay: timeOfDay as string
      });

      res.json({
        success: true,
        codes: codes.map(code => ({
          code: code.code,
          description: code.description,
          amount: code.amount,
          category: code.category,
          timeOfDay: code.timeOfDay,
          howToUse: code.howToUse
        })),
        total: codes.length
      });

    } catch (error) {
      logger.error('Code search failed:', error);
      res.status(500).json({
        error: 'Search failed',
        message: 'Unable to search billing codes'
      });
    }
  })
);

// GET /api/billing/code/:code - Get specific billing code details
router.get('/code/:code',
  param('code').isString().notEmpty(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { code } = req.params;

    try {
      const billingCode = billingCodeService.getCodeByCode(code);

      if (!billingCode) {
        return res.status(404).json({
          error: 'Code not found',
          message: `Billing code ${code} not found`
        });
      }

      res.json({
        success: true,
        code: billingCode
      });

    } catch (error) {
      logger.error('Code lookup failed:', error);
      res.status(500).json({
        error: 'Lookup failed',
        message: 'Unable to lookup billing code'
      });
    }
  })
);

// GET /api/billing/categories - Get all billing code categories
router.get('/categories',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const allCodes = billingCodeService.getAllCodes();
      const categories = [...new Set(allCodes.map(code => code.category))];
      
      const categoryStats = categories.map(category => {
        const codesInCategory = allCodes.filter(code => code.category === category);
        return {
          name: category,
          count: codesInCategory.length,
          avgAmount: codesInCategory.reduce((sum, code) => sum + code.amount, 0) / codesInCategory.length,
          maxAmount: Math.max(...codesInCategory.map(code => code.amount))
        };
      });

      res.json({
        success: true,
        categories: categoryStats
      });

    } catch (error) {
      logger.error('Categories lookup failed:', error);
      res.status(500).json({
        error: 'Lookup failed',
        message: 'Unable to get billing categories'
      });
    }
  })
);

// GET /api/billing/codes/category/:category - Get codes by category
router.get('/codes/category/:category',
  param('category').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { category } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
      const codes = billingCodeService.getCodesByCategory(category);
      const paginatedCodes = codes.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );

      res.json({
        success: true,
        codes: paginatedCodes.map(code => ({
          code: code.code,
          description: code.description,
          amount: code.amount,
          timeOfDay: code.timeOfDay,
          howToUse: code.howToUse
        })),
        total: codes.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error) {
      logger.error('Category codes lookup failed:', error);
      res.status(500).json({
        error: 'Lookup failed',
        message: 'Unable to get codes by category'
      });
    }
  })
);

// POST /api/billing/encounter/:encounterId/analyze - Analyze specific encounter
router.post('/encounter/:encounterId/analyze',
  requireSamePractice,
  param('encounterId').isString().notEmpty(),
  body('clinicalText').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { encounterId } = req.params;
    const { clinicalText } = req.body;
    const userId = req.user!.id;

    try {
      // Get encounter details
      const encounter = await prisma.encounter.findFirst({
        where: {
          id: encounterId,
          practiceId: req.user!.practiceId!
        },
        include: {
          diagnoses: true,
          procedures: true
        }
      });

      if (!encounter) {
        return res.status(404).json({
          error: 'Encounter not found',
          message: 'Encounter not found or access denied'
        });
      }

      // Use provided clinical text or encounter notes
      const textToAnalyze = clinicalText || encounter.notes || encounter.assessment || '';

      if (!textToAnalyze) {
        return res.status(400).json({
          error: 'No clinical text available',
          message: 'Please provide clinical text or ensure encounter has notes/assessment'
        });
      }

      // Analyze encounter
      const analysis = await billingCodeService.analyzeEncounter(encounterId, textToAnalyze);

      // Log the analysis
      logger.info('Encounter billing analysis completed', {
        userId,
        encounterId,
        codesSuggested: analysis.suggestedCodes.length,
        potentialRevenue: analysis.revenueIncrease
      });

      res.json({
        success: true,
        encounter: {
          id: encounter.id,
          date: encounter.date,
          type: encounter.type,
          status: encounter.status
        },
        analysis
      });

    } catch (error) {
      logger.error('Encounter analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: 'Unable to analyze encounter'
      });
    }
  })
);

// GET /api/billing/revenue-optimization - Get revenue optimization suggestions
router.get('/revenue-optimization',
  requireSamePractice,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('providerId').optional().isString(),
  query('category').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { startDate, endDate, providerId, category } = req.query;

    try {
      // Get encounters with low revenue
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      const encounters = await prisma.encounter.findMany({
        where: {
          practiceId: req.user!.practiceId!,
          ...(providerId && { providerId: providerId as string }),
          ...(Object.keys(dateFilter).length && { date: dateFilter })
        },
        include: {
          procedures: true,
          diagnoses: true,
          provider: {
            select: { id: true, firstName: true, lastName: true, npi: true }
          }
        }
      });

      // Analyze each encounter for optimization opportunities
      const optimizations = [];
      
      for (const encounter of encounters) {
        const clinicalText = encounter.notes || encounter.assessment || '';
        if (!clinicalText) continue;

        try {
          const analysis = await billingCodeService.analyzeEncounter(encounter.id, clinicalText);
          
          if (analysis.revenueIncrease > 0) {
            optimizations.push({
              encounterId: encounter.id,
              date: encounter.date,
              provider: encounter.provider,
              currentRevenue: analysis.totalRevenue,
              potentialRevenue: analysis.potentialRevenue,
              revenueIncrease: analysis.revenueIncrease,
              suggestedCodes: analysis.suggestedCodes.slice(0, 3), // Top 3 suggestions
              riskLevel: analysis.riskAssessment.overallRisk
            });
          }
        } catch (error) {
          logger.warn(`Failed to analyze encounter ${encounter.id}:`, error);
        }
      }

      // Sort by revenue increase potential
      optimizations.sort((a, b) => b.revenueIncrease - a.revenueIncrease);

      // Filter by category if specified
      const filteredOptimizations = category 
        ? optimizations.filter(opt => 
            opt.suggestedCodes.some(code => code.category === category)
          )
        : optimizations;

      const summary = {
        totalEncounters: encounters.length,
        optimizedEncounters: filteredOptimizations.length,
        totalCurrentRevenue: filteredOptimizations.reduce((sum, opt) => sum + opt.currentRevenue, 0),
        totalPotentialRevenue: filteredOptimizations.reduce((sum, opt) => sum + opt.potentialRevenue, 0),
        totalRevenueIncrease: filteredOptimizations.reduce((sum, opt) => sum + opt.revenueIncrease, 0),
        byRiskLevel: {
          LOW: filteredOptimizations.filter(opt => opt.riskLevel === 'LOW').length,
          MEDIUM: filteredOptimizations.filter(opt => opt.riskLevel === 'MEDIUM').length,
          HIGH: filteredOptimizations.filter(opt => opt.riskLevel === 'HIGH').length
        }
      };

      res.json({
        success: true,
        summary,
        optimizations: filteredOptimizations.slice(0, 50) // Limit to top 50
      });

    } catch (error) {
      logger.error('Revenue optimization analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: 'Unable to complete revenue optimization analysis'
      });
    }
  })
);

// GET /api/billing/quick-searches - Get quick search suggestions
router.get('/quick-searches',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const quickSearches = [
        {
          title: 'CPT Codes',
          description: 'Current Procedural Terminology codes',
          searchQuery: 'procedure',
          category: 'Procedure'
        },
        {
          title: 'ICD-10 Codes',
          description: 'International Classification of Diseases codes',
          searchQuery: 'diagnosis',
          category: 'Assessment'
        },
        {
          title: 'Emergency Codes',
          description: 'Emergency department specific codes',
          searchQuery: 'emergency',
          category: 'Emergency'
        },
        {
          title: 'High-Value Codes',
          description: 'Codes with high reimbursement amounts',
          searchQuery: '',
          category: '',
          minAmount: 100
        }
      ];

      res.json({
        success: true,
        quickSearches
      });

    } catch (error) {
      logger.error('Quick searches failed:', error);
      res.status(500).json({
        error: 'Lookup failed',
        message: 'Unable to get quick search suggestions'
      });
    }
  })
);

// GET /api/billing/recent-codes - Get recently used codes
router.get('/recent-codes',
  requireSamePractice,
  query('limit').optional().isInt({ min: 1, max: 20 }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { limit = 10 } = req.query;

    try {
      // Get recent code optimizations
      const recentOptimizations = await prisma.codeOptimization.findMany({
        where: {
          encounter: {
            practiceId: req.user!.practiceId!
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        include: {
          encounter: {
            select: { id: true, date: true }
          }
        }
      });

      const recentCodes = recentOptimizations.map(opt => {
        const code = billingCodeService.getCodeByCode(opt.suggestedCode);
        return {
          code: opt.suggestedCode,
          description: code?.description || 'Code not found',
          amount: code?.amount || 0,
          usedAt: opt.createdAt,
          encounterId: opt.encounterId,
          encounterDate: opt.encounter.date
        };
      });

      res.json({
        success: true,
        recentCodes
      });

    } catch (error) {
      logger.error('Recent codes lookup failed:', error);
      res.status(500).json({
        error: 'Lookup failed',
        message: 'Unable to get recent codes'
      });
    }
  })
);

export default router;
