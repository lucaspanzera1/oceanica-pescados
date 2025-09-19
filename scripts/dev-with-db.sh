#!/bin/bash

# Function to cleanup on exit
cleanup() {
    echo "Stopping database container..."
    docker-compose -f docs/bd/docker-compose.yml down
}

# Set up trap to call cleanup on script exit
trap cleanup EXIT

# Start the database container in detached mode
echo "Starting database container..."
docker-compose -f docs/bd/docker-compose.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run the development environment
echo "Starting development environment..."
pnpm run dev