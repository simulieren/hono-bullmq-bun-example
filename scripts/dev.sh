#!/bin/bash
# Development scripts for Hono Job Queue Server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if server is running
check_server() {
    if curl -s http://localhost:5000/api/v1/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to show help
show_help() {
    print_header "Hono Job Queue Server - Development Scripts"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start          Start the development server"
    echo "  build          Build the application"
    echo "  test           Run tests"
    echo "  health         Check server health"
    echo "  stats          Show queue statistics"
    echo "  dashboard      Open dashboard in browser"
    echo "  create-job     Create test jobs"
    echo "  monitor        Monitor the application"
    echo "  clean          Clean build artifacts"
    echo "  setup          Initial setup for development"
    echo "  help           Show this help message"
    echo ""
}

# Start development server
start_dev() {
    print_header "Starting Development Server"
    print_status "Starting Hono server with Bun..."
    bun run --watch src/index.ts
}

# Build application
build_app() {
    print_header "Building Application"
    print_status "Building with Bun..."
    mkdir -p dist
    bun build src/index.ts --outdir dist --target bun
    print_status "Build completed successfully!"
}

# Check health
check_health() {
    print_header "Health Check"
    
    if ! check_server; then
        print_error "Server is not running. Please start it first with: $0 start"
        exit 1
    fi
    
    print_status "Checking server health..."
    curl -s http://localhost:5000/api/v1/health | jq '.'
}

# Show statistics
show_stats() {
    print_header "Queue Statistics"
    
    if ! check_server; then
        print_error "Server is not running. Please start it first with: $0 start"
        exit 1
    fi
    
    print_status "Fetching queue statistics..."
    curl -s http://localhost:5000/api/v1/stats | jq '.'
}

# Open dashboard
open_dashboard() {
    print_header "Opening Dashboard"
    
    if ! check_server; then
        print_error "Server is not running. Please start it first with: $0 start"
        exit 1
    fi
    
    print_status "Dashboard available at: http://localhost:5000/dashboard"
    
    # Try to open in browser (works on most systems)
    if command -v open > /dev/null 2>&1; then
        open http://localhost:5000/dashboard
    elif command -v xdg-open > /dev/null 2>&1; then
        xdg-open http://localhost:5000/dashboard
    else
        print_status "Please open http://localhost:5000/dashboard in your browser"
    fi
}

# Create test jobs
create_test_jobs() {
    print_header "Creating Test Jobs"
    
    if ! check_server; then
        print_error "Server is not running. Please start it first with: $0 start"
        exit 1
    fi
    
    print_status "Creating email job..."
    curl -X POST -H 'Content-Type: application/json' \
         -d '{"to":"test@example.com","subject":"Test Email","body":"This is a test email from the development script"}' \
         http://localhost:5000/api/v1/jobs/email | jq '.'
    
    echo ""
    print_status "Creating notification job..."
    curl -X POST -H 'Content-Type: application/json' \
         -d '{"userId":"user123","message":"Test notification from dev script","channel":"push"}' \
         http://localhost:5000/api/v1/jobs/notification | jq '.'
    
    echo ""
    print_status "Creating processing job..."
    curl -X POST -H 'Content-Type: application/json' \
         -d '{"data":{"operation":"data-analysis","params":{"dataset":"users","metric":"retention"}},"priority":"medium"}' \
         http://localhost:5000/api/v1/jobs/processing | jq '.'
}

# Monitor application
monitor_app() {
    print_header "Monitoring Application"
    
    if ! check_server; then
        print_error "Server is not running. Please start it first with: $0 start"
        exit 1
    fi
    
    print_status "Current server status:"
    check_health
    
    echo ""
    print_status "Queue statistics:"
    show_stats
    
    echo ""
    print_status "Recent jobs:"
    curl -s "http://localhost:5000/api/v1/jobs?limit=5" | jq '.data.jobs'
}

# Clean build artifacts
clean_build() {
    print_header "Cleaning Build Artifacts"
    print_status "Removing dist directory..."
    rm -rf dist
    print_status "Removing cache files..."
    rm -rf node_modules/.cache .bun-cache
    print_status "Clean completed!"
}

# Setup development environment
setup_dev() {
    print_header "Development Environment Setup"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Copying .env.example to .env..."
            cp .env.example .env
        else
            print_status "Creating .env file..."
            cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
QUEUE_CONCURRENCY_EMAIL=5
QUEUE_CONCURRENCY_PROCESSING=2
QUEUE_CONCURRENCY_NOTIFICATION=5
LOG_LEVEL=info
EOF
        fi
        print_warning "Please update .env with your Redis configuration"
    fi
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        bun install
    fi
    
    print_status "Setup complete! Run: $0 start"
}

# Main script logic
case "${1:-help}" in
    "start") start_dev ;;
    "build") build_app ;;
    "test") bun test ;;
    "health") check_health ;;
    "stats") show_stats ;;
    "dashboard") open_dashboard ;;
    "create-job") create_test_jobs ;;
    "monitor") monitor_app ;;
    "clean") clean_build ;;
    "setup") setup_dev ;;
    "help"|*) show_help ;;
esac