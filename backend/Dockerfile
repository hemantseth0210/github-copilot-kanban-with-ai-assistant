# Dockerfile for FastAPI backend with static frontend build
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps
COPY frontend ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install uv (Python package manager)
RUN pip install --no-cache-dir uv

# Install backend dependencies using uv into the system environment
RUN uv pip install --system fastapi uvicorn

# Copy backend code
COPY backend/ ./

# Copy exported frontend static files into backend image
COPY --from=frontend-builder /frontend/out ./static

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
