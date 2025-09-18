# Vitordo Deployment Guide

## Overview
This guide covers deployment options and configurations for the Vitordo application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 18+
- npm or yarn
- Git
- Docker (for containerized deployment)

### Required Environment Variables
```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production

# LLM API Keys (at least one required)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Environment Configuration

### 1. Environment Files
Create environment-specific configuration files:

```bash
# Development
.env.local

# Staging
.env.staging

# Production
.env.production
```

### 2. Environment Validation
The application automatically validates required environment variables on startup. Missing variables will cause the build to fail with descriptive error messages.

### 3. Security Best Practices
- Never commit API keys to version control
- Use environment-specific configurations
- Rotate API keys regularly
- Use secrets management in production

## Deployment Options

### 1. Vercel (Recommended)

#### Quick Deploy
```bash
npm run deploy:vercel
```

#### Manual Setup
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login and configure:
   ```bash
   vercel login
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard

#### Configuration
The `vercel.json` file includes:
- Security headers
- Caching strategies
- Function configurations
- Redirects and rewrites

### 2. Docker Deployment

#### Build Docker Image
```bash
npm run docker:build
```

#### Run Container
```bash
npm run docker:run
```

#### Docker Compose
```yaml
version: '3.8'
services:
  vitordo:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. Static Export (Optional)
For static hosting services:

```bash
# Add to next.config.ts
output: 'export'

# Build static files
npm run build
```

### 4. Self-Hosted

#### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "vitordo" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## CI/CD Pipeline

### GitHub Actions
The repository includes a complete CI/CD pipeline with:

#### Stages
1. **Code Quality**: ESLint, TypeScript, Prettier
2. **Security**: Dependency audit, security checks
3. **Testing**: Unit, integration, and E2E tests
4. **Build**: Production build with optimization
5. **Deploy**: Automatic deployment to staging/production

#### Configuration
- **Staging**: Deploys on `develop` branch
- **Production**: Deploys on `main` branch
- **Pull Requests**: Runs quality checks and tests

#### Required Secrets
```bash
# Vercel deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Manual Deployment
```bash
# Production build
npm run build:production

# Deploy to Vercel
npm run deploy:vercel

# Deploy with Docker
npm run deploy:docker
```

## Monitoring and Health Checks

### Health Check Endpoint
The application provides a comprehensive health check at `/api/health`:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "used": 45,
    "total": 128,
    "external": 12
  },
  "checks": {
    "database": { "status": "healthy", "responseTime": 5 },
    "cache": { "status": "healthy", "responseTime": 2 },
    "llm": { "status": "healthy", "providers": { "openai": "configured" } }
  }
}
```

### Performance Monitoring
- **Web Vitals**: Automatic tracking of Core Web Vitals
- **Error Tracking**: Global error handling and reporting
- **Custom Metrics**: API response times, user actions
- **Resource Monitoring**: Memory usage, response times

### Monitoring Integration
- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Built-in analytics and performance insights
- **Custom Monitoring**: Health checks and custom metrics

## Performance Optimization

### Build Optimizations
- **Bundle Analysis**: `npm run build:analyze`
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Next.js Image component
- **Compression**: Gzip/Brotli compression

### Runtime Optimizations
- **Caching**: Intelligent caching strategies
- **Lazy Loading**: Component and route lazy loading
- **Service Workers**: Offline functionality
- **CDN**: Static asset delivery via CDN

### Database Optimization
- **IndexedDB**: Client-side data persistence
- **Caching**: LLM response caching
- **Compression**: Data compression for storage

## Security Considerations

### Security Headers
Automatically configured security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### API Security
- Input validation and sanitization
- Rate limiting (recommended for production)
- CORS configuration
- API key protection

### Data Security
- Client-side data encryption
- Secure API key storage
- No sensitive data in client bundles

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

#### Environment Variable Issues
```bash
# Validate environment
node -e "require('./src/config/env').validateEnv()"
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Docker Issues
```bash
# Check Docker build
docker build --no-cache -t vitordo:debug .

# Debug container
docker run -it vitordo:debug sh
```

### Performance Issues
1. **Slow Build Times**: Enable Turbopack, check bundle size
2. **Runtime Performance**: Check Web Vitals, optimize images
3. **Memory Leaks**: Monitor memory usage, check for listeners

### Deployment Issues
1. **Vercel Timeouts**: Check function duration limits
2. **Environment Variables**: Verify all required variables are set
3. **API Limits**: Check LLM provider rate limits

## Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Docker Rollback
```bash
# Tag current version
docker tag vitordo:latest vitordo:backup

# Pull previous version
docker pull vitordo:previous
docker tag vitordo:previous vitordo:latest

# Restart container
docker-compose restart
```

### Manual Rollback
```bash
# Checkout previous version
git checkout [previous-commit]

# Rebuild and deploy
npm run build:production
npm run deploy
```

## Support and Maintenance

### Regular Tasks
- Monitor health check endpoints
- Review error logs and metrics
- Update dependencies regularly
- Rotate API keys periodically
- Review and update security headers

### Monitoring Dashboards
- Application health and performance
- Error rates and types
- User engagement metrics
- Infrastructure metrics

### Backup and Recovery
- Database backups (if applicable)
- Configuration backups
- Deployment rollback procedures
- Disaster recovery planning

For additional support, refer to the [API Documentation](./API.md) and [User Guide](./USER_GUIDE.md).