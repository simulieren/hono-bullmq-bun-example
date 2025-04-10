import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../services/redis.service';
import { config } from '../config';
import { workerLogger as logger } from '../middleware/logger';
import { EmailJobData } from '../queues/email.queue';

// Worker instance
let worker: Worker | null = null;

/**
 * Process email jobs
 * This is where the actual email sending logic would go
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<any> {
  const { to, subject, body } = job.data;
  
  logger.info({ jobId: job.id, to, subject }, 'Processing email job');
  
  try {
    // Simulate email processing time
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // In a real implementation, you would send the email using an email service
    // For example: await emailService.send(to, subject, body);
    
    // Log success
    logger.info({ jobId: job.id, to, processingTime }, 'Email sent successfully');
    
    // Return job result
    return {
      success: true,
      timestamp: new Date().toISOString(),
      recipient: to,
      messageId: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  } catch (error) {
    // Log error
    logger.error({ error, jobId: job.id, to }, 'Failed to send email');
    
    // Re-throw to trigger job failure and retry
    throw error;
  }
}

/**
 * Email job processor for specific job types
 */
const emailProcessors: Record<string, (job: Job<EmailJobData>) => Promise<any>> = {
  'welcome-email': async (job: Job<EmailJobData>) => {
    logger.info({ jobId: job.id }, 'Processing welcome email');
    // Special handling for welcome emails
    return processEmailJob(job);
  },
  
  'password-reset': async (job: Job<EmailJobData>) => {
    logger.info({ jobId: job.id }, 'Processing password reset email');
    // Password reset emails have higher priority
    return processEmailJob(job);
  },
  
  'notification-email': async (job: Job<EmailJobData>) => {
    logger.info({ jobId: job.id }, 'Processing notification email');
    return processEmailJob(job);
  },
  
  // Default processor for any other email type
  'send-email': processEmailJob
};

/**
 * Start the email worker
 */
export async function startEmailWorker(): Promise<void> {
  if (worker) {
    logger.warn('Email worker already running');
    return;
  }
  
  try {
    // Create a new worker
    worker = new Worker('email', async (job) => {
      // Route job to appropriate processor based on name
      const processor = emailProcessors[job.name] || emailProcessors['send-email'];
      return processor(job);
    }, {
      connection: getRedisConnection(),
      concurrency: config.queue.maxConcurrency,
      limiter: {
        max: 50,       // Maximum number of jobs per time period
        duration: 1000 // Time period in ms (1 second)
      }
    });
    
    // Set up worker event handlers
    worker.on('completed', (job) => {
      logger.info(
        { 
          jobId: job?.id,
          to: job?.data.to,
          duration: job ? Date.now() - job.processedOn! : undefined
        },
        'Email job completed successfully'
      );
    });
    
    worker.on('failed', (job, error) => {
      logger.error(
        { 
          jobId: job?.id,
          to: job?.data.to,
          error,
          attempts: job?.attemptsMade
        },
        `Email job failed: ${error.message}`
      );
    });
    
    worker.on('error', error => {
      logger.error({ error }, 'Email worker error');
    });
    
    logger.info({ concurrency: config.queue.maxConcurrency }, 'Email worker started');
  } catch (error) {
    logger.error({ error }, 'Failed to start email worker');
    throw error;
  }
}

/**
 * Stop the email worker gracefully
 */
export async function stopEmailWorker(): Promise<void> {
  if (!worker) {
    logger.warn('Email worker not running');
    return;
  }
  
  try {
    await worker.close();
    worker = null;
    logger.info('Email worker stopped');
  } catch (error) {
    logger.error({ error }, 'Failed to stop email worker');
    throw error;
  }
}
