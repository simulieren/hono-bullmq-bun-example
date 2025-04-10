import { emailQueue } from './email.queue';
import { processingQueue } from './processing.queue';
import { notificationQueue } from './notification.queue';
import { queueLogger as logger } from '../middleware/logger';
import { Queue } from 'bullmq';

// Registry of all application queues
const queues: Record<string, Queue> = {
  'email': emailQueue,
  'processing': processingQueue,
  'notification': notificationQueue
};

/**
 * Get all registered queues
 * @returns Object with all application queues
 */
export function getAllQueues(): Record<string, Queue> {
  return queues;
}

/**
 * Register a new queue in the registry
 * @param name Queue name
 * @param queue BullMQ queue instance
 */
export function registerQueue(name: string, queue: Queue): void {
  if (queues[name]) {
    logger.warn({ queueName: name }, 'Queue already registered, overwriting');
  }
  
  queues[name] = queue;
  logger.info({ queueName: name }, 'Queue registered');
}

/**
 * Close all queue connections gracefully
 * Should be called during application shutdown
 */
export async function closeAllQueues(): Promise<void> {
  logger.info('Closing all queue connections');
  
  const closePromises = Object.entries(queues).map(async ([name, queue]) => {
    try {
      await queue.close();
      logger.info({ queueName: name }, 'Queue connection closed');
    } catch (error) {
      logger.error({ error, queueName: name }, 'Error closing queue connection');
    }
  });
  
  await Promise.allSettled(closePromises);
  logger.info('All queue connections closed');
}
