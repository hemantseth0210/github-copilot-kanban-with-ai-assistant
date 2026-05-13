@echo off
REM Stop all running containers for the project
cd /d "%~dp0\.."
docker compose down
