# Production Deployment & Setup Guide

This guide details the steps to build, configure, run, and deploy the "Cognitive Companion" CBT journaling assistant to Google Cloud Run or run it locally using Docker.

---

## 📋 System Prerequisites

Before proceeding, ensure you have the following tools installed and configured:
- **Docker Engine:** 24.x+ or Docker Desktop
- **Google Cloud SDK (gcloud):** Configured and authenticated to your GCP Billing Account
- **GCP Project:** Active project with Secret Manager and Cloud Run APIs enabled

---

## 🛠️ Step 1: Local Container Execution

You can build and test the production container locally before deploying:

1. **Create local `.env` file** with production credentials:
   ```env
   GEMINI_API_KEY=AIzaSy...
   SUPABASE_URL=https://your-supabase.supabase.co
   SUPABASE_KEY=eyJhbGciOi...
   ```

2. **Build the container:**
   ```bash
   docker build -t cbt-companion -f deploy/Dockerfile .
   ```

3. **Run the container:**
   ```bash
   docker run -d -p 3000:3000 --env-file .env cbt-companion
   ```

4. **Verify it is running:**
   Visit `http://localhost:3000` or check the health check endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 🌐 Step 2: Google Cloud Run Deployment

To deploy to Cloud Run securely, we utilize **GCP Secret Manager** to mount sensitive API keys. This protects credentials from being visible in environment variables.

### A. Store secrets in GCP Secret Manager:
```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
gcloud secrets create gemini-api-key --data-file=- <<< "your-gemini-key"
gcloud secrets create supabase-url --data-file=- <<< "your-supabase-url"
gcloud secrets create supabase-key --data-file=- <<< "your-supabase-anon-key"
```

### B. Execute deployment:
Ensure `deploy/deploy.sh` is executable, configure your Project ID, and run:
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

---

## 🧪 Step 3: Health and Liveness Verification

The application exposes a native JSON health endpoint `/api/health` used by Cloud Run probes to monitor service health.

To inspect the status of your deployed instance:
```bash
curl -X GET https://your-cloud-run-service-url.run.app/api/health
```

Expected Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-04T15:30:00.000Z"
}
```
---
*Note: Any continuous deployment tool (GitHub Actions, Cloud Build) can be configured using these instructions.*
