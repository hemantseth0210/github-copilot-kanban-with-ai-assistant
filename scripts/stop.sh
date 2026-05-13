#!/bin/bash
# Stop all running containers for the project
cd "$(dirname "$0")/.."
docker-compose down
