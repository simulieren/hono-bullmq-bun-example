import { Queue } from 'bullmq';
import { getRedisConnection } from '../services/redis.service';
import { config } from '../config';
import { queueLogger as logger } from '../middleware/logger';

// Generic data processing job interface
export interface ProcessingJobData {
  [key: string]: any;
}

/**
 * Queue for data processing jobs
 * Handles CPU-intensive or long-running processing tasks
 */
export const processingQueue = new Queue<ProcessingJobData>('processing', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    // Default options for processing jobs
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    timeout: 300000, // 5 minutes timeout for processing jobs
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 500, // Keep the latest 500 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Set up queue event handlers for monitoring
processingQueue.on('error', (error) => {
  logger.error({ error }, 'Processing queue error');
});

processingQueue.on('failed', (job, error) => {
  logger.error(
    { 
      jobId: job?.id,
      attempts: job?.attemptsMade,
      error
    },
    `Processing job failed: ${error.message}`
  );
});

processingQueue.on('completed', (job) => {
  logger.info(
    { 
      jobId: job?.id
    },
    'Processing job completed'
  );
});

processingQueue.on('stalled', (jobId) => {
  logger.warn({ jobId }, 'Processing job stalled');
});

processingQueue.on('waiting', (jobId) => {
  logger.debug({ jobId }, 'Processing job waiting');
});

processingQueue.on('active', (job) => {
  logger.debug(
    { 
      jobId: job?.id
    },
    'Processing job active'
  );
});

/**
 * Add helpers for common processing patterns
 */
export const processingQueueHelpers = {
  /**
   * Queue an image processing job
   * @param imageUrl URL of the image to process
   * @param operations List of operations to perform
   */
  async processImage(imageUrl: string, operations: string[]): Promise<string> {
    const job = await processingQueue.add(
      'image-processing',
      {
        imageUrl,
        operations,
        timestamp: Date.now()
      },
      {
        priority: 2, // Medium priority
      }
    );
    
    return job.id;
  },
  
  /**
   * Queue a data export job
   * @param userId User requesting the export
   * @param filters Export filters
   * @param format Export format
   */
  async exportData(userId: string, filters: Record<string, any>, format: string): Promise<string> {
    const job = await processingQueue.add(
      'data-export',
      {
        userId,
        filters,
        format,
        timestamp: Date.now()
      },
      {
        priority: 3, // Lower priority
        timeout: 600000, // 10 minutes for exports
      }
    );
    
    return job.id;
  },
  
  /**
   * Queue a report generation job
   * @param reportType Type of report to generate
   * @param parameters Report parameters
   */
  async generateReport(reportType: string, parameters: Record<string, any>): Promise<string> {
    const job = await processingQueue.add(
      'report-generation',
      {
        reportType,
        parameters,
        timestamp: Date.now()
      },
      {
        priority: 2, // Medium priority
      }
    );
    
    return job.id;
  }
};
