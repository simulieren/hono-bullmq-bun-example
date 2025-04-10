import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { jobService } from '../services/job.service';
import { ApiError } from '../utils/errors';

// Create a new Hono instance for job routes
export const jobRoutes = new Hono();

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
