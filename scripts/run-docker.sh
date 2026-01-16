#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Mellon Harmony with Docker Compose...${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        echo -e "${YELLOW}Error: docker-compose is not installed${NC}"
        exit 1
    fi
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Build and start services
$COMPOSE_CMD up --build -d

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Services are starting!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend API: ${BLUE}http://localhost:8080${NC}"
echo -e "Frontend:   ${BLUE}http://localhost:3000${NC}"
echo -e "PostgreSQL: ${BLUE}localhost:5432${NC}"
echo ""
echo -e "${YELLOW}To view logs: docker-compose logs -f${NC}"
echo -e "${YELLOW}To stop: docker-compose down${NC}"
