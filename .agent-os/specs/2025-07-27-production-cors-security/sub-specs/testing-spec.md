# Testing Specification: Production CORS Security Configuration

> Spec: Production CORS Security Configuration
> Sub-spec: Testing Strategy
> Created: 2025-07-27

## Overview

This testing specification defines comprehensive testing approaches for the CORS security configuration, ensuring both security compliance and functionality across all environments.

## Testing Strategy

### 1. Unit Testing

#### CORS Configuration Logic
Test the core CORS configuration functions in isolation:

```typescript
// __tests__/cors-config.test.ts
describe('CORS Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_DEV_ORIGINS;
  });

  describe('Production Environment', () => {
    test('should require CORS_ALLOWED_ORIGINS in production', () => {
      process.env.NODE_ENV = 'production';
      
      expect(() => getCORSConfig()).toThrow(
        'CORS_ALLOWED_ORIGINS must be set in production'
      );
    });

    test('should use only specified origins in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ALLOWED_ORIGINS = 'https://taskpilot.com,https://app.taskpilot.com';
      
      const config = getCORSConfig();
      expect(config.origin).toEqual([
        'https://taskpilot.com',
        'https://app.taskpilot.com'
      ]);
      expect(config.credentials).toBe(true);
    });

    test('should not allow wildcard patterns in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ALLOWED_ORIGINS = 'https://*.taskpilot.com';
      
      const config = getCORSConfig();
      // Should treat as literal string, not pattern
      expect(config.origin).toEqual(['https://*.taskpilot.com']);
    });
  });

  describe('Development Environment', () => {
    test('should include default localhost origins', () => {
      process.env.NODE_ENV = 'development';
      
      const config = getCORSConfig();
      expect(config.origin).toContain('http://localhost:8081');
      expect(config.origin).toContain('http://localhost:3000');
      expect(config.origin).toContain('exp://localhost:8081');
    });

    test('should merge custom development origins', () => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_DEV_ORIGINS = 'https://test.ngrok.io,http://192.168.1.100:8081';
      
      const config = getCORSConfig();
      expect(config.origin).toContain('https://test.ngrok.io');
      expect(config.origin).toContain('http://192.168.1.100:8081');
      expect(config.origin).toContain('http://localhost:8081'); // Still includes defaults
    });
  });

  describe('Staging Environment', () => {
    test('should allow staging domains', () => {
      process.env.NODE_ENV = 'staging';
      process.env.CORS_ALLOWED_ORIGINS = 'https://staging.taskpilot.com';
      
      const config = getCORSConfig();
      expect(config.origin).toContain('https://staging.taskpilot.com');
      expect(config.origin).toContain('http://localhost:8081'); // Development origins too
    });
  });
});
```

#### Origin Validation Tests
```typescript
describe('Origin Validation', () => {
  test('should validate exact origin matches', () => {
    const allowed = ['https://taskpilot.com', 'https://app.taskpilot.com'];
    
    expect(validateOrigin('https://taskpilot.com', allowed)).toBe(true);
    expect(validateOrigin('https://malicious.com', allowed)).toBe(false);
  });

  test('should validate ngrok patterns in development', () => {
    process.env.NODE_ENV = 'development';
    const allowed = ['http://localhost:8081'];
    
    expect(validateOrigin('https://abc123.ngrok.io', allowed)).toBe(true);
    expect(validateOrigin('https://malicious-site.com', allowed)).toBe(false);
  });

  test('should not validate ngrok patterns in production', () => {
    process.env.NODE_ENV = 'production';
    const allowed = ['https://taskpilot.com'];
    
    expect(validateOrigin('https://abc123.ngrok.io', allowed)).toBe(false);
  });
});
```

### 2. Integration Testing

#### API Request Tests
Test actual HTTP requests with CORS headers:

```typescript
// __tests__/cors-integration.test.ts
describe('CORS Integration', () => {
  let app: any;

  beforeAll(async () => {
    // Initialize test app with CORS configuration
    const { default: testApp } = await import('../hono');
    app = testApp;
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ALLOWED_ORIGINS = 'https://taskpilot.com,https://app.taskpilot.com';
    });

    test('should allow requests from authorized origins', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://taskpilot.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://taskpilot.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should block requests from unauthorized origins', async () => {
      await request(app)
        .options('/api/test')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);
    });

    test('should handle requests without origin header', async () => {
      // Direct API requests (non-browser) don't have Origin header
      await request(app)
        .get('/api/test')
        .expect(200);
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      delete process.env.CORS_ALLOWED_ORIGINS;
    });

    test('should allow localhost origins', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:8081')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8081');
    });

    test('should allow ngrok tunnels', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://abc123.ngrok.io')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://abc123.ngrok.io');
    });
  });

  describe('Preflight Requests', () => {
    test('should handle OPTIONS preflight requests', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ALLOWED_ORIGINS = 'https://taskpilot.com';

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://taskpilot.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });
});
```

### 3. End-to-End Testing

#### Browser-Based Tests
Test CORS behavior in actual browser environments:

```typescript
// e2e/cors-e2e.test.ts
describe('CORS E2E Tests', () => {
  test('frontend can make authenticated requests', async ({ page }) => {
    // Set up production environment
    await page.goto('http://localhost:8081');
    
    // Test legitimate API request
    const response = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3001/api/test', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return {
        ok: response.ok,
        status: response.status,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
        }
      };
    });
    
    expect(response.ok).toBe(true);
    expect(response.corsHeaders['access-control-allow-credentials']).toBe('true');
  });

  test('unauthorized origins receive CORS errors', async ({ page }) => {
    // Simulate request from unauthorized domain
    const response = await page.evaluate(async () => {
      try {
        await fetch('http://localhost:3001/api/test', {
          method: 'GET',
          headers: {
            'Origin': 'https://malicious-site.com'
          }
        });
        return { error: false };
      } catch (error) {
        return { 
          error: true, 
          message: error.message,
          type: error.name 
        };
      }
    });
    
    expect(response.error).toBe(true);
    expect(response.message).toContain('CORS');
  });

  test('preflight requests work correctly', async ({ page }) => {
    await page.goto('http://localhost:8081');
    
    // Test preflight request for POST with custom headers
    const response = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3001/api/test', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      return {
        ok: response.ok,
        status: response.status
      };
    });
    
    expect(response.ok).toBe(true);
  });
});
```

### 4. Security Testing

#### Penetration Testing Scenarios
```typescript
describe('CORS Security Tests', () => {
  test('should prevent CSRF attacks via CORS', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://taskpilot.com';

    // Simulate malicious site trying to make authenticated request
    const response = await request(app)
      .post('/api/sensitive-action')
      .set('Origin', 'https://malicious-attacker.com')
      .set('Cookie', 'auth-token=valid-token')
      .send({ action: 'transfer-funds' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Cross-origin request not allowed');
  });

  test('should log security violations', async () => {
    const logSpy = jest.spyOn(console, 'warn');
    
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://taskpilot.com';

    await request(app)
      .get('/api/test')
      .set('Origin', 'https://malicious-site.com')
      .expect(403);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Blocked CORS request from unauthorized origin: https://malicious-site.com')
    );
  });

  test('should not leak allowed origins in error messages', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://taskpilot.com,https://internal.taskpilot.com';

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'https://malicious-site.com')
      .expect(403);

    expect(response.body.allowedOrigins).toBe('configured domains');
    expect(response.body.allowedOrigins).not.toContain('internal.taskpilot.com');
  });
});
```

### 5. Performance Testing

#### CORS Overhead Tests
```typescript
describe('CORS Performance', () => {
  test('should not significantly impact response times', async () => {
    const iterations = 100;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      await request(app)
        .get('/api/test')
        .set('Origin', 'https://taskpilot.com')
        .expect(200);
        
      times.push(Date.now() - start);
    }
    
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    expect(averageTime).toBeLessThan(50); // Should be under 50ms on average
  });

  test('should handle high volume of CORS requests', async () => {
    const concurrentRequests = 50;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/api/test')
          .set('Origin', 'https://taskpilot.com')
          .expect(200)
      );
    }
    
    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
  });
});
```

## Test Data and Scenarios

### Test Origins
```typescript
const testOrigins = {
  production: {
    allowed: [
      'https://taskpilot.com',
      'https://www.taskpilot.com',
      'https://app.taskpilot.com'
    ],
    blocked: [
      'https://malicious-site.com',
      'http://taskpilot.com', // HTTP instead of HTTPS
      'https://taskpilot.evil.com', // Subdomain attack
      'https://taskpilotcom.evil.com' // Homograph attack
    ]
  },
  development: {
    allowed: [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://127.0.0.1:8081',
      'https://abc123.ngrok.io',
      'exp://localhost:8081'
    ],
    shouldAllow: [
      'https://def456.ngrok.io', // Different ngrok tunnel
      'https://xyz789.ngrok-free.app' // Ngrok free tier
    ]
  }
};
```

## Automated Testing Pipeline

### CI/CD Integration
```yaml
# .github/workflows/cors-security-tests.yml
name: CORS Security Tests

on:
  pull_request:
    paths:
      - 'backend/config/cors-config.ts'
      - 'backend/hono.ts'
      - '__tests__/**/*cors*'

jobs:
  cors-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-env: [development, staging, production]
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run CORS unit tests
        run: npm test -- --testPathPattern="cors"
        env:
          NODE_ENV: ${{ matrix.node-env }}
          
      - name: Run CORS integration tests
        run: npm run test:integration -- cors
        env:
          NODE_ENV: ${{ matrix.node-env }}
          
      - name: Run security tests
        run: npm run test:security -- cors
        if: matrix.node-env == 'production'
```

## Manual Testing Procedures

### Pre-Deployment Checklist
1. **Verify Production Configuration**
   - [ ] CORS_ALLOWED_ORIGINS environment variable is set
   - [ ] All production domains are included
   - [ ] No wildcard patterns in production

2. **Test Legitimate Requests**
   - [ ] Frontend can make authenticated requests
   - [ ] API calls with credentials work
   - [ ] Preflight requests are handled correctly

3. **Test Unauthorized Requests**
   - [ ] Requests from unknown domains are blocked
   - [ ] Error messages don't leak sensitive information
   - [ ] Security violations are logged

4. **Performance Verification**
   - [ ] No significant response time increase
   - [ ] High-volume requests handled properly
   - [ ] Memory usage remains stable

### Post-Deployment Monitoring
- Monitor CORS violation logs
- Track API response times
- Verify no legitimate requests are blocked
- Watch for unusual origin patterns