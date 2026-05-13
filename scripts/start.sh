#!/bin/bash
# Start the full stack (backend + frontend) using Docker Compose
cd "$(dirname "$0")/.."
docker-compose up --build
