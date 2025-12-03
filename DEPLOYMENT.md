# Deployment Guide - Google Cloud Run

## Prerequisites
1. Google Cloud account dengan billing enabled
2. Google Cloud SDK (gcloud) terinstall
3. Docker terinstall (untuk testing lokal)

## Setup Google Cloud

### 1. Install Google Cloud SDK
```bash
# Download dan install dari: https://cloud.google.com/sdk/docs/install
```

### 2. Login dan Setup Project
```bash
# Login ke Google Cloud
gcloud auth login

# Buat project baru atau gunakan existing
gcloud projects create [PROJECT_ID] --name="Anonymous Chat App"

# Set project
gcloud config set project [PROJECT_ID]

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Set Region (Jakarta)
```bash
gcloud config set run/region asia-southeast2
```

## Deployment Methods

### Method 1: Deploy Langsung (Recommended)

```bash
# Deploy ke Cloud Run
gcloud run deploy anonymous-chat-app \
  --source . \
  --region asia-southeast2 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="ADMIN_EMAIL=your-email@gmail.com,GMAIL_APP_PASSWORD=your-app-password,APP_NAME=Anonymous Chat"
```

### Method 2: Build Docker Manual

```bash
# 1. Build Docker image
docker build -t gcr.io/[PROJECT_ID]/anonymous-chat-app .

# 2. Configure Docker untuk GCR
gcloud auth configure-docker

# 3. Push ke Google Container Registry
docker push gcr.io/[PROJECT_ID]/anonymous-chat-app

# 4. Deploy ke Cloud Run
gcloud run deploy anonymous-chat-app \
  --image gcr.io/[PROJECT_ID]/anonymous-chat-app \
  --region asia-southeast2 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

### Method 3: Menggunakan Cloud Build (CI/CD)

```bash
# Deploy menggunakan cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

## Environment Variables

Setelah deploy, set environment variables:

```bash
gcloud run services update anonymous-chat-app \
  --region asia-southeast2 \
  --set-env-vars="ADMIN_EMAIL=your-email@gmail.com,GMAIL_APP_PASSWORD=your-app-password,APP_NAME=Anonymous Chat,PORT=8080"
```

Atau via Console:
1. Buka Cloud Run Console
2. Pilih service `anonymous-chat-app`
3. Klik "EDIT & DEPLOY NEW REVISION"
4. Tambahkan environment variables di tab "Variables & Secrets"

## Testing Lokal dengan Docker

```bash
# Build image
docker build -t anonymous-chat-app .

# Run container
docker run -p 8080:8080 \
  -e ADMIN_EMAIL=your-email@gmail.com \
  -e GMAIL_APP_PASSWORD=your-app-password \
  -e APP_NAME="Anonymous Chat" \
  -e PORT=8080 \
  anonymous-chat-app

# Test
# Buka browser: http://localhost:8080
```

## Monitoring & Logs

```bash
# View logs
gcloud run services logs read anonymous-chat-app \
  --region asia-southeast2 \
  --limit 50

# Follow logs (real-time)
gcloud run services logs tail anonymous-chat-app \
  --region asia-southeast2
```

## Update Deployment

```bash
# Setelah update code, deploy ulang
gcloud run deploy anonymous-chat-app \
  --source . \
  --region asia-southeast2
```

## Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service anonymous-chat-app \
  --domain your-domain.com \
  --region asia-southeast2
```

## Estimasi Biaya

Cloud Run menggunakan pricing model pay-per-use:
- **Request**: $0.40 per million requests
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Free tier**: 2 million requests/month

Untuk aplikasi dengan traffic rendah-medium, biaya bulanan ~$0-$10

## Troubleshooting

### Error: Port binding
- Pastikan aplikasi listen di port dari `process.env.PORT`
- Default Cloud Run: PORT=8080

### Error: Environment variables
- Set semua env vars yang diperlukan via gcloud atau console
- Jangan commit file .env ke git

### Error: Authentication
```bash
gcloud auth application-default login
```

### Error: Permissions
```bash
# Add IAM roles
gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="user:your-email@gmail.com" \
  --role="roles/run.admin"
```

## Useful Commands

```bash
# List services
gcloud run services list

# Describe service
gcloud run services describe anonymous-chat-app --region asia-southeast2

# Delete service
gcloud run services delete anonymous-chat-app --region asia-southeast2

# Get service URL
gcloud run services describe anonymous-chat-app \
  --region asia-southeast2 \
  --format='value(status.url)'
```

## Security Best Practices

1. **Gunakan Secret Manager** untuk credentials:
```bash
# Create secret
echo -n "your-app-password" | gcloud secrets create gmail-app-password --data-file=-

# Deploy dengan secret
gcloud run deploy anonymous-chat-app \
  --set-secrets="GMAIL_APP_PASSWORD=gmail-app-password:latest"
```

2. **Enable HTTPS** (automatic di Cloud Run)

3. **Set resource limits**:
```bash
gcloud run deploy anonymous-chat-app \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

## Support

Untuk issues atau pertanyaan:
- Cloud Run Docs: https://cloud.google.com/run/docs
- Pricing: https://cloud.google.com/run/pricing
