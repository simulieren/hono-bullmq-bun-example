import { Hono } from 'hono';
import { getRedisConnection } from '../services/redis.service';
import { getAllQueues } from '../queues';

// Create a new Hono instance for health routes
export const healthRoutes = new Hono();

// Route: GET /health
// Basic health check endpoint
healthRoutes.get('/', async (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Route: GET /health/detailed
// Detailed health check that verifies Redis and queues
healthRoutes.get('/detailed', async (c) => {
  try {
    // Check Redis connection
    const redis = getRedisConnection();
    const redisStatus = await redis.ping() === 'PONG';

    // Check queue statuses
    const queues = getAllQueues();
    const queueStatuses = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        try {
          const active = await queue.getActiveCount();
          const waiting = await queue.getWaitingCount();
          const completed = await queue.getCompletedCount();
          const failed = await queue.getFailedCount();
          const delayed = await queue.getDelayedCount();
          
          return {
            name,
            status: 'healthy',
            counts: { active, waiting, completed, failed, delayed }
          };
        } catch (error) {
          return {
            name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Determine overall health status
    const isHealthy = redisStatus && queueStatuses.every(q => q.status === 'healthy');

    return c.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          redis: {
            status: redisStatus ? 'connected' : 'disconnected'
          },
          queues: queueStatuses
        }
      }
    }, isHealthy ? 200 : 503);
  } catch (error) {
    return c.json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});
