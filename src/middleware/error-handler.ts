import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from './logger';
import { ApiError, AppError, DatabaseError } from '../utils/errors';
import { ZodError } from 'zod';

/**
 * Global error handler middleware for Hono
 * Handles different types of errors and returns appropriate responses
 */
export function errorHandler(err: Error, c: Context): Response {
  // Log the error with appropriate level based on error type
  if (err instanceof HTTPException || err instanceof ApiError) {
    logger.warn({ err, path: c.req.path }, err.message);
  } else {
    logger.error({ err, path: c.req.path, stack: err.stack }, 'Unhandled error occurred');
  }

  // Handle different error types
  if (err instanceof HTTPException) {
    // Handle Hono's built-in HTTP exceptions
    return c.json({
      success: false,
      error: {
        message: err.message,
        code: err.status
      }
    }, err.status);
  } else if (err instanceof ZodError) {
    // Handle validation errors
    const formattedErrors = err.errors.map(error => ({
      path: error.path.join('.'),
      message: error.message
    }));
    
    return c.json({
      success: false,
      error: {
        message: 'Validation Error',
        code: 400,
        details: formattedErrors
      }
    }, 400);
  } else if (err instanceof ApiError) {
    // Handle custom API errors
    return c.json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode
      }
    }, err.statusCode);
  } else if (err instanceof DatabaseError) {
    // Handle database errors
    return c.json({
      success: false,
      error: {
        message: 'Database operation failed',
        code: 500
      }
    }, 500);
  } else if (err instanceof AppError) {
    // Handle other application-specific errors
    return c.json({
      success: false,
      error: {
        message: err.message,
        code: 500
      }
    }, 500);
  }

  // Handle unknown errors (500 Internal Server Error)
  return c.json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 500
    }
  }, 500);
}
