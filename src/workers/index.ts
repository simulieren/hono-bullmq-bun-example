import { startEmailWorker, stopEmailWorker } from './email.worker';
import { startProcessingWorker, stopProcessingWorker } from './processing.worker';
import { startNotificationWorker, stopNotificationWorker } from './notification.worker';
import { workerLogger as logger } from '../middleware/logger';

/**
 * Start all queue workers
 */
export async function startWorkers(): Promise<void> {
  logger.info('Starting all workers');
  
  try {
    await Promise.all([
      startEmailWorker(),
      startProcessingWorker(),
      startNotificationWorker()
    ]);
    
    logger.info('All workers started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start workers');
    throw error;
  }
}

/**
 * Stop all queue workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  logger.info('Stopping all workers');
  
  try {
    await Promise.all([
      stopEmailWorker(),
      stopProcessingWorker(),
      stopNotificationWorker()
    ]);
    
    logger.info('All workers stopped successfully');
  } catch (error) {
    logger.error({ error }, 'Error stopping workers');
    throw error;
  }
}
