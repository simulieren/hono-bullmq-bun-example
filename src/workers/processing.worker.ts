import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../services/redis.service';
import { config } from '../config';
import { workerLogger as logger } from '../middleware/logger';
import { ProcessingJobData } from '../queues/processing.queue';

// Worker instance
let worker: Worker | null = null;

/**
 * Process data processing job
 * Generic handler for processing jobs
 */
async function processGenericJob(job: Job<ProcessingJobData>): Promise<any> {
  logger.info({ jobId: job.id, type: job.name }, 'Processing generic job');
  
  try {
    // Simulate processing time
    const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // In a real implementation, you would process the data
    // For example: const result = await dataProcessor.process(job.data);
    
    // Log success
    logger.info({ jobId: job.id, processingTime }, 'Processing completed successfully');
    
    // Return job result
    return {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime,
      result: {
        processed: true,
        items: Math.floor(Math.random() * 100) + 1
      }
    };
  } catch (error) {
    // Log error
    logger.error({ error, jobId: job.id }, 'Failed to process job');
    
    // Re-throw to trigger job failure and retry
    throw error;
  }
}

/**
 * Specialized job processors for different processing types
 */
const processingProcessors: Record<string, (job: Job<ProcessingJobData>) => Promise<any>> = {
  'image-processing': async (job: Job<ProcessingJobData>) => {
    const { imageUrl, operations } = job.data;
    logger.info({ jobId: job.id, imageUrl, operations }, 'Processing image');
    
    try {
      // Simulate image processing time (more complex than generic jobs)
      const processingTime = Math.random() * 5000 + 2000; // 2-7 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // In a real implementation, you would process the image
      // For example: const processedUrl = await imageProcessor.process(imageUrl, operations);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        originalUrl: imageUrl,
        operations,
        processedUrl: `processed-${Date.now()}-${imageUrl.split('/').pop()}`,
        metadata: {
          processingTime,
          dimensions: { width: 800, height: 600 }
        }
      };
    } catch (error) {
      logger.error({ error, jobId: job.id, imageUrl }, 'Image processing failed');
      throw error;
    }
  },
  
  'data-export': async (job: Job<ProcessingJobData>) => {
    const { userId, filters, format } = job.data;
    logger.info({ jobId: job.id, userId, format }, 'Processing data export');
    
    try {
      // Simulate export processing time (can be very long)
      const processingTime = Math.random() * 8000 + 4000; // 4-12 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // In a real implementation, you would generate the export
      // For example: const exportUrl = await exportService.generateExport(userId, filters, format);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        userId,
        format,
        recordsExported: Math.floor(Math.random() * 10000) + 100,
        downloadUrl: `exports/${userId}/${Date.now()}.${format}`
      };
    } catch (error) {
      logger.error({ error, jobId: job.id, userId, format }, 'Data export failed');
      throw error;
    }
  },
  
  'report-generation': async (job: Job<ProcessingJobData>) => {
    const { reportType, parameters } = job.data;
    logger.info({ jobId: job.id, reportType }, 'Generating report');
    
    try {
      // Simulate report generation time
      const processingTime = Math.random() * 6000 + 3000; // 3-9 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // In a real implementation, you would generate the report
      // For example: const reportUrl = await reportService.generateReport(reportType, parameters);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        reportType,
        reportId: `report-${Date.now()}`,
        downloadUrl: `reports/${reportType}/${Date.now()}.pdf`
      };
    } catch (error) {
      logger.error({ error, jobId: job.id, reportType }, 'Report generation failed');
      throw error;
    }
  },
  
  // Default processor for any other processing job
  'process-data': processGenericJob
};

/**
 * Start the processing worker
 */
export async function startProcessingWorker(): Promise<void> {
  if (worker) {
    logger.warn('Processing worker already running');
    return;
  }
  
  try {
    // Create a new worker with specific concurrency
    // Processing jobs tend to be CPU/memory intensive, so limit concurrency
    worker = new Worker('processing', async (job) => {
      // Route job to appropriate processor based on name
      const processor = processingProcessors[job.name] || processingProcessors['process-data'];
      return processor(job);
    }, {
      connection: getRedisConnection(),
      concurrency: Math.max(1, Math.floor(config.queue.maxConcurrency / 2)), // Use half of max concurrency for processing
      limiter: {
        max: 20,        // Maximum number of jobs per time period
        duration: 60000 // Time period in ms (1 minute)
      }
    });
    
    // Set up worker event handlers
    worker.on('completed', (job) => {
      logger.info(
        { 
          jobId: job?.id,
          type: job?.name,
          duration: job ? Date.now() - job.processedOn! : undefined
        },
        'Processing job completed successfully'
      );
    });
    
    worker.on('failed', (job, error) => {
      logger.error(
        { 
          jobId: job?.id,
          type: job?.name,
          error,
          attempts: job?.attemptsMade
        },
        `Processing job failed: ${error.message}`
      );
    });
    
    worker.on('error', error => {
      logger.error({ error }, 'Processing worker error');
    });
    
    logger.info({ concurrency: Math.max(1, Math.floor(config.queue.maxConcurrency / 2)) }, 'Processing worker started');
  } catch (error) {
    logger.error({ error }, 'Failed to start processing worker');
    throw error;
  }
}

/**
 * Stop the processing worker gracefully
 */
export async function stopProcessingWorker(): Promise<void> {
  if (!worker) {
    logger.warn('Processing worker not running');
    return;
  }
  
  try {
    await worker.close();
    worker = null;
    logger.info('Processing worker stopped');
  } catch (error) {
    logger.error({ error }, 'Failed to stop processing worker');
    throw error;
  }
}
