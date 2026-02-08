import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, requireRole, requirePracticeAccess } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { aiService, CodeValidationService, NCCIService } from '../services/aiService';
import { logger } from '../utils/logger';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateCodingAnalysis = [
  body('clinicalText').notEmpty().withMessage('Clinical text is required'),
  body('encounterId').optional().isString(),
  body('specialty').optional().isString(),
  body('providerId').optional().isString()
];

const validateCodeOptimization = [
  body('encounterId').isString().notEmpty().withMessage('Encounter ID is required'),
  body('optimizations').isArray().withMessage('Optimizations must be an array'),
  body('optimizations.*.originalCode').notEmpty().withMessage('Original code is required'),
  body('optimizations.*.suggestedCode').notEmpty().withMessage('Suggested code is required'),
  body('optimizations.*.reason').notEmpty().withMessage('Reason is required')
];

// POST /api/coding/analyze - Analyze clinical text for medical codes
router.post('/analyze', 
  requirePracticeAccess,
  validateCodingAnalysis,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { clinicalText, encounterId, specialty, providerId } = req.body;
    const userId = req.user!.id;

    try {
      // Perform AI analysis
      const analysis = await aiService.analyzeMedicalCodes(clinicalText, specialty);

      // Validate suggested codes
      const validatedCodes = analysis.suggestedCodes.map(code => ({
        ...code,
        isValid: CodeValidationService.getCodeType(code.code) !== 'UNKNOWN'
      }));

      // Check for bundling issues
      const bundlingChecks = [];
      for (let i = 0; i < validatedCodes.length; i++) {
        for (let j = i + 1; j < validatedCodes.length; j++) {
          const code1 = validatedCodes[i];
          const code2 = validatedCodes[j];
          const bundlingResult = NCCIService.checkBundling(code1.code, code2.code);
          
          if (bundlingResult.bundled) {
            bundlingChecks.push({
              primaryCode: code1.code,
              bundledCode: code2.code,
              reason: bundlingResult.reason
            });
          }
        }
      }

      // Save analysis results if encounterId provided
      if (encounterId) {
        // Verify encounter belongs to user's practice
        const encounter = await prisma.encounter.findFirst({
          where: {
            id: encounterId,
            practiceId: req.user!.practiceId!
          }
        });

        if (!encounter) {
          return res.status(404).json({
            error: 'Encounter not found or access denied'
          });
        }

        // Save optimizations to database
        for (const optimization of analysis.optimizations) {
          await prisma.codeOptimization.create({
            data: {
              encounterId,
              providerId: providerId || userId,
              type: optimization.type as any,
              originalCode: optimization.originalCode,
              suggestedCode: optimization.suggestedCode,
              reason: optimization.reason,
              aiExplanation: await aiService.generateCodingExplanation(
                optimization.originalCode,
                optimization.suggestedCode,
                optimization.reason
              ),
              potentialGain: optimization.potentialGain,
              auditRisk: optimization.auditRisk as any,
              status: 'PENDING'
            }
          });
        }

        // Update encounter status
        await prisma.encounter.update({
          where: { id: encounterId },
          data: { status: 'CODED' }
        });
      }

      // Log analysis for audit trail
      logger.info('Medical coding analysis completed', {
        userId,
        encounterId,
        specialty,
        codesAnalyzed: analysis.suggestedCodes.length,
        optimizationsFound: analysis.optimizations.length,
        potentialRevenue: analysis.revenueImpact.potentialGain
      });

      res.json({
        success: true,
        analysis: {
          ...analysis,
          suggestedCodes: validatedCodes,
          bundlingChecks,
          complianceScore: analysis.riskAssessment.complianceScore,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Medical coding analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: 'Unable to complete medical coding analysis'
      });
    }
  })
);

// GET /api/coding/optimizations/:encounterId - Get optimizations for an encounter
router.get('/optimizations/:encounterId',
  requirePracticeAccess,
  param('encounterId').isString().notEmpty(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { encounterId } = req.params;

    // Verify encounter belongs to user's practice
    const encounter = await prisma.encounter.findFirst({
      where: {
        id: encounterId,
        practiceId: req.user!.practiceId!
      },
      include: {
        optimizations: {
          include: {
            provider: {
              select: { id: true, firstName: true, lastName: true, npi: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!encounter) {
      return res.status(404).json({
        error: 'Encounter not found or access denied'
      });
    }

    res.json({
      success: true,
      encounter: {
        id: encounter.id,
        date: encounter.date,
        status: encounter.status
      },
      optimizations: encounter.optimizations.map(opt => ({
        id: opt.id,
        type: opt.type,
        originalCode: opt.originalCode,
        suggestedCode: opt.suggestedCode,
        reason: opt.reason,
        aiExplanation: opt.aiExplanation,
        potentialGain: opt.potentialGain,
        auditRisk: opt.auditRisk,
        status: opt.status,
        provider: opt.provider,
        createdAt: opt.createdAt,
        reviewedAt: opt.reviewedAt
      }))
    });
  })
);

// PUT /api/coding/optimizations/:optimizationId/approve - Approve an optimization
router.put('/optimizations/:optimizationId/approve',
  requireRole(['PROVIDER', 'PRACTICE_MANAGER', 'ADMIN']),
  requirePracticeAccess,
  param('optimizationId').isString().notEmpty(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { optimizationId } = req.params;
    const userId = req.user!.id;

    const optimization = await prisma.codeOptimization.findFirst({
      where: {
        id: optimizationId,
        encounter: {
          practiceId: req.user!.practiceId!
        }
      },
      include: {
        encounter: true
      }
    });

    if (!optimization) {
      return res.status(404).json({
        error: 'Optimization not found or access denied'
      });
    }

    if (optimization.status !== 'PENDING' && optimization.status !== 'REVIEWED') {
      return res.status(400).json({
        error: 'Optimization cannot be approved',
        message: 'Only pending or reviewed optimizations can be approved'
      });
    }

    const updatedOptimization = await prisma.codeOptimization.update({
      where: { id: optimizationId },
      data: {
        status: 'APPROVED',
        approved: true,
        reviewedAt: new Date(),
        implementedAt: new Date()
      }
    });

    // Log approval for audit trail
    logger.info('Code optimization approved', {
      optimizationId,
      approvedBy: userId,
      encounterId: optimization.encounterId,
      originalCode: optimization.originalCode,
      suggestedCode: optimization.suggestedCode,
      potentialGain: optimization.potentialGain
    });

    res.json({
      success: true,
      optimization: updatedOptimization,
      message: 'Optimization approved successfully'
    });
  })
);

// PUT /api/coding/optimizations/:optimizationId/reject - Reject an optimization
router.put('/optimizations/:optimizationId/reject',
  requireRole(['PROVIDER', 'PRACTICE_MANAGER', 'ADMIN']),
  requirePracticeAccess,
  param('optimizationId').isString().notEmpty(),
  body('reason').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { optimizationId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    const optimization = await prisma.codeOptimization.findFirst({
      where: {
        id: optimizationId,
        encounter: {
          practiceId: req.user!.practiceId!
        }
      }
    });

    if (!optimization) {
      return res.status(404).json({
        error: 'Optimization not found or access denied'
      });
    }

    const updatedOptimization = await prisma.codeOptimization.update({
      where: { id: optimizationId },
      data: {
        status: 'REJECTED',
        approved: false,
        reviewedAt: new Date(),
        complianceNotes: reason
      }
    });

    // Log rejection for audit trail
    logger.info('Code optimization rejected', {
      optimizationId,
      rejectedBy: userId,
      reason,
      encounterId: optimization.encounterId
    });

    res.json({
      success: true,
      optimization: updatedOptimization,
      message: 'Optimization rejected'
    });
  })
);

// GET /api/coding/validate/:code - Validate a medical code
router.get('/validate/:code',
  param('code').isString().notEmpty(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { code } = req.params;
    const codeType = CodeValidationService.getCodeType(code);

    let isValid = false;
    let details: any = {};

    switch (codeType) {
      case 'EMERGENCY_ASSESSMENT':
      case 'CRITICAL_CARE':
      case 'ASSESSMENT':
      case 'PROCEDURE':
      case 'CONSULTATION':
      case 'PREMIUM':
      case 'FRACTURE':
      case 'DISLOCATION':
      case 'TELEMEDICINE':
      case 'REPAIR':
        isValid = CodeValidationService.validateOHIPCode(code);
        break;
      default:
        isValid = false;
    }

    // Check for bundling rules
    if (codeType !== 'UNKNOWN') {
      details.mutuallyExclusive = NCCIService.getMutuallyExclusiveCodes(code);
    }

    // Look up code in reference database
    const codeReference = await prisma.codeReference.findUnique({
      where: { code }
    });

    if (codeReference) {
      details.description = codeReference.description;
      details.category = codeReference.category;
      details.medicareAmount = codeReference.medicareAmount;
      details.validModifiers = codeReference.validModifiers;
    }

    res.json({
      success: true,
      code,
      type: codeType,
      isValid,
      details
    });
  })
);

// GET /api/coding/revenue-impact - Get revenue impact analytics
router.get('/revenue-impact',
  requirePracticeAccess,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('providerId').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { startDate, endDate, providerId } = req.query;
    
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const optimizations = await prisma.codeOptimization.findMany({
      where: {
        encounter: {
          practiceId: req.user!.practiceId!
        },
        ...(providerId && { providerId: providerId as string }),
        ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        approved: true
      },
      include: {
        encounter: true,
        provider: {
          select: { id: true, firstName: true, lastName: true, npi: true }
        }
      }
    });

    const summary = {
      totalOptimizations: optimizations.length,
      totalPotentialGain: optimizations.reduce((sum, opt) => sum + (opt.potentialGain || 0), 0),
      approvedOptimizations: optimizations.filter(opt => opt.approved).length,
      byProvider: {} as any,
      byType: {} as any,
      byRiskLevel: {} as any
    };

    // Group by provider
    optimizations.forEach(opt => {
      const providerId = opt.providerId;
      if (!summary.byProvider[providerId]) {
        summary.byProvider[providerId] = {
          provider: opt.provider,
          count: 0,
          potentialGain: 0
        };
      }
      summary.byProvider[providerId].count++;
      summary.byProvider[providerId].potentialGain += opt.potentialGain || 0;
    });

    // Group by optimization type
    optimizations.forEach(opt => {
      const type = opt.type;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });

    // Group by risk level
    optimizations.forEach(opt => {
      const risk = opt.auditRisk;
      summary.byRiskLevel[risk] = (summary.byRiskLevel[risk] || 0) + 1;
    });

    res.json({
      success: true,
      summary,
      optimizations: optimizations.map(opt => ({
        id: opt.id,
        type: opt.type,
        originalCode: opt.originalCode,
        suggestedCode: opt.suggestedCode,
        potentialGain: opt.potentialGain,
        auditRisk: opt.auditRisk,
        provider: opt.provider,
        encounterDate: opt.encounter.date,
        createdAt: opt.createdAt
      }))
    });
  })
);

export default router; 