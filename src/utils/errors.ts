/**
 * Base application error class
 * Extends the built-in Error class with additional context
 */
export class AppError extends Error {
  public readonly cause?: Error;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    this.context = options?.context;
    
    // Maintains proper stack trace for where the error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * API-specific error for returning HTTP error responses
 */
export class ApiError extends AppError {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode = 500,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
      details?: any;
    }
  ) {
    super(message, options);
    this.statusCode = statusCode;
    this.details = options?.details;
  }
}

/**
 * Database-specific error for database operations
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(
    message: string,
    fields: Record<string, string>,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.fields = fields;
  }
}

/**
 * Not found error for when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
  }
}

/**
 * Authorization error for authentication/authorization failures
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
  }
}

/**
 * Rate limit error for when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    retryAfter?: number,
    options?: {
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message, options);
    this.retryAfter = retryAfter;
  }
}
