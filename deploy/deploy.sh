#!/bin/bash
# ==============================================================================
# Google Cloud Run Deployment Script: Cognitive Companion
# ==============================================================================
# This script demonstrates building the multi-stage Docker container and
# deploying it securely to Google Cloud Run using GCP Secret Manager.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration variables
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="cognitive-companion"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "========================================="
echo "🚀 Starting Production Build & Deploy Pipeline"
echo "========================================="

# 1. Authenticate with Google Cloud (if not already logged in)
# gcloud auth login

# 2. Configure Docker to authenticate with Google Container Registry
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker --quiet

# 3. Build container using the deploy/Dockerfile
echo "📦 Building production container image..."
docker build -t ${IMAGE_TAG} -f deploy/Dockerfile .

# 4. Push the container image to Google Container Registry
echo "📤 Pushing image to registry..."
docker push ${IMAGE_TAG}

# 5. Deploy to Google Cloud Run
# Note: GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_KEY are referenced securely
# from GCP Secret Manager (e.g. gemini-api-key:latest) to avoid exposure.
echo "🌐 Deploying to Google Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_TAG} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --port 3000 \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest"

echo "========================================="
echo "🎉 Deployment Complete!"
echo "Service URL: \$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --project ${PROJECT_ID} --format='value(status.url)')"
echo "========================================="
