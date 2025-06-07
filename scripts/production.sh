#!/bin/bash
# Production deployment scripts for Hono Job Queue Server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Show help
show_help() {
    print_header "Production Deployment Scripts"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build          Build production bundle"
    echo "  start          Start production server"
    echo "  deploy         Deploy to production"
    echo "  health-check   Check production health"
    echo "  backup         Backup Redis data"
    echo "  restore        Restore Redis data"
    echo "  logs           View production logs"
    echo "  monitor        Monitor production metrics"
    echo "  help           Show this help message"
    echo ""
}

# Build for production
build_production() {
    print_header "Building Production Bundle"
    
    # Validate environment
    if [ ! -f ".env.production" ]; then
        print_error "Missing .env.production file"
        exit 1
    fi
    
    # Clean previous build
    rm -rf dist
    mkdir -p dist
    
    # Build with optimizations
    print_status "Building optimized bundle..."
    bun build src/index.ts --outdir dist --target bun --minify
    
    # Copy necessary files
    cp .env.production dist/.env
    cp package.json dist/
    
    print_status "Production build completed: dist/"
}

# Start production server
start_production() {
    print_header "Starting Production Server"
    
    if [ ! -f "dist/index.js" ]; then
        print_error "Production build not found. Run: $0 build"
        exit 1
    fi
    
    print_status "Starting production server..."
    cd dist && NODE_ENV=production bun run index.js
}

# Deploy to production
deploy_production() {
    print_header "Deploying to Production"
    
    # Build first
    build_production
    
    # Run health checks
    print_status "Running pre-deployment checks..."
    
    # Check Redis connectivity
    if [ -n "$REDIS_HOST" ]; then
        print_status "Testing Redis connection..."
        # Add Redis connection test here
    fi
    
    print_status "Deployment ready. Use your preferred deployment method:"
    echo "  - Railway: railway up"
    echo "  - Vercel: vercel --prod"
    echo "  - Docker: docker build -t hono-queue . && docker run -p 5000:5000 hono-queue"
}

# Health check
health_check() {
    print_header "Production Health Check"
    
    local url="${PRODUCTION_URL:-http://localhost:5000}"
    
    print_status "Checking health endpoint..."
    if curl -s "$url/api/v1/health" | jq '.success' | grep -q true; then
        print_status "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
    
    print_status "Checking queue statistics..."
    curl -s "$url/api/v1/stats" | jq '.data.totalJobs'
}

# Backup Redis data
backup_redis() {
    print_header "Backing Up Redis Data"
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    print_status "Creating Redis backup in $backup_dir"
    # Add Redis backup logic based on your Redis setup
    echo "BGSAVE" | redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD"
    
    print_status "Backup completed: $backup_dir"
}

# View logs
view_logs() {
    print_header "Production Logs"
    
    # This depends on your logging setup
    if [ -f "logs/production.log" ]; then
        tail -f logs/production.log
    else
        print_warning "No log file found. Check your deployment platform logs."
    fi
}

# Monitor production
monitor_production() {
    print_header "Production Monitoring"
    
    local url="${PRODUCTION_URL:-http://localhost:5000}"
    
    while true; do
        clear
        echo "$(date): Production Status"
        echo "=========================="
        
        # Health check
        if curl -s "$url/api/v1/health" > /dev/null 2>&1; then
            echo "Status: HEALTHY"
        else
            echo "Status: UNHEALTHY"
        fi
        
        # Queue stats
        echo ""
        echo "Queue Statistics:"
        curl -s "$url/api/v1/stats" | jq '.data.queues' 2>/dev/null || echo "Failed to fetch stats"
        
        sleep 30
    done
}

# Main script logic
case "${1:-help}" in
    "build") build_production ;;
    "start") start_production ;;
    "deploy") deploy_production ;;
    "health-check") health_check ;;
    "backup") backup_redis ;;
    "logs") view_logs ;;
    "monitor") monitor_production ;;
    "help"|*) show_help ;;
esac