import { Hono } from 'hono';
import { jobService } from '../services/job.service';

// Create a new Hono instance for stats routes
export const statsRoutes = new Hono();

// Route: GET /
// Get stats for all job queues
statsRoutes.get('/', async (c) => {
  try {
    // Get real-time stats from Redis
    const stats = await jobService.getQueueStats();
    
    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to retrieve stats',
        code: 500
      }
    }, 500);
  }
});