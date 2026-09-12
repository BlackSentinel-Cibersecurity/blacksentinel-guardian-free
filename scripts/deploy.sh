#!/bin/bash
set -e

echo "=== BlackSentinel Guardian - Deployment Script ==="
echo ""

# Colors
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check dependencies
check_deps() {
    echo "Checking dependencies..."
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required. Install it first.${NC}"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || COMPOSE_CMD="docker compose" || COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}All dependencies satisfied.${NC}"
}

# Build
build() {
    echo ""
    echo "Building frontend..."
    cd blacksentinel-guardian && npm ci && npm run build && cd ..
    
    echo ""
    echo "Building Docker images..."
    docker build -t blacksentinel/guardian-frontend:latest -f Dockerfile.frontend .
    docker build -t blacksentinel/guardian-api:latest ./backend
}

# Deploy local
deploy_local() {
    echo ""
    echo "Deploying locally with Docker Compose..."
    cd backend && $COMPOSE_CMD -f docker/docker-compose.yml up -d
    echo ""
    echo -e "${GREEN}Deployment complete!${NC}"
    echo "Frontend: http://localhost:3000"
    echo "API: http://localhost:3001"
    echo "Health: http://localhost:3001/api/health"
}

# Deploy Kubernetes
deploy_k8s() {
    echo ""
    echo "Deploying to Kubernetes..."
    kubectl apply -f k8s/deployment.yaml
    kubectl rollout restart deployment/blacksentinel-api -n blacksentinel
    kubectl rollout restart deployment/blacksentinel-frontend -n blacksentinel
    echo -e "${GREEN}Kubernetes deployment complete!${NC}"
}

# Main
check_deps

case "${1:-local}" in
    local)
        build
        deploy_local
        ;;
    k8s|kubernetes)
        build
        deploy_k8s
        ;;
    build)
        build
        ;;
    *)
        echo "Usage: $0 {local|k8s|build}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}BlackSentinel Guardian is now running!${NC}"
