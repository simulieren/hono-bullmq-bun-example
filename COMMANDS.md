# Development Commands

This project provides npm-style commands for development and production workflows.

## Quick Start

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Available Commands

### Core Development

| Command | Description | Implementation |
|---------|-------------|----------------|
| `npm run dev` | Start development server with hot reload | `bun run --watch src/index.ts` |
| `npm run build` | Build optimized production bundle | `bun build src/index.ts --outdir dist --target bun --minify` |
| `npm run start` | Start production server | `cd dist && bun run index.js` |
| `npm run test` | Run test suite | `bun test` |
| `npm install` | Install dependencies | `bun install` |
| `npm run clean` | Clean workspace | Remove build artifacts and cache |

### Monitoring & Testing

| Command | Description |
|---------|-------------|
| `npm run health` | Check server health status |
| `npm run stats` | Display queue statistics |
| `npm run dashboard` | Open dashboard in browser |
| `npm run test-jobs` | Create sample test jobs |
| `npm run help` | Show all available commands |

### API Testing Commands

```bash
# Check if server is running
curl http://localhost:5000/api/v1/health

# Get queue statistics
curl http://localhost:5000/api/v1/stats

# Create test email job
curl -X POST -H 'Content-Type: application/json' \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello"}' \
  http://localhost:5000/api/v1/jobs/email

# Create notification job
curl -X POST -H 'Content-Type: application/json' \
  -d '{"userId":"user123","message":"Test notification","channel":"push"}' \
  http://localhost:5000/api/v1/jobs/notification

# Create processing job
curl -X POST -H 'Content-Type: application/json' \
  -d '{"data":{"operation":"test"},"priority":"medium"}' \
  http://localhost:5000/api/v1/jobs/processing

# List all jobs
curl http://localhost:5000/api/v1/jobs

# Get specific job details
curl http://localhost:5000/api/v1/jobs/1

# Get job logs
curl http://localhost:5000/api/v1/jobs/1/logs
```

## Alternative Usage with Bun

Since this project uses Bun, you can also run commands directly with Bun:

```bash
# Use bun instead of npm
bun run dev
bun run build
bun run start
bun test
```

## Environment Setup

1. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Redis configuration

3. Start development:
   ```bash
   npm run dev
   ```

4. Open dashboard: http://localhost:5000/dashboard

## Production Deployment

```bash
# Build production bundle
npm run build

# Set production environment
cp .env.example .env.production
# Edit .env.production with production values

# Start production server
NODE_ENV=production npm run start
```

## Troubleshooting

- **Port 5000 in use**: Change PORT in .env file
- **Redis connection failed**: Update REDIS_* variables in .env
- **Build fails**: Run `npm run clean` then `npm run build`
- **Missing dependencies**: Run `npm install`
