import { z } from 'zod';
import { Context } from 'hono';
import { ApiError } from './errors';

/**
 * Validate request body against a Zod schema
 * @param schema Zod schema to validate against
 * @param ctx Hono context
 * @returns Validated data
 */
export async function validateBody<T>(
  schema: z.ZodType<T>,
  ctx: Context
): Promise<T> {
  try {
    const body = await ctx.req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      throw new ApiError('Validation error', 400, { details: formattedErrors });
    }
    
    throw new ApiError('Invalid request body', 400);
  }
}

/**
 * Validate query parameters against a Zod schema
 * @param schema Zod schema to validate against
 * @param ctx Hono context
 * @returns Validated query parameters
 */
export function validateQuery<T>(
  schema: z.ZodType<T>,
  ctx: Context
): T {
  try {
    const query = Object.fromEntries(
      new URL(ctx.req.url).searchParams.entries()
    );
    
    return schema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      throw new ApiError('Invalid query parameters', 400, { details: formattedErrors });
    }
    
    throw new ApiError('Invalid query parameters', 400);
  }
}

/**
 * Validate URL parameters against a Zod schema
 * @param schema Zod schema to validate against
 * @param ctx Hono context
 * @returns Validated URL parameters
 */
export function validateParams<T>(
  schema: z.ZodType<T>,
  ctx: Context
): T {
  try {
    return schema.parse(ctx.req.param());
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      throw new ApiError('Invalid URL parameters', 400, { details: formattedErrors });
    }
    
    throw new ApiError('Invalid URL parameters', 400);
  }
}
