import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './auth';

const prisma = new PrismaClient();

interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

export async function auditMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  
  // Store original res.json to intercept responses
  const originalJson = res.json;
  let responseBody: any;
  
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Continue to next middleware
  next();

  // Log after response is sent
  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;
      
      const auditEntry: AuditLogEntry = {
        userId: req.user?.id,
        action: determineAction(req.method, req.path),
        resource: determineResource(req.path),
        resourceId: extractResourceId(req),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent'),
        details: JSON.stringify({
          duration,
          query: sanitizeQuery(req.query),
          params: req.params,
          responseStatus: res.statusCode,
          errorMessage: res.statusCode >= 400 ? responseBody?.message || responseBody?.error : undefined
        }),
        timestamp: new Date()
      };

      // Save audit log to database
      await saveAuditLog(auditEntry);

      // Log to Winston for additional monitoring
      logger.info('API_ACCESS', {
        type: 'api_access',
        ...auditEntry,
        hipaaCompliant: true
      });

      // Log performance metrics
      if (duration > 5000) { // Log slow requests (>5 seconds)
        logger.warn('SLOW_REQUEST', {
          type: 'performance',
          path: req.path,
          method: req.method,
          duration,
          userId: req.user?.id
        });
      }

    } catch (error) {
      logger.error('Audit logging failed:', error);
      // Don't fail the request if audit logging fails
    }
  });
}

async function saveAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        details: typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: entry.timestamp
      }
    });
  } catch (error) {
    // Log error but don't throw to avoid breaking the request
    logger.error('Failed to save audit log to database:', error);
  }
}

function determineAction(method: string, path: string): string {
  const actions: Record<string, string> = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };

  const baseAction = actions[method] || 'UNKNOWN';
  
  // Special cases for medical actions
  if (path.includes('/coding/analyze')) {
    return 'CODING_ANALYSIS';
  }
  if (path.includes('/documents/upload')) {
    return 'DOCUMENT_UPLOAD';
  }
  if (path.includes('/encounters')) {
    return `ENCOUNTER_${baseAction}`;
  }
  if (path.includes('/patients')) {
    return `PATIENT_${baseAction}`;
  }
  if (path.includes('/auth/login')) {
    return 'LOGIN_ATTEMPT';
  }
  if (path.includes('/auth/logout')) {
    return 'LOGOUT';
  }

  return baseAction;
}

function determineResource(path: string): string {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length >= 2 && segments[0] === 'api') {
    return segments[1].toUpperCase();
  }
  
  return 'UNKNOWN';
}

function extractResourceId(req: Request): string | undefined {
  // Try to extract ID from URL params
  if (req.params.id) {
    return req.params.id;
  }
  
  // Try to extract from common ID parameters
  const idParams = ['encounterId', 'practiceId', 'userId', 'documentId', 'patientId'];
  for (const param of idParams) {
    if (req.params[param]) {
      return req.params[param];
    }
  }
  
  return undefined;
}

function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function sanitizeQuery(query: any): any {
  // Remove sensitive parameters from query logging
  const sensitiveParams = ['password', 'token', 'secret', 'key', 'ssn', 'dob'];
  const sanitized = { ...query };
  
  for (const param of sensitiveParams) {
    if (sanitized[param]) {
      sanitized[param] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// HIPAA-specific audit functions
export async function logHIPAAAccess(
  userId: string,
  patientId: string,
  action: string,
  additionalDetails?: any
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `HIPAA_${action}`,
        resource: 'PATIENT_DATA',
        details: JSON.stringify({
          patientId: '[PATIENT_ID_REDACTED]', // Don't store actual patient ID
          action,
          hipaaAccess: true,
          ...additionalDetails
        }),
        timestamp: new Date()
      }
    });

    logger.info('HIPAA_ACCESS_LOG', {
      type: 'hipaa_access',
      userId,
      action,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to log HIPAA access:', error);
  }
}

export async function logDataExport(
  userId: string,
  exportType: string,
  recordCount: number,
  format: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_EXPORT',
        resource: 'BULK_DATA',
        details: JSON.stringify({
          exportType,
          recordCount,
          format,
          timestamp: new Date().toISOString()
        }),
        timestamp: new Date()
      }
    });

    logger.info('DATA_EXPORT_LOG', {
      type: 'data_export',
      userId,
      exportType,
      recordCount,
      format
    });
  } catch (error) {
    logger.error('Failed to log data export:', error);
  }
}

export async function logSecurityEvent(
  eventType: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  details: any,
  userId?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SECURITY_EVENT',
        resource: 'SYSTEM',
        details: JSON.stringify({
          eventType,
          severity,
          ...details,
          timestamp: new Date().toISOString()
        }),
        timestamp: new Date()
      }
    });

    logger.warn('SECURITY_EVENT_LOG', {
      type: 'security_event',
      eventType,
      severity,
      userId,
      details
    });
  } catch (error) {
    logger.error('Failed to log security event:', error);
  }
}

// Audit trail query functions for compliance reporting
export async function getAuditTrail(
  startDate: Date,
  endDate: Date,
  userId?: string,
  action?: string
): Promise<any[]> {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        ...(userId && { userId }),
        ...(action && { action })
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10000 // Limit for performance
    });

    return auditLogs;
  } catch (error) {
    logger.error('Failed to retrieve audit trail:', error);
    return [];
  }
}

export async function generateComplianceReport(
  practiceId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        user: {
          practiceId
        }
      },
      include: {
        user: true
      }
    });

    const report = {
      practiceId,
      reportPeriod: { startDate, endDate },
      totalAccess: auditLogs.length,
      uniqueUsers: new Set(auditLogs.map(log => log.userId)).size,
      accessByAction: {},
      securityEvents: auditLogs.filter(log => log.action === 'SECURITY_EVENT').length,
      hipaaAccess: auditLogs.filter(log => log.action.startsWith('HIPAA_')).length,
      generatedAt: new Date()
    };

    // Group by action
    auditLogs.forEach(log => {
      const action = log.action;
      (report.accessByAction as any)[action] = ((report.accessByAction as any)[action] || 0) + 1;
    });

    return report;
  } catch (error) {
    logger.error('Failed to generate compliance report:', error);
    throw new Error('Failed to generate compliance report');
  }
} 