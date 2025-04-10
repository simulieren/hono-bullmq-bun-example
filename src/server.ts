import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { registerRoutes } from './routes';
import { config } from './config';
import { getRedisConnection } from './services/redis.service';

/**
 * Creates and configures the Hono application
 */
export function createApp(): Hono {
  const app = new Hono();

  // Apply global middleware
  app.use('*', cors());
  app.use('*', secureHeaders());
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      responseTime: `${ms}ms`
    });
  });

  // Apply custom error handling middleware
  app.onError(errorHandler);

  // Register all routes
  registerRoutes(app);

  return app;
}

/**
 * Starts the server and initializes connections
 */
export async function startServer(): Promise<void> {
  try {
    // Connect to Redis before starting the server
    await getRedisConnection();
    logger.info('Redis connection established');

    // Create and start the Hono server
    const app = createApp();
    Bun.serve({
      fetch: app.fetch,
      port: config.port,
      hostname: '0.0.0.0',
      development: config.isDevelopment,
      error(error) {
        logger.error(error, 'Server error occurred');
      }
    });

    logger.info(`Server is running on http://0.0.0.0:${config.port}`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    throw error;
  }
}

/**
 * Gracefully stops the server and closes connections
 */
export async function stopServer(): Promise<void> {
  try {
    // Close Redis connection
    const redis = getRedisConnection();
    await redis.disconnect();
    logger.info('Redis connection closed');
    
    logger.info('Server stopped gracefully');
  } catch (error) {
    logger.error(error, 'Error stopping server');
    throw error;
  }
}
