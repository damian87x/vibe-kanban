# Technical Specification: Production CORS Security Configuration

> Spec: Production CORS Security Configuration
> Sub-spec: Technical Implementation
> Created: 2025-07-27

## Overview

This technical specification defines the implementation approach for replacing the current wildcard CORS configuration with environment-based domain restrictions, ensuring production security while maintaining development flexibility.

## Current State Analysis

### Security Vulnerability
- **Current Implementation**: `app.use("*", cors())` in `backend/hono.ts:12`
- **Risk**: Allows cross-origin requests from any domain
- **Impact**: Potential unauthorized API access from malicious websites

### Environment Context
- **Development**: Needs flexibility for localhost, ngrok tunnels, testing
- **Production**: Requires strict domain validation for security
- **Configuration**: Environment variables for dynamic domain management

## Implementation Approach

### 1. Environment-Based CORS Configuration

Create a CORS configuration service that adapts to the environment:

```typescript
// backend/config/cors-config.ts
interface CORSConfig {
  origin: string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

export function getCORSConfig(): CORSConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return getProductionCORSConfig();
    case 'staging':
      return getStagingCORSConfig();
    default:
      return getDevelopmentCORSConfig();
  }
}
```

### 2. Production CORS Configuration

Implement strict domain validation for production:

```typescript
function getProductionCORSConfig(): CORSConfig {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
  
  if (allowedOrigins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must be set in production');
  }

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
}
```

### 3. Development CORS Configuration

Maintain flexibility for development environments:

```typescript
function getDevelopmentCORSConfig(): CORSConfig {
  const defaultOrigins = [
    'http://localhost:8081',
    'http://localhost:3000',
    'http://127.0.0.1:8081',
    'exp://localhost:8081'
  ];

  // Allow custom development origins
  const customOrigins = process.env.CORS_DEV_ORIGINS?.split(',') || [];
  const allOrigins = [...defaultOrigins, ...customOrigins];

  return {
    origin: allOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
}
```

### 4. Dynamic Origin Validation

Implement pattern-based origin validation for ngrok and dynamic domains:

```typescript
function validateOrigin(origin: string, allowedPatterns: string[]): boolean {
  // Direct match
  if (allowedPatterns.includes(origin)) {
    return true;
  }

  // Pattern matching for ngrok tunnels in development
  if (process.env.NODE_ENV !== 'production') {
    const ngrokPattern = /^https:\/\/[a-z0-9-]+\.ngrok\.io$/;
    if (ngrokPattern.test(origin)) {
      return true;
    }
  }

  // Custom pattern validation
  for (const pattern of allowedPatterns) {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}
```

## Environment Variables

### Required for Production
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed domains
  - Example: `https://taskpilot.com,https://www.taskpilot.com,https://app.taskpilot.com`

### Optional for Development
- `CORS_DEV_ORIGINS`: Additional development origins
  - Example: `http://localhost:3001,https://abc123.ngrok.io`

### Configuration Validation
```typescript
export function validateCORSConfig(): void {
  const environment = process.env.NODE_ENV;
  
  if (environment === 'production' && !process.env.CORS_ALLOWED_ORIGINS) {
    throw new Error('CORS_ALLOWED_ORIGINS environment variable is required in production');
  }
}
```

## Integration Points

### 1. Hono.js Integration

Replace the current wildcard CORS with the configured middleware:

```typescript
// backend/hono.ts
import { cors } from 'hono/cors';
import { getCORSConfig, validateCORSConfig } from './config/cors-config';

// Validate CORS configuration on startup
validateCORSConfig();

const corsConfig = getCORSConfig();
app.use('*', cors(corsConfig));
```

### 2. Error Handling

Implement proper error responses for CORS violations:

```typescript
// Custom CORS error handler
const corsErrorHandler = (error: Error, c: Context) => {
  if (error.message.includes('CORS')) {
    return c.json({
      error: 'Cross-origin request not allowed',
      origin: c.req.header('origin'),
      allowedOrigins: process.env.NODE_ENV === 'development' 
        ? getCORSConfig().origin 
        : 'configured domains'
    }, 403);
  }
  throw error;
};
```

### 3. Logging and Monitoring

Add CORS request logging for security monitoring:

```typescript
const corsLogger = (origin: string, allowed: boolean) => {
  console.log(`CORS request from ${origin}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
  
  // In production, log blocked requests for security monitoring
  if (!allowed && process.env.NODE_ENV === 'production') {
    console.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
  }
};
```

## Testing Requirements

### 1. Unit Tests

Test CORS configuration logic:

```typescript
describe('CORS Configuration', () => {
  test('production mode restricts to allowed origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://example.com';
    
    const config = getCORSConfig();
    expect(config.origin).toEqual(['https://example.com']);
  });

  test('development mode allows localhost origins', () => {
    process.env.NODE_ENV = 'development';
    
    const config = getCORSConfig();
    expect(config.origin).toContain('http://localhost:8081');
  });
});
```

### 2. Integration Tests

Test actual CORS behavior with requests:

```typescript
describe('CORS Middleware', () => {
  test('allows requests from production domain', async () => {
    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'https://taskpilot.com')
      .expect(200);
      
    expect(response.headers['access-control-allow-origin']).toBe('https://taskpilot.com');
  });

  test('blocks requests from unauthorized domain in production', async () => {
    process.env.NODE_ENV = 'production';
    
    await request(app)
      .get('/api/test')
      .set('Origin', 'https://malicious-site.com')
      .expect(403);
  });
});
```

### 3. E2E Tests

Verify CORS behavior in browser environments:

```typescript
test('frontend can make authenticated requests', async ({ page }) => {
  // Test legitimate cross-origin requests work
  await page.goto('http://localhost:8081');
  
  const response = await page.evaluate(async () => {
    return fetch('http://localhost:3001/api/test', {
      credentials: 'include'
    });
  });
  
  expect(response.ok).toBe(true);
});
```

## Security Considerations

### 1. Strict Production Mode
- No wildcard origins in production
- Explicit domain allowlist only
- No pattern matching in production (except for legitimate subdomains)

### 2. Credential Handling
- `credentials: true` only for trusted origins
- Validate credentials are properly handled with restricted origins

### 3. Monitoring
- Log all CORS violations in production
- Alert on repeated CORS violations from same origin
- Monitor for unauthorized access attempts

## Deployment Strategy

### 1. Gradual Rollout
1. Deploy CORS configuration to staging first
2. Test with actual frontend domains
3. Validate no legitimate requests are blocked
4. Deploy to production with monitoring

### 2. Rollback Plan
- Environment variable to temporarily enable permissive mode
- Quick revert capability if issues detected
- Monitoring dashboard for CORS metrics

### 3. Documentation
- Update deployment documentation with required environment variables
- Document troubleshooting steps for CORS issues
- Create runbook for CORS configuration management

## Performance Impact

### Expected Impact
- **Minimal**: CORS validation is lightweight
- **Startup**: One-time configuration validation
- **Runtime**: Simple origin string comparison

### Monitoring
- Monitor request processing times
- Track CORS validation performance
- Ensure no degradation in API response times