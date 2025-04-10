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

  // In development, return mock data
  if (process.env.NODE_ENV === 'development') {
    // Generate some mock jobs for demonstration
    const mockJobs = [
      {
        id: 'mock-email-welcome-1744266015169-123',
        queue: 'email',
        name: 'welcome-email',
        data: {
          to: 'demo@example.com',
          subject: 'Welcome to our service!',
          body: 'Hello Demo User, welcome to our service!'
        },
        status: 'completed',
        priority: 1,
        attempts: 1,
        maxAttempts: 3,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        processedOn: new Date(Date.now() - 59000).toISOString(),
        finishedOn: new Date(Date.now() - 58000).toISOString(),
        failedReason: null
      },
      {
        id: 'mock-email-reset-1744266020012-456',
        queue: 'email',
        name: 'password-reset',
        data: {
          to: 'demo@example.com',
          subject: 'Password Reset Request',
          body: 'Use this token to reset your password: a1b2c3...'
        },
        status: 'active',
        priority: 1,
        attempts: 1,
        maxAttempts: 5,
        timestamp: new Date(Date.now() - 30000).toISOString(),
        processedOn: new Date(Date.now() - 29000).toISOString(),
        finishedOn: null,
        failedReason: null
      },
      {
        id: 'mock-processing-job-1744266020012-789',
        queue: 'processing',
        name: 'process-data',
        data: {
          type: 'image',
          url: 'https://example.com/image.jpg'
        },
        status: 'waiting',
        priority: 2,
        attempts: 0,
        maxAttempts: 2,
        timestamp: new Date(Date.now() - 10000).toISOString(),
        processedOn: null,
        finishedOn: null,
        failedReason: null
      }
    ];
    
    // Filter jobs based on request parameters
    let filteredJobs = [...mockJobs];
    
    if (type) {
      filteredJobs = filteredJobs.filter(job => job.queue === type);
    }
    
    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    return c.json({
      success: true,
      data: {
        jobs: paginatedJobs,
        pagination: {
          page,
          limit,
          totalJobs: filteredJobs.length,
          hasMore: endIndex < filteredJobs.length
        }
      }
    });
  }

  // In production, use the real implementation
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
  
  // In development, return mock data
  if (process.env.NODE_ENV === 'development') {
    // Check if the id looks like one of our mock ids
    if (id.startsWith('mock-')) {
      // Parse job type from ID
      let queueType = 'unknown';
      let jobName = 'unknown';
      
      if (id.includes('email-welcome')) {
        queueType = 'email';
        jobName = 'welcome-email';
      } else if (id.includes('email-reset')) {
        queueType = 'email';
        jobName = 'password-reset';
      } else if (id.includes('processing')) {
        queueType = 'processing';
        jobName = 'process-data';
      } else if (id.includes('notification')) {
        queueType = 'notification';
        jobName = 'send-notification';
      }
      
      // Return mock job data
      return c.json({
        success: true,
        data: {
          id,
          queue: queueType,
          name: jobName,
          data: {
            to: queueType === 'email' ? 'test@example.com' : undefined,
            userId: queueType === 'notification' ? 'user123' : undefined,
            message: queueType === 'notification' ? 'You have a new notification' : undefined,
            subject: queueType === 'email' ? 'Job Details' : undefined,
            body: queueType === 'email' ? 'This is a mock email body' : undefined
          },
          status: 'completed',
          priority: 1,
          attempts: 1,
          maxAttempts: 3,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          processedOn: new Date(Date.now() - 59000).toISOString(),
          finishedOn: new Date(Date.now() - 58000).toISOString(),
          failedReason: null
        }
      });
    }
    
    // If not a recognized mock ID, return a 404
    throw new ApiError('Job not found', 404);
  }
  
  // In production, use the real implementation
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
