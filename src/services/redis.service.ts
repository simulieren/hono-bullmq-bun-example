import { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { config } from '../config';
import { redisLogger as logger } from '../middleware/logger';
import { DatabaseError } from '../utils/errors';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Creates or returns an existing Redis connection
 * Uses a singleton pattern to avoid multiple connections
 */
export function getRedisConnection(): Redis {
  if (redisClient !== null) {
    return redisClient;
  }
  
  // In development mode, use mock Redis implementation if Redis URL is localhost
  const isLocalRedis = config.redis.url.includes('localhost') || config.redis.url.includes('127.0.0.1');
  if (config.isDevelopment && isLocalRedis) {
    logger.warn('Using mock Redis implementation for development. NOT FOR PRODUCTION USE.');
    redisClient = new RedisMock({
      // Configure mock with BullMQ compatibility settings
      maxRetriesPerRequest: null
    }) as Redis;
    
    logger.info('Mock Redis client ready');
    return redisClient;
  }

  try {
    // Create new Redis client
    redisClient = new Redis(config.redis.url, {
      password: config.redis.password,
      retryStrategy(times) {
        // Exponential backoff with maximum retry time of 10s
        const delay = Math.min(Math.exp(times), 10000);
        logger.info(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: null, // BullMQ requires this to be null
      enableReadyCheck: true,
      lazyConnect: false
    });

    // Set up event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connecting');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', (delay) => {
      logger.info(`Redis client reconnecting in ${delay}ms`);
    });

    return redisClient;
  } catch (error) {
    logger.error({ error }, 'Failed to create Redis connection');
    throw new DatabaseError('Failed to connect to Redis', { cause: error });
  }
}

/**
 * Closes the Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
      redisClient = null;
    } catch (error) {
      logger.error({ error }, 'Error closing Redis connection');
      redisClient = null;
      throw new DatabaseError('Failed to close Redis connection', { cause: error });
    }
  }
}

/**
 * Wrapper for handling Redis operations with proper error handling
 * @param operation Function that performs Redis operations
 * @returns Result of the operation
 */
export async function withRedis<T>(
  operation: (redis: Redis) => Promise<T>
): Promise<T> {
  const redis = getRedisConnection();
  
  try {
    return await operation(redis);
  } catch (error) {
    logger.error({ error }, 'Redis operation failed');
    throw new DatabaseError('Redis operation failed', { cause: error });
  }
}
