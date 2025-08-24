# Fix Integration Errors - Implementation Checklist

## Pre-Implementation Checks
- [ ] Locate integration route files in `/backend/trpc/routes/integrations/`
- [ ] Check if Composio service files exist
- [ ] Verify environment variables for Composio are set
- [ ] Check if integration tables have data

## Phase 1: Diagnose Issue
- [ ] Add console.error with full stack trace to integration endpoints
- [ ] Log Composio service initialization status
- [ ] Check if COMPOSIO_API_KEY is properly loaded
- [ ] Test raw database queries for user_connection table
- [ ] Verify Prisma client is generated with latest schema

## Phase 2: Fix Root Cause
- [ ] Fix error serialization (empty {} problem)
- [ ] Add try-catch with detailed logging
- [ ] Check Composio client initialization
- [ ] Ensure proper error propagation
- [ ] Add null checks for service instances

## Phase 3: Testing
- [ ] Test /api/trpc/integrations.list endpoint
- [ ] Test /api/trpc/integrations.available endpoint
- [ ] Check frontend integrations page
- [ ] Verify no console errors
- [ ] Test with different user accounts

## Code Changes Needed

### 1. Integration Routes
```typescript
// Add to catch blocks:
console.error('Failed to list integrations:', {
  error: error instanceof Error ? error.message : error,
  stack: error instanceof Error ? error.stack : undefined,
  userId,
  service: 'composio'
});
```

### 2. Service Initialization Check
```typescript
// Add to service files:
if (!this.composioClient) {
  throw new Error('Composio client not initialized. Check COMPOSIO_API_KEY');
}
```

### 3. Database Query Validation
```typescript
// Add null checks:
const connections = await database.query(...);
if (!connections) {
  console.warn('No connections found for user:', userId);
  return [];
}
```

## Verification Steps
1. Start backend: `npm run start:backend`
2. Check logs for initialization errors
3. Test endpoints with curl
4. Navigate to integrations page
5. Check browser console for errors

## Quick Fixes to Try
- [ ] Verify COMPOSIO_API_KEY in .env file
- [ ] Check if composio package is installed
- [ ] Restart backend with fresh environment
- [ ] Clear any cached service instances
- [ ] Check database connection pool settings