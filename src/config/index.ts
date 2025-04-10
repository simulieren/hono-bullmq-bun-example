import { z } from 'zod';

// Bun has built-in support for .env files, so we don't need a separate package

/**
 * Environment variables schema validation
 * This ensures our app has all required environment variables at startup
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  MAX_CONCURRENCY: z.string().transform(Number).default('5')
});

// Validate environment variables against schema
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:', result.error.format());
  throw new Error('Invalid environment variables');
}

/**
 * Application configuration derived from environment variables
 */
export const config = {
  nodeEnv: result.data.NODE_ENV,
  isProduction: result.data.NODE_ENV === 'production',
  isDevelopment: result.data.NODE_ENV === 'development',
  isTest: result.data.NODE_ENV === 'test',
  port: result.data.PORT,
  logLevel: result.data.LOG_LEVEL,
  redis: {
    url: result.data.REDIS_URL,
    password: result.data.REDIS_PASSWORD
  },
  queue: {
    maxConcurrency: result.data.MAX_CONCURRENCY
  }
};
