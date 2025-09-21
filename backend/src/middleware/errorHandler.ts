import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './auth';

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types for medical coding application
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class MedicalCodingError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'MEDICAL_CODING_ERROR');
    this.name = 'MedicalCodingError';
  }
}

export class HIPAAViolationError extends AppError {
  constructor(message: string) {
    super(message, 403, 'HIPAA_VIOLATION');
    this.name = 'HIPAAViolationError';
  }
}

export class AuditRequiredError extends AppError {
  constructor(message: string = 'This action requires audit logging') {
    super(message, 500, 'AUDIT_REQUIRED_ERROR');
    this.name = 'AuditRequiredError';
  }
}

// Main error handling middleware
export function errorHandler(
  error: ApiError,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Set default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle different types of errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry exists';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error with appropriate level
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  const logData = {
    error: {
      message: error.message,
      code,
      statusCode,
      stack: error.stack,
      isOperational: error.isOperational
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeBody(req.body),
      params: req.params,
      query: req.query,
      userId: req.user?.id,
      userRole: req.user?.role,
      practiceId: req.user?.practiceId,
      ip: getClientIP(req),
      userAgent: req.get('User-Agent')
    },
    timestamp: new Date().toISOString()
  };

  if (logLevel === 'error') {
    logger.error('API Error', logData);
  } else {
    logger.warn('API Warning', logData);
  }

  // Log security-related errors separately
  if (statusCode === 401 || statusCode === 403) {
    logger.warn('SECURITY_EVENT', {
      type: 'security_event',
      eventType: statusCode === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS',
      severity: 'MEDIUM',
      userId: req.user?.id,
      ip: getClientIP(req),
      endpoint: req.url,
      timestamp: new Date().toISOString()
    });
  }

  // Prepare error response
  const errorResponse: any = {
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    }
  };

  // Add additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  // Medical coding specific error handling
  if (error instanceof MedicalCodingError) {
    errorResponse.error.type = 'MEDICAL_CODING_ERROR';
    errorResponse.error.suggestions = [
      'Verify clinical documentation is complete',
      'Check code format and validity',
      'Ensure proper modifier usage',
      'Review bundling rules and guidelines'
    ];
  }

  // HIPAA compliance error handling
  if (error instanceof HIPAAViolationError) {
    errorResponse.error.type = 'HIPAA_COMPLIANCE_ERROR';
    errorResponse.error.complianceInfo = {
      message: 'This action may violate HIPAA regulations',
      recommendation: 'Ensure proper authorization and audit trails',
      contactInfo: 'Contact your compliance officer for guidance'
    };
    
    // Log HIPAA violations with high priority
    logger.error('HIPAA_VIOLATION', {
      type: 'hipaa_violation',
      severity: 'HIGH',
      userId: req.user?.id,
      action: req.method + ' ' + req.url,
      details: sanitizeBody(error),
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

// Async error handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Handle unhandled promise rejections
export function handleUnhandledRejections(): void {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise
    });
    
    // Don't exit in production, just log
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });
    
    // Exit gracefully
    process.exit(1);
  });
}

// Utility functions
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password', 'token', 'secret', 'ssn', 'socialSecurityNumber',
    'creditCard', 'bankAccount', 'dob', 'dateOfBirth'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.ip ||
    'unknown'
  );
}

// Export error classes and handler
export {
  AppError,
  errorHandler as default
}; 