import { Queue } from 'bullmq';
import { getRedisConnection } from '../services/redis.service';
import { config } from '../config';
import { queueLogger as logger } from '../middleware/logger';

// Define the email job data structure
export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

/**
 * Queue for email sending jobs
 * Handles queueing of all outgoing emails
 */
export const emailQueue = new Queue<EmailJobData>('email', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    // Default options for all email jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep the latest 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days for analysis
    },
  },
});

// Set up queue event handlers for monitoring
emailQueue.on('error', (error) => {
  logger.error({ error }, 'Email queue error');
});

emailQueue.on('failed', (job, error) => {
  logger.error(
    { 
      jobId: job?.id,
      attempts: job?.attemptsMade,
      error
    },
    `Email job failed: ${error.message}`
  );
});

emailQueue.on('completed', (job) => {
  logger.info(
    { 
      jobId: job?.id,
      to: job?.data.to,
      subject: job?.data.subject
    },
    'Email job completed'
  );
});

emailQueue.on('stalled', (jobId) => {
  logger.warn({ jobId }, 'Email job stalled');
});

emailQueue.on('waiting', (jobId) => {
  logger.debug({ jobId }, 'Email job waiting');
});

emailQueue.on('active', (job) => {
  logger.debug(
    { 
      jobId: job?.id,
      to: job?.data.to
    },
    'Email job active'
  );
});

/**
 * Add helpers for common email patterns
 */
export const emailQueueHelpers = {
  /**
   * Queue a welcome email to a new user
   * @param email User's email address
   * @param name User's name for personalization
   */
  async sendWelcomeEmail(email: string, name: string): Promise<string> {
    try {
      logger.info({
        email: email,
        name: name
      }, 'Creating welcome email job');

      const job = await emailQueue.add(
        'welcome-email',
        {
          to: email,
          subject: 'Welcome to our service!',
          body: `Hello ${name}, welcome to our service!`
        },
        {
          priority: 1, // High priority
        }
      );
      
      return job.id;
    } catch (error) {
      logger.error({ error, email }, 'Error creating welcome email');
      throw error;
    }
  },
  
  /**
   * Queue a password reset email
   * @param email User's email address
   * @param resetToken Password reset token
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<string> {
    try {
      logger.info({
        email: email,
        resetToken: resetToken.substring(0, 3) + '...'
      }, 'Creating password reset email job');

      const job = await emailQueue.add(
        'password-reset',
        {
          to: email,
          subject: 'Password Reset Request',
          body: `Use this token to reset your password: ${resetToken}`
        },
        {
          priority: 1, // High priority
          attempts: 5, // More attempts for critical emails
        }
      );
      
      return job.id;
    } catch (error) {
      logger.error({ error, email }, 'Error creating password reset email');
      throw error;
    }
  },
  
  /**
   * Queue a notification email
   * @param email User's email address
   * @param subject Email subject
   * @param message Email message
   */
  async sendNotificationEmail(email: string, subject: string, message: string): Promise<string> {
    try {
      logger.info({
        email: email,
        subject: subject
      }, 'Creating notification email job');

      const job = await emailQueue.add(
        'notification-email',
        {
          to: email,
          subject,
          body: message
        },
        {
          priority: 2, // Medium priority
        }
      );
      
      return job.id;
    } catch (error) {
      logger.error({ error, email }, 'Error creating notification email');
      throw error;
    }
  }
};
