# Dokploy Deployment Guide

This guide explains how to deploy the Claiss application to Dokploy using the provided Dockerfile.

## Prerequisites

- A Dokploy instance (self-hosted or managed)
- Access to your Dokploy dashboard
- Repository access (GitHub, GitLab, or Bitbucket)
- Required API keys and tokens (see Environment Variables section)

## Deployment Steps

### 1. Create a New Application in Dokploy

1. Log in to your Dokploy dashboard
2. Click on **"Create Application"** or **"New Project"**
3. Select **"Git Repository"** as the source
4. Connect your repository containing this project
5. Select the branch you want to deploy (e.g., `main` or `production`)

### 2. Configure Build Settings

In the Dokploy application settings:

- **Build Method**: Docker
- **Dockerfile Path**: `./Dockerfile` (default, already at root)
- **Build Context**: `.` (root directory)
- **Port**: `3000`

### 3. Configure Environment Variables

Add the following environment variables in Dokploy's environment configuration:

#### Required Variables

```bash
# Google AI API Key (required for AI-powered scene generation)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here

# Modal.com Token (required for Manim video compilation)
MODAL_TOKEN_SECRET=your_modal_token_here

# Vercel Blob Storage Token (required for video storage)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

#### Optional Variables

```bash
# Context7 API Key (optional - for enhanced documentation context)
CONTEXT7=your_context7_key_here

# Modal Configuration (optional, defaults to true)
MODAL_FALLBACK_TO_LOCAL=false
USE_MODAL_COMPILATION=true
```

#### System Variables (Automatically Set)

These are typically set automatically by Dokploy, but you can override if needed:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

### 4. Deploy

1. Click **"Deploy"** or **"Build & Deploy"**
2. Monitor the build logs for any errors
3. Wait for the deployment to complete
4. Access your application at the provided URL

## Build Process

The Dockerfile uses a multi-stage build process for optimization:

### Stage 1: Dependencies
- Base: Node.js 20 Alpine
- Installs pnpm (v9.15.4)
- Installs all dependencies using `pnpm install --frozen-lockfile`

### Stage 2: Builder
- Copies dependencies from Stage 1
- Copies source code
- Builds the Next.js application with `pnpm build`
- Uses Next.js standalone output mode for smaller image size

### Stage 3: Runner
- Minimal production image
- Copies only necessary files (standalone build + static assets)
- Runs as non-root user (nextjs:nodejs) for security
- Exposes port 3000
- Starts the application with `node server.js`

## Configuration Details

### Next.js Configuration

The [`next.config.mjs`](next.config.mjs) includes:

```javascript
output: 'standalone'  // Required for Docker deployment
```

This enables Next.js to produce a minimal standalone build that includes only necessary dependencies.

### Port Configuration

- **Internal Port**: 3000 (default Next.js port)
- **External Port**: Configured by Dokploy (typically 80/443 with reverse proxy)

## Health Checks

Dokploy will automatically configure health checks. The application responds on:

- **Health Endpoint**: `http://localhost:3000/` (default Next.js page)
- **API Health**: `http://localhost:3000/api/` (if configured)

## Security Best Practices

✅ **Environment Variables**: All sensitive data is injected via Dokploy's environment management
✅ **No Hardcoded Secrets**: The Dockerfile contains no hardcoded credentials
✅ **Non-Root User**: Application runs as user `nextjs` (UID 1001)
✅ **Minimal Image**: Uses Alpine Linux for reduced attack surface
✅ **Immutable Deployments**: Each deployment creates a new container

## Troubleshooting

### Build Failures

**Issue**: `pnpm: command not found`
- **Solution**: The Dockerfile includes `corepack enable` to install pnpm. Ensure Docker build is not cached incorrectly.

**Issue**: `Cannot find module` errors during build
- **Solution**: Clear the build cache in Dokploy and rebuild. Verify `pnpm-lock.yaml` is present in the repository.

**Issue**: Build timeout
- **Solution**: Increase build timeout in Dokploy settings (recommended: 15-20 minutes for first build)

### Runtime Errors

**Issue**: Application fails to start
- **Solution**: Check environment variables are correctly set. Verify required variables (`GOOGLE_GENERATIVE_AI_API_KEY`, `MODAL_TOKEN_SECRET`, `BLOB_READ_WRITE_TOKEN`) are present.

**Issue**: Port binding errors
- **Solution**: Ensure no other service is using port 3000. Dokploy should handle port mapping automatically.

**Issue**: API endpoints return 500 errors
- **Solution**: Check application logs in Dokploy dashboard. Verify external service credentials (Modal, Vercel Blob, Google AI) are valid.

### Performance Issues

**Issue**: Slow cold starts
- **Solution**: The standalone build is optimized for fast startup. If issues persist, consider:
  - Increasing allocated CPU/memory in Dokploy
  - Pre-warming by setting a health check endpoint

**Issue**: High memory usage
- **Solution**: Monitor memory in Dokploy dashboard. Next.js standalone builds are memory-efficient, but you can adjust `NODE_OPTIONS` if needed:
  ```bash
  NODE_OPTIONS=--max-old-space-size=2048
  ```

## Rollback Strategy

Dokploy provides automatic rollback capabilities:

1. Navigate to your application in Dokploy dashboard
2. Go to **"Deployments"** or **"History"** tab
3. Select a previous successful deployment
4. Click **"Rollback"** or **"Redeploy"**

## Monitoring and Logs

### Access Logs

In Dokploy dashboard:
1. Navigate to your application
2. Click **"Logs"** or **"Console"** tab
3. View real-time logs or historical logs

### Log Levels

The application logs at different levels:
- **Info**: General application events
- **Warn**: Non-critical issues
- **Error**: Critical failures requiring attention

### Metrics

Monitor in Dokploy:
- **CPU Usage**: Should stay under 70% during normal operation
- **Memory Usage**: Typically 150-300MB for standalone Next.js
- **Request Rate**: Monitor API endpoint performance
- **Response Times**: Target <200ms for most endpoints

## Scaling

### Horizontal Scaling

Dokploy supports horizontal scaling:
1. Navigate to application settings
2. Adjust **"Replicas"** or **"Instances"**
3. Recommended: 2-3 replicas for production

### Vertical Scaling

Adjust resources per container:
- **CPU**: Minimum 0.5 cores, recommended 1-2 cores
- **Memory**: Minimum 512MB, recommended 1-2GB

## CI/CD Integration

Dokploy automatically deploys on git push:

1. **Auto-Deploy**: Enable in Dokploy settings
2. **Branch**: Configure which branch triggers deployment
3. **Build Triggers**: Push to main/production branch → automatic build & deploy

### Manual Deployment

You can also trigger deployments manually:
1. Go to Dokploy dashboard
2. Select your application
3. Click **"Deploy"** or **"Rebuild"**

## Domain Configuration

### Custom Domain Setup

1. In Dokploy, navigate to your application
2. Go to **"Domains"** or **"Settings"**
3. Add your custom domain (e.g., `app.yourdomain.com`)
4. Configure DNS records as instructed by Dokploy:
   - **A Record**: Point to Dokploy server IP
   - **CNAME**: Or point to Dokploy domain

### SSL/TLS Configuration

Dokploy automatically provisions SSL certificates via Let's Encrypt:
- Enable **"Auto SSL"** in domain settings
- Certificates renew automatically
- Force HTTPS redirect recommended

## Backup and Recovery

### Data Persistence

This application is stateless. Data is stored in:
- **Vercel Blob**: Video files and media
- **External APIs**: Modal, Google AI

Ensure these services have proper backup strategies.

### Configuration Backup

Export environment variables from Dokploy regularly:
1. Navigate to application settings
2. Export environment configuration
3. Store securely (e.g., in secrets manager)

## Support and Resources

- **Dokploy Documentation**: [https://docs.dokploy.com](https://docs.dokploy.com)
- **Next.js Deployment**: [https://nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Project Issues**: [GitHub Issues](https://github.com/HoltzTomas/classia-frontend/issues)

## Quick Reference

### Build Command (Local Testing)

```bash
# Build the Docker image locally
docker build -t claiss:latest .

# Run locally with environment variables
docker run -p 3000:3000 \
  -e GOOGLE_GENERATIVE_AI_API_KEY=your_key \
  -e MODAL_TOKEN_SECRET=your_token \
  -e BLOB_READ_WRITE_TOKEN=your_blob_token \
  claiss:latest

# Access at http://localhost:3000
```

### Environment Variables Template

Copy this template to Dokploy environment settings:

```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY=
MODAL_TOKEN_SECRET=
BLOB_READ_WRITE_TOKEN=

# Optional
CONTEXT7=
MODAL_FALLBACK_TO_LOCAL=false
USE_MODAL_COMPILATION=true

# System (usually auto-set)
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

## Post-Deployment Checklist

- [ ] Application is accessible via provided URL
- [ ] All environment variables are set correctly
- [ ] API endpoints respond correctly (test video generation)
- [ ] SSL certificate is active (if using custom domain)
- [ ] Health checks are passing
- [ ] Logs show no critical errors
- [ ] Monitor CPU/memory usage for first 24 hours
- [ ] Set up alerts for errors/downtime
- [ ] Document deployment date and version
- [ ] Test rollback procedure

---

**Last Updated**: 2025-11-19  
**Deployment Target**: Dokploy with Docker  
**Application**: Claiss - AI Educational Video Generator