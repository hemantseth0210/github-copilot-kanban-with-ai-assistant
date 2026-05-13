@echo off
REM Start the full stack (backend + frontend) using Docker Compose
cd /d "%~dp0\.."
docker compose up --build
