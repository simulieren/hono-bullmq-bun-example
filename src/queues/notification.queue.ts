import { Queue } from 'bullmq';
import { getRedisConnection } from '../services/redis.service';
import { config } from '../config';
import { queueLogger as logger } from '../middleware/logger';

// Define the notification job data structure
export interface NotificationJobData {
  userId: string;
  message: string;
  channel: 'push' | 'sms' | 'in-app';
  metadata?: Record<string, any>;
}

/**
 * Queue for notification jobs
 * Handles user notifications across different channels
 */
export const notificationQueue = new Queue<NotificationJobData>('notification', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    // Default options for notification jobs
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep the latest 1000 completed jobs
    },
    removeOnFail: {
      age: 3 * 24 * 3600, // Keep failed jobs for 3 days
    },
  },
});

// Set up queue event handlers for monitoring
notificationQueue.on('error', (error) => {
  logger.error({ error }, 'Notification queue error');
});

notificationQueue.on('failed', (job, error) => {
  logger.error(
    { 
      jobId: job?.id,
      userId: job?.data.userId,
      channel: job?.data.channel,
      attempts: job?.attemptsMade,
      error
    },
    `Notification job failed: ${error.message}`
  );
});

notificationQueue.on('completed', (job) => {
  logger.info(
    { 
      jobId: job?.id,
      userId: job?.data.userId,
      channel: job?.data.channel
    },
    'Notification job completed'
  );
});

notificationQueue.on('stalled', (jobId) => {
  logger.warn({ jobId }, 'Notification job stalled');
});

notificationQueue.on('waiting', (jobId) => {
  logger.debug({ jobId }, 'Notification job waiting');
});

notificationQueue.on('active', (job) => {
  logger.debug(
    { 
      jobId: job?.id,
      userId: job?.data.userId,
      channel: job?.data.channel
    },
    'Notification job active'
  );
});

/**
 * Add helpers for common notification patterns
 */
export const notificationQueueHelpers = {
  /**
   * Send a push notification to a user
   * @param userId User ID to notify
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data payload
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      // For development/demo, simply generate a job ID
      if (process.env.NODE_ENV === 'development') {
        const mockJobId = `mock-notification-push-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Log the mock job for visibility in development
        logger.info({
          jobId: mockJobId,
          userId,
          title,
          body,
          channel: 'push',
          jobType: 'push-notification'
        }, 'Created mock push notification job');
        
        return mockJobId;
      }

      const job = await notificationQueue.add(
        'push-notification',
        {
          userId,
          message: body,
          channel: 'push',
          metadata: {
            title,
            data
          }
        },
        {
          priority: 2, // Medium priority
        }
      );
      
      return job.id;
    } catch (error) {
      logger.error({ error, userId }, 'Error creating push notification');
      throw error;
    }
  },
  
  /**
   * Send an SMS notification
   * @param userId User ID to notify
   * @param phoneNumber Phone number to send to
   * @param message SMS message
   */
  async sendSmsNotification(
    userId: string,
    phoneNumber: string,
    message: string
  ): Promise<string> {
    try {
      // For development/demo, simply generate a job ID
      if (process.env.NODE_ENV === 'development') {
        const mockJobId = `mock-notification-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Log the mock job for visibility in development
        logger.info({
          jobId: mockJobId,
          userId,
          phoneNumber,
          message: message.substring(0, 20) + (message.length > 20 ? '...' : ''),
          channel: 'sms',
          jobType: 'sms-notification'
        }, 'Created mock SMS notification job');
        
        return mockJobId;
      }

      const job = await notificationQueue.add(
        'sms-notification',
        {
          userId,
          message,
          channel: 'sms',
          metadata: {
            phoneNumber
          }
        },
        {
          priority: 1, // Higher priority
        }
      );
      
      return job.id;
    } catch (error) {
      logger.error({ error, userId }, 'Error creating SMS notification');
      throw error;
    }
  },
  
  /**
   * Send an in-app notification
   * @param userId User ID to notify
   * @param message Notification message
   * @param type Notification type
   */
  async sendInAppNotification(
    userId: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success'
  ): Promise<string> {
    try {
      // For development/demo, simply generate a job ID
      if (process.env.NODE_ENV === 'development') {
        const mockJobId = `mock-notification-inapp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Log the mock job for visibility in development
        logger.info({
          jobId: mockJobId,
          userId,
          message: message.substring(0, 20) + (message.length > 20 ? '...' : ''),
          type,
          channel: 'in-app',
          jobType: 'in-app-notification'
        }, 'Created mock in-app notification job');
        
        return mockJobId;
      }

      const job = await notificationQueue.add(
        'in-app-notification',
        {
          userId,
          message,
          channel: 'in-app',
          metadata: {
            type,
            timestamp: new Date().toISOString()
          }
        },
        {
          priority: 3, // Lower priority
        }
      );
      
      return job.id;
    } catch (error) {
      logger.error({ error, userId }, 'Error creating in-app notification');
      throw error;
    }
  }
};
