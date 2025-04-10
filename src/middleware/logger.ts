import pino from 'pino';
import { config } from '../config';

/**
 * Configure Pino logger with appropriate settings based on environment
 */
export const logger = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Simple formatters for all environments, avoiding transport dependencies
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: () => {
      return { env: config.nodeEnv };
    }
  }
});

// Add basic child loggers for different components of the application
export const httpLogger = logger.child({ component: 'http' });
export const redisLogger = logger.child({ component: 'redis' });
export const queueLogger = logger.child({ component: 'queue' });
export const workerLogger = logger.child({ component: 'worker' });
