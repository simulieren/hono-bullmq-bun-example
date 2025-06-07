# Development Commands

This project provides npm-style commands through multiple interfaces for your convenience.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
./run dev
# or
make dev

# Build for production
./run build
# or
make build

# Start production server
./run start
# or
make start
```

## Available Commands

### Core Development

| Command | Script | Makefile | Description |
|---------|--------|----------|-------------|
| `./run dev` | `make dev` | `bun run --watch src/index.ts` | Start development server with hot reload |
| `./run build` | `make build` | `bun build src/index.ts --outdir dist --target bun --minify` | Build optimized production bundle |
| `./run start` | `make start` | `cd dist && bun run index.js` | Start production server |
| `./run test` | `make test` | `bun test` | Run test suite |
| `./run install` | `make install` | `bun install` | Install dependencies |
| `./run clean` | `make clean` | Remove build artifacts and cache | Clean workspace |

### Monitoring & Testing

| Command | Description |
|---------|-------------|
| `./run health` | Check server health status |
| `./run stats` | Display queue statistics |
| `./run dashboard` | Show dashboard URL |
| `make test-jobs` | Create sample test jobs |

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

## npm-style Usage

If you prefer npm-style commands, you can create aliases:

```bash
# Add to your ~/.bashrc or ~/.zshrc
alias npm="./run"

# Then use:
npm run dev
npm run build
npm run start
npm run test
```

## Environment Setup

1. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Redis configuration

3. Start development:
   ```bash
   ./run dev
   ```

4. Open dashboard: http://localhost:5000/dashboard

## Production Deployment

```bash
# Build production bundle
./run build

# Set production environment
cp .env.example .env.production
# Edit .env.production with production values

# Start production server
NODE_ENV=production ./run start
```

## Troubleshooting

- **Port 5000 in use**: Change PORT in .env file
- **Redis connection failed**: Update REDIS_* variables in .env
- **Build fails**: Run `./run clean` then `./run build`
- **Missing dependencies**: Run `./run install`