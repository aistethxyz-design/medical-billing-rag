import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { isFileAuthEnabled } from '../services/fileAuthService';
import { getProviderDashboard } from '../services/fileEncounterService';

const router = express.Router();

async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
}

// GET /api/analytics/dashboard — summary for the logged-in provider
router.get(
  '/dashboard',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const practiceId = req.user!.practiceId;

    if (isFileAuthEnabled()) {
      const dashboard = getProviderDashboard(userId);
      return res.json({ success: true, dashboard });
    }

    try {
      const prisma = await getPrisma();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const baseWhere = practiceId
        ? { providerId: userId, encounter: { practiceId } }
        : { providerId: userId };

      const [pendingCount, approvedThisMonth, recentOptimizations] = await Promise.all([
        prisma.codeOptimization.count({ where: { ...baseWhere, status: 'PENDING' } }),
        prisma.codeOptimization.findMany({
          where: { ...baseWhere, status: 'APPROVED', createdAt: { gte: monthStart } },
          select: { potentialGain: true },
        }),
        prisma.codeOptimization.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { encounter: { select: { id: true, date: true } } },
        }),
      ]);

      const monthlyImpact = approvedThisMonth.reduce((sum, o) => sum + (o.potentialGain || 0), 0);

      return res.json({
        success: true,
        dashboard: {
          pendingReviews: pendingCount,
          monthlyBillingImpact: monthlyImpact,
          claimsOptimized: approvedThisMonth.length,
          recentOptimizations: recentOptimizations.map((o) => ({
            id: o.id,
            encounterId: o.encounterId,
            originalCode: o.originalCode,
            suggestedCode: o.suggestedCode,
            potentialGain: o.potentialGain || 0,
            status: o.status.toLowerCase(),
            date: o.createdAt.toISOString().slice(0, 10),
          })),
        },
      });
    } catch {
      // Prisma unavailable — return empty dashboard (file-auth dev mode)
      res.json({
        success: true,
        dashboard: {
          pendingReviews: 0,
          monthlyBillingImpact: 0,
          claimsOptimized: 0,
          recentOptimizations: [],
        },
      });
    }
  })
);

// GET /api/analytics - legacy placeholder
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  res.json({
    success: true,
    analytics: {},
    message: 'Use /api/analytics/dashboard for provider summary',
  });
}));

export default router;
