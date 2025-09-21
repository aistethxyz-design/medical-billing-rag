import winston from 'winston';
import path from 'path';

// Custom log format for medical applications
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Ensure no PHI is logged (HIPAA compliance)
    const sanitizedMeta = sanitizePHI(meta);
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedMeta
    });
  })
);

// Function to sanitize PHI from logs
function sanitizePHI(obj: any): any {
  const phiFields = [
    'ssn', 'socialSecurityNumber', 'patientName', 'firstName', 'lastName',
    'email', 'phone', 'phoneNumber', 'address', 'dob', 'dateOfBirth',
    'mrn', 'medicalRecordNumber', 'insuranceId', 'memberId'
  ];

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = { ...obj };
  
  for (const field of phiFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePHI(sanitized[key]);
    }
  }

  return sanitized;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'codemax-ai',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join('logs', 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // Separate file for error logs
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // Audit log file for HIPAA compliance
    new winston.transports.File({
      filename: path.join('logs', 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 50, // Keep more audit logs for compliance
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  ]
});

// Enhanced logging methods for medical applications
export const medicalLogger = {
  // Standard logging methods
  info: (message: string, meta?: any) => logger.info(message, sanitizePHI(meta)),
  warn: (message: string, meta?: any) => logger.warn(message, sanitizePHI(meta)),
  error: (message: string, meta?: any) => logger.error(message, sanitizePHI(meta)),
  debug: (message: string, meta?: any) => logger.debug(message, sanitizePHI(meta)),
  
  // Medical-specific logging methods
  auditLog: (action: string, userId: string, resourceType: string, resourceId?: string, details?: any) => {
    logger.info('AUDIT', {
      type: 'audit',
      action,
      userId,
      resourceType,
      resourceId,
      details: sanitizePHI(details),
      timestamp: new Date().toISOString()
    });
  },
  
  hipaaAccess: (userId: string, patientId: string, action: string, ipAddress?: string) => {
    logger.info('HIPAA_ACCESS', {
      type: 'hipaa_access',
      userId,
      patientId: patientId ? '[PATIENT_ID_REDACTED]' : undefined,
      action,
      ipAddress,
      timestamp: new Date().toISOString()
    });
  },
  
  codingAnalysis: (providerId: string, encounterId: string, analysisType: string, result?: any) => {
    logger.info('CODING_ANALYSIS', {
      type: 'coding_analysis',
      providerId,
      encounterId,
      analysisType,
      result: sanitizePHI(result),
      timestamp: new Date().toISOString()
    });
  },
  
  securityEvent: (eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => {
    logger.warn('SECURITY_EVENT', {
      type: 'security_event',
      eventType,
      severity,
      details: sanitizePHI(details),
      timestamp: new Date().toISOString()
    });
  },
  
  systemPerformance: (metric: string, value: number, threshold?: number) => {
    logger.info('PERFORMANCE', {
      type: 'performance',
      metric,
      value,
      threshold,
      alert: threshold ? value > threshold : false,
      timestamp: new Date().toISOString()
    });
  }
};

// Export both the standard logger and medical logger
export { logger };
export default medicalLogger; 