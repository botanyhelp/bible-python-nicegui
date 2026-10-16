# Single-container Dockerfile optimized for Google Cloud Run
# Python 3.11 slim base image for fast container cold-starts (< 2.5s)
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output for Cloud Logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files and local scripture data
COPY app.py .
COPY public/ ./public/

# Cloud Run defaults to port 8080 (configurable via $PORT env var)
EXPOSE 8080

# Healthcheck for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/ || exit 1

# Execute NiceGUI app
CMD ["python", "app.py"]
