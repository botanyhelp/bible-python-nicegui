#!/usr/bin/env bash
# ScriptureVault - One-click Google Cloud Run deployment script

set -euo pipefail

SERVICE_NAME="${1:-scripture-vault}"
REGION="${2:-us-central1}"
PROJECT_ID="${3:-$(gcloud config get-value project 2>/dev/null || echo '')}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No active GCP project configured. Run 'gcloud config set project YOUR_PROJECT_ID' first."
  exit 1
fi

echo "Deploying ScriptureVault to Google Cloud Run..."
echo "  Project:  $PROJECT_ID"
echo "  Service:  $SERVICE_NAME"
echo "  Region:   $REGION"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080 \
  --timeout 300

echo "Deployment complete! Your single-container NiceGUI app is live on Cloud Run."
