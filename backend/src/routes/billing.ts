import express from 'express';
// import { PrismaClient } from '@prisma/client';
// import { AuthenticatedRequest, requireRole, requirePracticeAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ragBillingAgent, RAGQuery, RAGResponse } from '../services/ragBillingAgent';
import { billingCodeService, BillingCode } from '../services/billingCodeService';
import { logger } from '../utils/logger';
// import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();
// const prisma = new PrismaClient(); // Temporarily disabled

// Temporary type for requests without auth
type AuthenticatedRequest = express.Request & {
  user?: any;
};

// POST /api/billing/analyze - Analyze clinical text for optimal billing codes
router.post('/analyze',
  // requirePracticeAccess, // Temporarily disabled
  // validateBillingQuery, // Temporarily disabled for easier testing
  asyncHandler(async (req: any, res) => {
    const {
      clinicalText,
      encounterType = 'Emergency',
      patientAge,
      timeOfDay,
      specialty = 'Emergency Medicine',
      existingCodes = [],
      maxSuggestions = 10
    } = req.body;

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
  // validateCodeSearch, // Temporarily disabled for easier access
  asyncHandler(async (req: AuthenticatedRequest, res) => {
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
  // param('code').isString().notEmpty(),
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
  // param('category').isString().notEmpty(),
  // query('limit').optional().isInt({ min: 1, max: 100 }),
  // query('offset').optional().isInt({ min: 0 }),
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
  // requirePracticeAccess,
  // param('encounterId').isString().notEmpty(),
  // body('clinicalText').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { encounterId } = req.params;
    const { clinicalText } = req.body;

    try {
      // Get encounter details - Temporarily disabled
      const encounter = null; // Temporarily disabled

      if (!encounter) {
        // Mock encounter logic if needed or error
        return res.status(404).json({
          error: 'Encounter not found',
          message: 'Encounter not found or access denied'
        });
      }

      /*
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
      */
     res.status(501).json({ error: 'Not implemented in simple server' });

    } catch (error) {
      logger.error('Encounter analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: 'Unable to analyze encounter'
      });
    }
  })
);

// GET /api/billing/revenue-optimization
router.get('/revenue-optimization',
  // requirePracticeAccess,
  // query('startDate').optional().isISO8601(),
  // query('endDate').optional().isISO8601(),
  // query('providerId').optional().isString(),
  // query('category').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({ success: true, optimizations: [], summary: {} });
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
  // requirePracticeAccess,
  // query('limit').optional().isInt({ min: 1, max: 20 }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({ success: true, recentCodes: [] });
  })
);

export default router;
