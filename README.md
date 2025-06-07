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

## Quick Start

```bash
# Install dependencies
npm install
# or
bun install

# Setup environment
cp .env.example .env
# Edit .env with your Redis configuration

# Start development server
npm run dev
```

## Available Commands

### npm Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run test       # Run tests
npm run clean      # Clean build artifacts
npm run health     # Check server health
npm run stats      # Show queue statistics
npm run dashboard  # Open dashboard in browser
npm run test-jobs  # Create sample test jobs
npm run help       # Show all available commands
```

### Alternative with Bun

```bash
bun run dev        # Start development server
bun run build      # Build for production
bun run start      # Start production server
bun test           # Run tests
bun run clean      # Clean workspace
bun run dashboard  # Open dashboard
bun run test-jobs  # Create sample jobs
```

See [COMMANDS.md](./COMMANDS.md) for complete command reference.

## Configuration

1. Copy environment template: `cp .env.example .env`
2. Update Redis connection settings:

```env
NODE_ENV=development
PORT=5000
REDIS_HOST=switchyard.proxy.rlwy.net
REDIS_PORT=43172
REDIS_PASSWORD=your_password
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
