import { Hono } from 'hono';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { emailQueue } from '../queues/email.queue';
import { processingQueue } from '../queues/processing.queue';
import { notificationQueue } from '../queues/notification.queue';
import { logger } from '../middleware/logger';

// Create a new Hono app for Bull Board
export const bullBoardRouter = new Hono();

// Create and configure the adapter
const serverAdapter = new HonoAdapter({});

// Configure the Bull Board with our queues
createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(processingQueue),
    new BullMQAdapter(notificationQueue)
  ],
  serverAdapter
});

// Set the base path for Bull Board
serverAdapter.setBasePath('/admin/queues');

// Use the Bull Board plugin in our router
bullBoardRouter.use('/*', serverAdapter.registerPlugin());

logger.info('Bull Board initialized at /admin/queues');