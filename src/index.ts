import { startServer } from './server';
import { logger } from './middleware/logger';
import { config } from './config';
import { startWorkers } from './workers';

/**
 * Main application entry point
 * This initializes the Hono server and workers for job processing
 */
const main = async () => {
  try {
    // Start job queue workers
    await startWorkers();
    logger.info('Job queue workers started successfully');

    // Start the Hono server
    await startServer();
    logger.info(`Server started on http://0.0.0.0:${config.port}`);
  } catch (error) {
    logger.error(error, 'Failed to start application');
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  // Don't exit process in production to allow for graceful recovery
  if (config.nodeEnv !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception');
  // Always exit on uncaught exceptions as the process may be in an unstable state
  process.exit(1);
});

// Start the application
main();
