import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../services/redis.service';
import { config } from '../config';
import { workerLogger as logger } from '../middleware/logger';
import { NotificationJobData } from '../queues/notification.queue';

// Worker instance
let worker: Worker | null = null;

/**
 * Process generic notification job
 */
async function processNotificationJob(job: Job<NotificationJobData>): Promise<any> {
  const { userId, message, channel, metadata } = job.data;
  
  logger.info({ jobId: job.id, userId, channel }, 'Processing notification job');
  
  try {
    // Simulate notification processing time
    const processingTime = Math.random() * 800 + 200; // 200-1000ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // In a real implementation, you would send the notification via the appropriate channel
    // For example: await notificationService.send(channel, userId, message, metadata);
    
    // Log success
    logger.info({ jobId: job.id, userId, channel, processingTime }, 'Notification sent successfully');
    
    // Return job result
    return {
      success: true,
      timestamp: new Date().toISOString(),
      userId,
      channel,
      notificationId: `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  } catch (error) {
    // Log error
    logger.error({ error, jobId: job.id, userId, channel }, 'Failed to send notification');
    
    // Re-throw to trigger job failure and retry
    throw error;
  }
}

/**
 * Channel-specific notification processors
 */
const notificationProcessors: Record<string, (job: Job<NotificationJobData>) => Promise<any>> = {
  'push-notification': async (job: Job<NotificationJobData>) => {
    const { userId, message, metadata } = job.data;
    const { title, data } = metadata || {};
    
    logger.info({ jobId: job.id, userId, title }, 'Processing push notification');
    
    try {
      // Simulate push notification time
      const processingTime = Math.random() * 1000 + 500; // 500-1500ms
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // In a real implementation, you would send a push notification
      // For example: await pushService.send(userId, title, message, data);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        userId,
        channel: 'push',
        notificationId: `push-${Date.now()}`,
        deviceCount: Math.floor(Math.random() * 3) + 1 // Number of devices notification was sent to
      };
    } catch (error) {
      logger.error({ error, jobId: job.id, userId }, 'Push notification failed');
      throw error;
    }
  },
  
  'sms-notification': async (job: Job<NotificationJobData>) => {
    const { userId, message, metadata } = job.data;
    const { phoneNumber } = metadata || {};
    
    logger.info({ jobId: job.id, userId, phoneNumber }, 'Processing SMS notification');
    
    try {
      // Simulate SMS sending time
      const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // In a real implementation, you would send an SMS
      // For example: await smsService.send(phoneNumber, message);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        userId,
        channel: 'sms',
        phoneNumber,
        notificationId: `sms-${Date.now()}`,
        messageId: `msg-${Math.floor(Math.random() * 100000)}`
      };
    } catch (error) {
      logger.error({ error, jobId: job.id, userId, phoneNumber }, 'SMS notification failed');
      throw error;
    }
  },
  
  'in-app-notification': async (job: Job<NotificationJobData>) => {
    const { userId, message, metadata } = job.data;
    const { type } = metadata || {};
    
    logger.info({ jobId: job.id, userId, type }, 'Processing in-app notification');
    
    try {
      // Simulate in-app notification time (typically fast)
      const processingTime = Math.random() * 300 + 100; // 100-400ms
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // In a real implementation, you would store the in-app notification
      // For example: await inAppService.createNotification(userId, type, message);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        userId,
        channel: 'in-app',
        type,
        notificationId: `in-app-${Date.now()}`
      };
    } catch (error) {
      logger.error({ error, jobId: job.id, userId, type }, 'In-app notification failed');
      throw error;
    }
  },
  
  // Default processor for any other notification type
  'send-notification': processNotificationJob
};

/**
 * Start the notification worker
 */
export async function startNotificationWorker(): Promise<void> {
  if (worker) {
    logger.warn('Notification worker already running');
    return;
  }
  
  try {
    // Create a new worker
    worker = new Worker('notification', async (job) => {
      // Route job to appropriate processor based on name
      const processor = notificationProcessors[job.name] || notificationProcessors['send-notification'];
      return processor(job);
    }, {
      connection: getRedisConnection(),
      concurrency: config.queue.maxConcurrency,
      limiter: {
        max: 100,      // Maximum number of notifications per time period
        duration: 1000 // Time period in ms (1 second)
      }
    });
    
    // Set up worker event handlers
    worker.on('completed', (job) => {
      logger.info(
        { 
          jobId: job?.id,
          userId: job?.data.userId,
          channel: job?.data.channel,
          duration: job ? Date.now() - job.processedOn! : undefined
        },
        'Notification job completed successfully'
      );
    });
    
    worker.on('failed', (job, error) => {
      logger.error(
        { 
          jobId: job?.id,
          userId: job?.data.userId,
          channel: job?.data.channel,
          error,
          attempts: job?.attemptsMade
        },
        `Notification job failed: ${error.message}`
      );
    });
    
    worker.on('error', error => {
      logger.error({ error }, 'Notification worker error');
    });
    
    logger.info({ concurrency: config.queue.maxConcurrency }, 'Notification worker started');
  } catch (error) {
    logger.error({ error }, 'Failed to start notification worker');
    throw error;
  }
}

/**
 * Stop the notification worker gracefully
 */
export async function stopNotificationWorker(): Promise<void> {
  if (!worker) {
    logger.warn('Notification worker not running');
    return;
  }
  
  try {
    await worker.close();
    worker = null;
    logger.info('Notification worker stopped');
  } catch (error) {
    logger.error({ error }, 'Failed to stop notification worker');
    throw error;
  }
}
