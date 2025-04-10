/**
 * Type definitions for the application
 */

import { Queue, Worker, Job, QueueScheduler } from 'bullmq';

/**
 * Request validation types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  name: string;
  concurrency: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

/**
 * Job types
 */
export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed'
}

export enum JobPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

export interface JobOptions {
  priority?: JobPriority;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean | { age: number; count: number };
  removeOnFail?: boolean | { age: number; count: number };
  delay?: number;
  timeout?: number;
}

export interface JobResult<T = any> {
  success: boolean;
  timestamp: string;
  data: T;
  error?: string;
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: number;
    details?: any;
  };
}

/**
 * Email job types
 */
export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  cc?: string[];
  bcc?: string[];
}

/**
 * Processing job types
 */
export interface ProcessingJobData {
  [key: string]: any;
}

/**
 * Notification job types
 */
export interface NotificationJobData {
  userId: string;
  message: string;
  channel: 'push' | 'sms' | 'in-app';
  metadata?: Record<string, any>;
}

/**
 * Job statistics
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

/**
 * Worker status
 */
export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  CLOSED = 'closed',
  ERROR = 'error'
}

export interface WorkerInfo {
  queue: string;
  status: WorkerStatus;
  concurrency: number;
  processed: number;
  failed: number;
  uptime: number;
}
