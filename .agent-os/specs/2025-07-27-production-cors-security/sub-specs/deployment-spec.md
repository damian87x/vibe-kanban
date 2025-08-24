# Deployment Specification: Production CORS Security Configuration

> Spec: Production CORS Security Configuration
> Sub-spec: Deployment Strategy
> Created: 2025-07-27

## Overview

This deployment specification outlines the step-by-step process for safely implementing the CORS security configuration across all environments, ensuring zero downtime and quick rollback capabilities.

## Deployment Strategy

### Phase 1: Development Environment (Day 1)

#### Implementation Steps
1. **Deploy CORS Configuration Code**
   ```bash
   # Create feature branch
   git checkout -b feat/cors-security-config
   
   # Implement CORS configuration files
   # - backend/config/cors-config.ts
   # - Update backend/hono.ts
   # - Add environment validation
   
   # Commit changes
   git add .
   git commit -m "feat: implement production CORS security configuration"
   git push origin feat/cors-security-config
   ```

2. **Test in Development**
   ```bash
   # Set development environment
   export NODE_ENV=development
   export CORS_DEV_ORIGINS="https://test.ngrok.io"
   
   # Start services
   npm run start:backend &
   npm run start-web &
   
   # Verify CORS functionality
   npm run test:cors:integration
   ```

3. **Verify Development Flexibility**
   - Test localhost origins work
   - Test ngrok tunnels are allowed
   - Test custom development origins
   - Verify no legitimate requests blocked

#### Environment Variables (Development)
```bash
NODE_ENV=development
CORS_DEV_ORIGINS=https://abc123.ngrok.io,http://192.168.1.100:8081
# CORS_ALLOWED_ORIGINS not required in development
```

### Phase 2: Staging Environment (Day 2-3)

#### Pre-Deployment Setup
1. **Configure Staging Environment Variables**
   ```bash
   # Google Cloud Secret Manager
   gcloud secrets create cors-allowed-origins-staging \
     --data-file=- <<< "https://staging.taskpilot.com,https://staging-app.taskpilot.com"
   
   # Update Cloud Run service
   gcloud run services update taskpilot-backend-staging \
     --region=europe-west1 \
     --set-env-vars=NODE_ENV=staging \
     --set-secrets=CORS_ALLOWED_ORIGINS=cors-allowed-origins-staging:latest
   ```

2. **Deploy to Staging**
   ```bash
   # Merge to staging branch
   git checkout staging
   git merge feat/cors-security-config
   git push origin staging
   
   # Wait for automatic deployment via Cloud Build
   # Monitor deployment logs
   gcloud run services logs read taskpilot-backend-staging --region=europe-west1
   ```

#### Staging Validation
1. **Functional Testing**
   ```bash
   # Test staging frontend integration
   curl -H "Origin: https://staging.taskpilot.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://staging-api.taskpilot.com/api/test
   
   # Expected: 200 OK with CORS headers
   ```

2. **Security Testing**
   ```bash
   # Test unauthorized origin blocking
   curl -H "Origin: https://malicious-site.com" \
        -X OPTIONS \
        https://staging-api.taskpilot.com/api/test
   
   # Expected: 403 Forbidden
   ```

3. **E2E Testing**
   ```bash
   # Run full E2E test suite against staging
   STAGING_URL=https://staging.taskpilot.com npm run test:e2e:staging
   ```

#### Environment Variables (Staging)
```bash
NODE_ENV=staging
CORS_ALLOWED_ORIGINS=https://staging.taskpilot.com,https://staging-app.taskpilot.com
# Allows both staging domains and development origins for testing
```

### Phase 3: Production Deployment (Day 4-5)

#### Pre-Production Checklist
- [ ] All staging tests passing
- [ ] Performance impact validated (< 5ms overhead)
- [ ] Security tests confirm blocking unauthorized origins
- [ ] Rollback plan prepared and tested
- [ ] Monitoring alerts configured

#### Production Environment Setup
1. **Configure Production Secrets**
   ```bash
   # Create production CORS origins secret
   gcloud secrets create cors-allowed-origins-production \
     --data-file=- <<< "https://taskpilot.com,https://www.taskpilot.com,https://app.taskpilot.com"
   
   # Update production service configuration
   gcloud run services update taskpilot-backend-production \
     --region=europe-west1 \
     --set-env-vars=NODE_ENV=production \
     --set-secrets=CORS_ALLOWED_ORIGINS=cors-allowed-origins-production:latest
   ```

2. **Blue-Green Deployment Strategy**
   ```bash
   # Deploy new version to secondary revision
   gcloud run deploy taskpilot-backend-production \
     --image=gcr.io/taskpilot/backend:v2.1.0-cors-security \
     --region=europe-west1 \
     --no-traffic \
     --tag=cors-security
   
   # Test new revision with limited traffic
   gcloud run services update-traffic taskpilot-backend-production \
     --to-revisions=cors-security=10 \
     --region=europe-west1
   ```

3. **Gradual Traffic Migration**
   ```bash
   # 10% traffic for 1 hour
   # Monitor for errors, performance issues
   
   # If successful, increase to 50%
   gcloud run services update-traffic taskpilot-backend-production \
     --to-revisions=cors-security=50 \
     --region=europe-west1
   
   # If successful, migrate 100%
   gcloud run services update-traffic taskpilot-backend-production \
     --to-revisions=cors-security=100 \
     --region=europe-west1
   ```

#### Environment Variables (Production)
```bash
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://taskpilot.com,https://www.taskpilot.com,https://app.taskpilot.com
# Only production domains allowed, no development origins
```

## Monitoring and Validation

### Real-Time Monitoring
1. **Application Metrics**
   ```bash
   # Monitor API response times
   gcloud logging read "resource.type=cloud_run_revision AND severity>=WARNING" \
     --project=taskpilot --format="table(timestamp,textPayload)"
   
   # Monitor CORS violations
   gcloud logging read "textPayload:\"Blocked CORS request\"" \
     --project=taskpilot --since=1h
   ```

2. **Performance Monitoring**
   ```bash
   # Track response time increase
   # Set alert if P95 latency > 200ms increase
   # Set alert if error rate > 1%
   ```

3. **Security Monitoring**
   ```bash
   # Monitor for repeated CORS violations from same origin
   # Alert on > 10 violations per minute from single origin
   # Track unauthorized access attempts
   ```

### Validation Scripts
```bash
# scripts/validate-cors-deployment.sh
#!/bin/bash

API_BASE_URL=$1
TEST_ORIGINS=(
  "https://taskpilot.com"
  "https://www.taskpilot.com"
  "https://app.taskpilot.com"
)

BLOCKED_ORIGINS=(
  "https://malicious-site.com"
  "http://taskpilot.com"
  "https://evil.com"
)

echo "Testing allowed origins..."
for origin in "${TEST_ORIGINS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: $origin" \
    -X OPTIONS \
    "$API_BASE_URL/api/test")
  
  if [ "$response" = "200" ]; then
    echo "✅ $origin: ALLOWED (correct)"
  else
    echo "❌ $origin: BLOCKED (incorrect - should be allowed)"
    exit 1
  fi
done

echo "Testing blocked origins..."
for origin in "${BLOCKED_ORIGINS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: $origin" \
    -X OPTIONS \
    "$API_BASE_URL/api/test")
  
  if [ "$response" = "403" ]; then
    echo "✅ $origin: BLOCKED (correct)"
  else
    echo "❌ $origin: ALLOWED (incorrect - should be blocked)"
    exit 1
  fi
done

echo "🎉 All CORS validation tests passed!"
```

## Rollback Procedures

### Emergency Rollback (< 5 minutes)
```bash
# Immediate rollback to previous revision
gcloud run services update-traffic taskpilot-backend-production \
  --to-revisions=PREVIOUS=100 \
  --region=europe-west1

# Or use temporary permissive CORS (emergency only)
gcloud run services update taskpilot-backend-production \
  --set-env-vars=CORS_EMERGENCY_PERMISSIVE=true \
  --region=europe-west1
```

### Gradual Rollback (Planned)
```bash
# Reduce traffic to new version
gcloud run services update-traffic taskpilot-backend-production \
  --to-revisions=cors-security=0,PREVIOUS=100 \
  --region=europe-west1

# Delete problematic revision
gcloud run revisions delete [REVISION_NAME] \
  --region=europe-west1
```

### Configuration Rollback
```bash
# Revert to previous CORS configuration
gcloud secrets versions access 1 --secret=cors-allowed-origins-production \
  | gcloud secrets create cors-allowed-origins-production-rollback --data-file=-

gcloud run services update taskpilot-backend-production \
  --set-secrets=CORS_ALLOWED_ORIGINS=cors-allowed-origins-production-rollback:latest \
  --region=europe-west1
```

## Post-Deployment Tasks

### Day 1 Post-Deployment
- [ ] Monitor application logs for CORS errors
- [ ] Verify all legitimate frontend requests working
- [ ] Check performance metrics (no degradation)
- [ ] Review security logs for blocked attempts

### Week 1 Post-Deployment
- [ ] Analyze CORS violation patterns
- [ ] Optimize allowed origins list if needed
- [ ] Update documentation with lessons learned
- [ ] Train team on new CORS configuration

### Month 1 Post-Deployment
- [ ] Review security incident logs
- [ ] Assess performance impact over time
- [ ] Plan for additional security enhancements
- [ ] Update disaster recovery procedures

## Environment-Specific Configuration

### Development
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  backend:
    environment:
      - NODE_ENV=development
      - CORS_DEV_ORIGINS=https://test.ngrok.io,http://192.168.1.100:8081
```

### Staging
```yaml
# Cloud Run configuration
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: taskpilot-backend-staging
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/secrets: CORS_ALLOWED_ORIGINS=cors-allowed-origins-staging:latest
    spec:
      containers:
      - image: gcr.io/taskpilot/backend:latest
        env:
        - name: NODE_ENV
          value: staging
```

### Production
```yaml
# Cloud Run configuration
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: taskpilot-backend-production
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/secrets: CORS_ALLOWED_ORIGINS=cors-allowed-origins-production:latest
    spec:
      containers:
      - image: gcr.io/taskpilot/backend:latest
        env:
        - name: NODE_ENV
          value: production
```

## Documentation Updates

### Required Documentation
1. **Deployment Guide Update**
   - Add CORS configuration section
   - Include environment variable requirements
   - Document validation procedures

2. **Operations Runbook**
   - CORS troubleshooting procedures
   - Common issues and solutions
   - Emergency response procedures

3. **Security Documentation**
   - CORS security controls
   - Monitoring and alerting setup
   - Incident response procedures

### Team Training
- Security team: Understanding CORS controls
- DevOps team: Deployment and rollback procedures  
- Development team: Local development setup changes
- Support team: Troubleshooting CORS issues