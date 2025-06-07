# Hono Job Queue Server - Development Commands
.PHONY: dev build start test clean health stats dashboard install

# Development server with hot reload
dev:
	bun run --watch src/index.ts

# Build for production
build:
	@echo "Building application..."
	@mkdir -p dist
	@bun build src/index.ts --outdir dist --target bun --minify
	@echo "Build completed: dist/index.js"

# Start production server
start:
	@echo "Starting production server..."
	@cd dist && bun run index.js

# Run tests
test:
	bun test

# Install dependencies
install:
	bun install

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist node_modules/.cache .bun-cache
	@echo "Clean completed"

# Check server health
health:
	@curl -s http://localhost:5000/api/v1/health | jq '.' || echo "Server not running or jq not installed"

# Show queue statistics
stats:
	@curl -s http://localhost:5000/api/v1/stats | jq '.' || echo "Server not running or jq not installed"

# Open dashboard
dashboard:
	@echo "Dashboard: http://localhost:5000/dashboard"
	@command -v open >/dev/null 2>&1 && open http://localhost:5000/dashboard || \
	 command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:5000/dashboard || \
	 echo "Please open http://localhost:5000/dashboard in your browser"

# Create test jobs
test-jobs:
	@echo "Creating test email job..."
	@curl -s -X POST -H 'Content-Type: application/json' \
		-d '{"to":"test@example.com","subject":"Test Email","body":"Test from Makefile"}' \
		http://localhost:5000/api/v1/jobs/email | jq '.'
	@echo "Creating test notification..."
	@curl -s -X POST -H 'Content-Type: application/json' \
		-d '{"userId":"user123","message":"Test notification","channel":"push"}' \
		http://localhost:5000/api/v1/jobs/notification | jq '.'

# Show help
help:
	@echo "Available commands:"
	@echo "  make dev        - Start development server with hot reload"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo "  make test       - Run tests"
	@echo "  make install    - Install dependencies"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make health     - Check server health"
	@echo "  make stats      - Show queue statistics"
	@echo "  make dashboard  - Open dashboard in browser"
	@echo "  make test-jobs  - Create test jobs"
	@echo "  make help       - Show this help message"