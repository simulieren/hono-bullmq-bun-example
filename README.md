# Hono Queue Server

A production-ready Hono server with Bun runtime, featuring Redis and BullMQ for robust job queue processing implemented in TypeScript.

## Features

- **Hono Framework**: Fast, lightweight HTTP framework
- **BullMQ**: High-performance queue processing
- **Redis Integration**: Reliable message broker
- **TypeScript**: Type-safe development experience
- **Job Queue Types**: Email, Notification, and Processing queues
- **Validation**: Request validation with Zod
- **Logging**: Structured logging with Pino
- **Error Handling**: Comprehensive error handling and reporting
- **Development Mode**: Mock implementations for development without Redis

## Installation

To install dependencies:

```bash
bun install
```

## Configuration

1. Create a `.env` file in the project root (use `.env.example` as a template)
2. Configure Redis connection settings and other environment variables

```
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=queue:
```

## Running the Server

Start the development server:

```bash
bun run src/index.ts
```

## API Endpoints

### Health Check

- `GET /api/v1/health` - Check server health

### Job Management

- `GET /api/v1/jobs` - List all jobs (supports filtering and pagination)
- `GET /api/v1/jobs/:id` - Get job details
- `GET /api/v1/jobs/:id/logs` - Get job logs
- `DELETE /api/v1/jobs/:id` - Cancel a job
- `GET /api/v1/jobs/stats` - Get queue statistics and metrics

### Dashboard

- `GET /dashboard` - Visual dashboard for monitoring queues

### Email Queue

- `POST /api/v1/jobs/email` - Create generic email job
- `POST /api/v1/jobs/email/welcome` - Send welcome email
- `POST /api/v1/jobs/email/password-reset` - Send password reset email

### Notification Queue

- `POST /api/v1/jobs/notification` - Create notification job (push, SMS, in-app)

### Processing Queue

- `POST /api/v1/jobs/processing` - Create data processing job

## Query Parameters

All list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `type` - Filter by queue type (email, notification, processing)
- `status` - Filter by job status (waiting, active, completed, failed, delayed)

## Development Mode

When `NODE_ENV=development`, the server uses mock implementations for Redis operations, allowing for development and testing without a Redis server.

## License

MIT
