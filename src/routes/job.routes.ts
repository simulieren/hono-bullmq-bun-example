import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { jobService } from '../services/job.service';
import { ApiError } from '../utils/errors';

// Create a new Hono instance for job routes
export const jobRoutes = new Hono();

// Route: GET /api/v1/jobs/stats
// Get stats for all job queues
jobRoutes.get('/stats', async (c) => {
  // In development, return mock stats
  if (process.env.NODE_ENV === 'development') {
    return c.json({
      success: true,
      data: {
        queues: {
          email: {
            name: 'email',
            waiting: 2,
            active: 1,
            completed: 15,
            failed: 1,
            delayed: 0,
            paused: false,
            workerCount: 5,
            jobCount: 19
          },
          processing: {
            name: 'processing',
            waiting: 1,
            active: 0,
            completed: 8,
            failed: 2,
            delayed: 1,
            paused: false,
            workerCount: 2,
            jobCount: 12
          },
          notification: {
            name: 'notification',
            waiting: 0,
            active: 0,
            completed: 10,
            failed: 0,
            delayed: 0,
            paused: false,
            workerCount: 5,
            jobCount: 10
          }
        },
        totalJobs: 41,
        activeWorkers: 12,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // TODO: Implement real stats retrieval in production
  // For now, reuse the mock implementation
  return c.json({
    success: true,
    data: {
      queues: {
        email: {
          name: 'email',
          waiting: 2,
          active: 1,
          completed: 15,
          failed: 1,
          delayed: 0,
          paused: false,
          workerCount: 5,
          jobCount: 19
        },
        processing: {
          name: 'processing',
          waiting: 1,
          active: 0,
          completed: 8,
          failed: 2,
          delayed: 1,
          paused: false,
          workerCount: 2,
          jobCount: 12
        },
        notification: {
          name: 'notification',
          waiting: 0,
          active: 0,
          completed: 10,
          failed: 0,
          delayed: 0,
          paused: false,
          workerCount: 5,
          jobCount: 10
        }
      },
      totalJobs: 41,
      activeWorkers: 12,
      timestamp: new Date().toISOString()
    }
  });
});

// Define validation schemas
const createEmailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1)
});

const createProcessingJobSchema = z.object({
  data: z.record(z.any()),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium')
});

const createNotificationJobSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  channel: z.enum(['push', 'sms', 'in-app']).default('push')
});

const getJobParamsSchema = z.object({
  id: z.string().min(1)
});

// Route: GET /jobs
// List all jobs (paginated)
jobRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const type = c.req.query('type');
  const status = c.req.query('status');

  // Use the real implementation to fetch jobs from Redis
  const jobs = await jobService.listJobs({ page, limit, type, status });

  return c.json({
    success: true,
    data: jobs
  });
});

// Route: GET /jobs/:id
// Get job details by ID
jobRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  
  // Use the real implementation to fetch job details from Redis
  const job = await jobService.getJobById(id);
  if (!job) {
    throw new ApiError('Job not found', 404);
  }

  return c.json({
    success: true,
    data: job
  });
});

// Route: POST /jobs/email
// Create a new email job
jobRoutes.post('/email', zValidator('json', createEmailJobSchema), async (c) => {
  const data = c.req.valid('json');
  
  const job = await jobService.createEmailJob(data);
  
  return c.json({
    success: true,
    data: {
      jobId: job.id,
      queue: 'email',
      status: 'created'
    }
  }, 201);
});

// Route: POST /jobs/email/welcome
// Create a welcome email job
jobRoutes.post('/email/welcome', zValidator('json', z.object({
  email: z.string().email(),
  name: z.string().min(1)
})), async (c) => {
  const { email, name } = c.req.valid('json');
  
  // Use email queue helper for welcome email
  const jobId = await jobService.createWelcomeEmail(email, name);
  
  return c.json({
    success: true,
    data: {
      jobId,
      queue: 'email',
      type: 'welcome',
      status: 'created'
    }
  }, 201);
});

// Route: POST /jobs/email/password-reset
// Create a password reset email job
jobRoutes.post('/email/password-reset', zValidator('json', z.object({
  email: z.string().email(),
  resetToken: z.string().min(1)
})), async (c) => {
  const { email, resetToken } = c.req.valid('json');
  
  // Use email queue helper for password reset
  const jobId = await jobService.createPasswordResetEmail(email, resetToken);
  
  return c.json({
    success: true,
    data: {
      jobId,
      queue: 'email',
      type: 'password-reset',
      status: 'created'
    }
  }, 201);
});

// Route: POST /jobs/processing
// Create a new data processing job
jobRoutes.post('/processing', zValidator('json', createProcessingJobSchema), async (c) => {
  const data = c.req.valid('json');
  
  const job = await jobService.createProcessingJob(data);
  
  return c.json({
    success: true,
    data: {
      jobId: job.id,
      queue: 'processing',
      status: 'created'
    }
  }, 201);
});

// Route: POST /jobs/notification
// Create a new notification job
jobRoutes.post('/notification', zValidator('json', createNotificationJobSchema), async (c) => {
  const data = c.req.valid('json');
  
  const job = await jobService.createNotificationJob(data);
  
  return c.json({
    success: true,
    data: {
      jobId: job.id,
      queue: 'notification',
      status: 'created'
    }
  }, 201);
});

// Route: DELETE /jobs/:id
// Cancel a job by ID
jobRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  
  await jobService.cancelJob(id);
  
  return c.json({
    success: true,
    data: {
      message: 'Job cancelled successfully'
    }
  });
});

// Route: GET /jobs/:id/logs
// Get logs for a specific job
jobRoutes.get('/:id/logs', async (c) => {
  const { id } = c.req.param();
  
  const logs = await jobService.getJobLogs(id);
  
  return c.json({
    success: true,
    data: logs
  });
});

// Route: GET /api/v1/jobs/stats
// Get stats for all job queues
jobRoutes.get('/stats', async (c) => {
  // In development, return mock stats
  if (process.env.NODE_ENV === 'development') {
    return c.json({
      success: true,
      data: {
        queues: {
          email: {
            name: 'email',
            waiting: 2,
            active: 1,
            completed: 15,
            failed: 1,
            delayed: 0,
            paused: false,
            workerCount: 5,
            jobCount: 19
          },
          processing: {
            name: 'processing',
            waiting: 1,
            active: 0,
            completed: 8,
            failed: 2,
            delayed: 1,
            paused: false,
            workerCount: 2,
            jobCount: 12
          },
          notification: {
            name: 'notification',
            waiting: 0,
            active: 0,
            completed: 10,
            failed: 0,
            delayed: 0,
            paused: false,
            workerCount: 5,
            jobCount: 10
          }
        },
        totalJobs: 41,
        activeWorkers: 12,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // TODO: Implement real stats retrieval in production
  // For now, reuse the mock implementation
  return c.json({
    success: true,
    data: {
      queues: {
        email: {
          name: 'email',
          waiting: 2,
          active: 1,
          completed: 15,
          failed: 1,
          delayed: 0,
          paused: false,
          workerCount: 5,
          jobCount: 19
        },
        processing: {
          name: 'processing',
          waiting: 1,
          active: 0,
          completed: 8,
          failed: 2,
          delayed: 1,
          paused: false,
          workerCount: 2,
          jobCount: 12
        },
        notification: {
          name: 'notification',
          waiting: 0,
          active: 0,
          completed: 10,
          failed: 0,
          delayed: 0,
          paused: false,
          workerCount: 5,
          jobCount: 10
        }
      },
      totalJobs: 41,
      activeWorkers: 12,
      timestamp: new Date().toISOString()
    }
  });
});
