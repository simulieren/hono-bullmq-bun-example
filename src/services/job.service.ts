import { emailQueue, emailQueueHelpers } from '../queues/email.queue';
import { processingQueue, processingQueueHelpers } from '../queues/processing.queue';
import { notificationQueue, notificationQueueHelpers } from '../queues/notification.queue';
import { getRedisConnection } from './redis.service';
import { queueLogger as logger } from '../middleware/logger';
import { ApiError, AppError } from '../utils/errors';
import { getAllQueues } from '../queues';

/**
 * Service for managing job operations across different queues
 */
import { QueueStats } from '../types';
export const jobService = {
  /**
   * Create an email job in the email queue
   * @param data Email job data
   */
  async createEmailJob(data: { to: string; subject: string; body: string }) {
    try {
      logger.info({ to: data.to, subject: data.subject }, 'Creating email job');
      
      const job = await emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        removeOnFail: false
      });
      
      return job;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create email job');
      throw new AppError('Failed to create email job', { cause: error });
    }
  },

  /**
   * Create a data processing job
   * @param data Processing job data
   */
  async createProcessingJob(data: { data: Record<string, any>; priority?: 'high' | 'medium' | 'low' }) {
    try {
      const { priority = 'medium' } = data;
      
      // Map priority to numeric values
      const priorityValue = priority === 'high' ? 1 : priority === 'medium' ? 2 : 3;
      
      logger.info({ 
        priority,
        dataPreview: JSON.stringify(data.data).substring(0, 50) + (JSON.stringify(data.data).length > 50 ? '...' : '')
      }, 'Creating processing job');
      
      const job = await processingQueue.add('process-data', data.data, {
        priority: priorityValue,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000
        },
        removeOnComplete: false,
        removeOnFail: false
      });
      
      return job;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create processing job');
      throw new AppError('Failed to create processing job', { cause: error });
    }
  },

  /**
   * Create a notification job
   * @param data Notification job data
   */
  async createNotificationJob(data: { userId: string; message: string; channel: 'push' | 'sms' | 'in-app' }) {
    try {
      logger.info({ 
        userId: data.userId, 
        channel: data.channel,
        messagePreview: data.message.substring(0, 20) + (data.message.length > 20 ? '...' : '')
      }, 'Creating notification job');
      
      const job = await notificationQueue.add('send-notification', data, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        removeOnFail: false,
        delay: data.channel === 'sms' ? 1000 : 0 // Small delay for SMS
      });
      
      return job;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create notification job');
      throw new AppError('Failed to create notification job', { cause: error });
    }
  },
  
  /**
   * Create a welcome email job
   * @param email User's email address
   * @param name User's name for personalization
   */
  async createWelcomeEmail(email: string, name: string): Promise<string> {
    try {
      logger.info({ email, name }, 'Creating welcome email job');
      return await emailQueueHelpers.sendWelcomeEmail(email, name);
    } catch (error) {
      logger.error({ error, email }, 'Failed to create welcome email job');
      throw new AppError('Failed to create welcome email job', { cause: error });
    }
  },
  
  /**
   * Create a password reset email job
   * @param email User's email address
   * @param resetToken Password reset token
   */
  async createPasswordResetEmail(email: string, resetToken: string): Promise<string> {
    try {
      logger.info({ email }, 'Creating password reset email job');
      return await emailQueueHelpers.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      logger.error({ error, email }, 'Failed to create password reset email job');
      throw new AppError('Failed to create password reset email job', { cause: error });
    }
  },

  /**
   * Get a job by ID
   * @param id Job ID
   */
  async getJobById(id: string) {
    try {
      // Check if ID includes a queue name prefix
      const [queueName, jobId] = id.includes(':') ? id.split(':') : [null, id];
      
      if (queueName) {
        // If queue name is provided, get from specific queue
        const queue = this.getQueueByName(queueName);
        if (!queue) {
          throw new ApiError(`Queue "${queueName}" not found`, 404);
        }
        
        const job = await queue.getJob(jobId);
        if (!job) {
          throw new ApiError('Job not found', 404);
        }
        
        return this.formatJobData(job);
      } else {
        // Try to find job in all queues
        const queues = getAllQueues();
        
        for (const [name, queue] of Object.entries(queues)) {
          const job = await queue.getJob(id);
          if (job) {
            return this.formatJobData(job);
          }
        }
        
        throw new ApiError('Job not found', 404);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error({ error, id }, 'Failed to get job');
      throw new AppError('Failed to get job details', { cause: error });
    }
  },

  /**
   * List jobs with filtering and pagination
   * @param options List options
   */
  async listJobs({ page = 1, limit = 10, type, status }: { 
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    try {
      const queues = getAllQueues();
      const offset = (page - 1) * limit;
      let results: any[] = [];
      
      // If type is specified, only get jobs from that queue
      if (type && queues[type]) {
        results = await this.getJobsFromQueue(queues[type], status, offset, limit);
      } else {
        // Get jobs from all queues
        for (const [name, queue] of Object.entries(queues)) {
          const queueJobs = await this.getJobsFromQueue(queue, status, 0, limit * 2);
          results.push(...queueJobs);
        }
        
        // Sort by timestamp and apply pagination manually
        results.sort((a, b) => b.timestamp - a.timestamp);
        results = results.slice(offset, offset + limit);
      }
      
      return {
        jobs: results,
        pagination: {
          page,
          limit,
          totalJobs: results.length, // This is not accurate for total count
          hasMore: results.length === limit
        }
      };
    } catch (error) {
      logger.error({ error }, 'Failed to list jobs');
      throw new AppError('Failed to list jobs', { cause: error });
    }
  },

  /**
   * Cancel a job by ID
   * @param id Job ID
   */
  async cancelJob(id: string) {
    try {
      // Use real implementation with Redis
      // Parse job ID to get queue name and job ID
      const [queueName, jobId] = id.includes(':') ? id.split(':') : [null, id];
      
      if (queueName) {
        // If queue name is provided, get from specific queue
        const queue = this.getQueueByName(queueName);
        if (!queue) {
          throw new ApiError(`Queue "${queueName}" not found`, 404);
        }
        
        const job = await queue.getJob(jobId);
        if (!job) {
          throw new ApiError('Job not found', 404);
        }
        
        return await job.remove();
      } else {
        // Try to find and cancel job in all queues
        const queues = getAllQueues();
        
        for (const [name, queue] of Object.entries(queues)) {
          const job = await queue.getJob(id);
          if (job) {
            return await job.remove();
          }
        }
        
        throw new ApiError('Job not found', 404);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error({ error, id }, 'Failed to cancel job');
      throw new AppError('Failed to cancel job', { cause: error });
    }
  },

  /**
   * Get logs for a specific job
   * @param id Job ID
   */
  async getJobLogs(id: string) {
    try {
      // Get real job logs from Redis
      const job = await this.getJobById(id);
      
      // In a real implementation, you would retrieve logs from a storage system
      // For this example, we'll return the job's attempt history
      return {
        jobId: job.id,
        queue: job.queue,
        logs: job.attempts > 0 ? [
          { timestamp: new Date().toISOString(), message: `Job has been processed ${job.attempts} times` },
          { timestamp: new Date().toISOString(), message: `Current status: ${job.status}` }
        ] : [
          { timestamp: new Date().toISOString(), message: 'Job has not been processed yet' }
        ]
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error({ error, id }, 'Failed to get job logs');
      throw new AppError('Failed to retrieve job logs', { cause: error });
    }
  },

  /**
   * Helper: Get queue by name
   * @param name Queue name
   */
  getQueueByName(name: string) {
    const queues = getAllQueues();
    return queues[name] || null;
  },

  /**
   * Helper: Get jobs from a queue with filtering
   * @param queue BullMQ queue instance
   * @param status Job status to filter by (optional)
   * @param offset Pagination offset
   * @param limit Pagination limit
   */
  async getJobsFromQueue(queue: any, status: string | undefined, offset: number, limit: number) {
    let jobs: any[] = [];
    
    switch (status) {
      case 'active':
        jobs = await queue.getActive(offset, offset + limit - 1);
        break;
      case 'waiting':
        jobs = await queue.getWaiting(offset, offset + limit - 1);
        break;
      case 'completed':
        jobs = await queue.getCompleted(offset, offset + limit - 1);
        break;
      case 'failed':
        jobs = await queue.getFailed(offset, offset + limit - 1);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(offset, offset + limit - 1);
        break;
      default:
        // Get jobs from all states if no status specified
        const active = await queue.getActive(0, limit - 1);
        const waiting = await queue.getWaiting(0, limit - 1);
        const completed = await queue.getCompleted(0, limit - 1);
        const failed = await queue.getFailed(0, limit - 1);
        const delayed = await queue.getDelayed(0, limit - 1);
        
        jobs = [...active, ...waiting, ...failed, ...delayed, ...completed];
        // Sort by timestamp
        jobs.sort((a, b) => b.timestamp - a.timestamp);
        jobs = jobs.slice(offset, offset + limit);
    }
    
    return jobs.map(job => this.formatJobData(job));
  },

  /**
   * Helper: Format job data for API responses
   * @param job BullMQ job instance
   */
  formatJobData(job: any) {
    const { id, name, data, opts, timestamp, processedOn, finishedOn, attemptsMade, failedReason, stacktrace } = job;
    
    let status;
    if (finishedOn) {
      status = 'completed';
    } else if (processedOn) {
      status = 'active';
    } else if (timestamp > Date.now()) {
      status = 'delayed';
    } else if (failedReason) {
      status = 'failed';
    } else {
      status = 'waiting';
    }
    
    return {
      id: job.id,
      queue: job.queue.name,
      name: job.name,
      data: job.data,
      status,
      priority: job.opts.priority,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      timestamp: new Date(job.timestamp).toISOString(),
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failedReason: job.failedReason || null
    };
  },

  /**
   * Get queue statistics for all registered queues
   * @returns Object with statistics for all queues
   */
  async getQueueStats() {
    try {
      const queues = getAllQueues();
      const queueStats: Record<string, QueueStats> = {};
      let totalJobs = 0;
      let activeWorkers = 0;

      // For each queue, get the stats
      for (const [name, queue] of Object.entries(queues)) {
        // Get counts for each job state
        const waiting = await queue.getWaitingCount();
        const active = await queue.getActiveCount();
        const completed = await queue.getCompletedCount();
        const failed = await queue.getFailedCount();
        const delayed = await queue.getDelayedCount();
        
        // Get worker count (this is a simplified approach)
        let workerCount = 0;
        if (name === 'email') {
          workerCount = 5;
        } else if (name === 'processing') {
          workerCount = 2;
        } else if (name === 'notification') {
          workerCount = 5;
        }
        
        // Add to total counts
        const jobCount = waiting + active + completed + failed + delayed;
        totalJobs += jobCount;
        activeWorkers += workerCount;
        
        // Store the stats for this queue
        queueStats[name] = {
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused: false, // Would need to implement isPaused() check in real app
          workerCount,
          jobCount
        };
      }
      
      return {
        queues: queueStats,
        totalJobs,
        activeWorkers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get queue stats');
      throw new AppError('Failed to retrieve queue statistics', { cause: error });
    }
  }
};
