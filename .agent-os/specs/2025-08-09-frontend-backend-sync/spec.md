# Frontend Updates for Backend Prisma & Provider Changes

**Feature Name**: Sync Frontend with Backend Prisma/Provider Updates
**Date**: 2025-08-09
**Priority**: Critical
**Status**: Required for functionality

## Problem Statement

After migrating the backend to:
1. **Prisma** instead of raw SQL migrations
2. **New provider system** with abstraction layer
3. **Updated integration endpoints**

The frontend is still expecting the old API responses and patterns, causing:
- Integration list errors
- OAuth flow failures  
- Type mismatches
- Broken UI components

## Backend Changes Summary

### 1. Database Changes (Prisma)
- All tables now managed by Prisma
- Some field names may have changed
- Relations are now properly typed
- Timestamps might have different formats

### 2. Provider Abstraction
```typescript
// Old: Direct provider calls
composioClient.getIntegrations()
klavisClient.getIntegrations()

// New: Abstracted through factory
providerFactory.createMCPClient().getIntegrations()
```

### 3. API Response Changes
- Error format might be different
- Integration status enums updated
- OAuth flow returns different fields
- User entity structure changed

## Required Frontend Updates

### 1. Type Definitions Update

**Current types** (probably outdated):
```typescript
// types/index.ts
export interface Integration {
  id: string
  service: string
  status: 'active' | 'inactive'
  accessToken?: string
  // ... old fields
}
```

**Need to sync with Prisma schema**:
```typescript
// types/index.ts - UPDATED
export interface Integration {
  id: string
  userId: string
  service: string
  status: string // Now includes more statuses
  access_token?: string // Note: snake_case from DB
  refresh_token?: string
  expires_at?: Date
  scopes?: string[]
  permissions?: string[]
  config?: Record<string, any>
  created_at?: Date
  updated_at?: Date
  last_used?: Date
}

// New types from provider abstraction
export interface IntegrationProvider {
  provider: 'gmail' | 'calendar' | 'slack'
  displayName: string
  icon: string
  description: string
  requiredScopes: string[]
  status: 'connected' | 'disconnected' | 'error'
}
```

### 2. API Endpoint Updates

**integrations.list Response**:
```typescript
// Old expectation
{
  integrations: Integration[]
}

// New format (needs verification)
{
  connections: UserConnection[]
  providers: IntegrationProvider[]
}
```

**Fix in components/IntegrationStatus.tsx**:
```typescript
// Before
const { data } = trpc.integrations.list.useQuery()
const integrations = data?.integrations || []

// After
const { data } = trpc.integrations.list.useQuery()
const connections = data?.connections || []
const providers = data?.providers || []

// Map to expected format
const integrations = connections.map(conn => ({
  id: conn.id,
  service: conn.provider,
  status: conn.status,
  // ... map other fields
}))
```

### 3. OAuth Flow Updates

**app/integrations.tsx**:
```typescript
// Current (broken)
const handleConnect = async (provider: string) => {
  const { data } = await initiateMutation.mutateAsync({ provider })
  window.location.href = data.authUrl
}

// Updated for new flow
const handleConnect = async (provider: string) => {
  try {
    const { data } = await initiateMutation.mutateAsync({ 
      provider,
      redirectUri: `${window.location.origin}/oauth/callback`
    })
    
    if (data.authUrl) {
      // Open in new window for better UX
      window.open(data.authUrl, '_blank', 'width=500,height=600')
    } else if (data.error === 'User account not found') {
      // Handle missing user entity
      toast.error('Please complete your profile setup first')
    }
  } catch (error) {
    console.error('OAuth initiation failed:', error)
    toast.error('Failed to connect integration')
  }
}
```

### 4. Error Handling Updates

**lib/trpc.ts**:
```typescript
// Add better error handling
export const trpc = createTRPCReact<AppRouter>({
  // ... existing config
  
  // Add error handler
  queryClient: {
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
            return false
          }
          return failureCount < 3
        },
        onError: (error: any) => {
          // Handle specific errors
          if (error?.message?.includes('User account not found')) {
            // Redirect to profile setup
            router.push('/setup-profile')
          }
        }
      }
    }
  }
})
```

### 5. Status Polling Fix

**hooks/useIntegrationStatus.ts**:
```typescript
export function useIntegrationStatus(provider: string) {
  const { data, refetch } = trpc.integrations.status.useQuery(
    { provider },
    {
      // Poll every 5 seconds until connected
      refetchInterval: (data) => {
        if (data?.status === 'connected') return false
        return 5000
      },
      // Don't throw on expected errors
      retry: false,
      onError: (error) => {
        // Expected during setup
        if (error.message.includes('No connection found')) {
          console.log('Integration not yet connected')
        }
      }
    }
  )
  
  return {
    status: data?.status || 'disconnected',
    refetch
  }
}
```

### 6. UI Component Updates

**components/IntegrationCard.tsx**:
```typescript
// Update to handle new data structure
export function IntegrationCard({ provider }: { provider: string }) {
  const { status } = useIntegrationStatus(provider)
  const connectMutation = trpc.integrations.initiate.useMutation()
  
  // Map provider to display info
  const providerInfo = {
    gmail: { name: 'Gmail', icon: '📧' },
    calendar: { name: 'Google Calendar', icon: '📅' },
    slack: { name: 'Slack', icon: '💬' }
  }[provider]
  
  return (
    <Card>
      <CardHeader>
        <span>{providerInfo.icon}</span>
        <h3>{providerInfo.name}</h3>
      </CardHeader>
      <CardBody>
        <StatusBadge status={status} />
        {status === 'disconnected' && (
          <Button 
            onClick={() => connectMutation.mutate({ provider })}
            disabled={connectMutation.isLoading}
          >
            {connectMutation.isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
```

## Implementation Steps

### Phase 1: Type Updates (1 day)
1. Generate types from Prisma schema
2. Update frontend type definitions
3. Fix TypeScript errors

### Phase 2: API Response Handling (2 days)
1. Update all tRPC query responses
2. Add proper error handling
3. Fix data mapping

### Phase 3: OAuth Flow (1 day)
1. Update OAuth initiation
2. Fix callback handling
3. Add proper error states

### Phase 4: UI Updates (2 days)
1. Update integration components
2. Fix status displays
3. Add loading states
4. Test all flows

## Testing Checklist

- [ ] User can view integrations page without errors
- [ ] OAuth flow completes successfully
- [ ] Status updates in real-time
- [ ] Errors show user-friendly messages
- [ ] No console errors in browser
- [ ] Mobile responsive layout works

## Quick Fixes to Try First

1. **Update tRPC types**:
```bash
# In frontend
npm run generate:types
```

2. **Clear caches**:
```typescript
// In app startup
queryClient.clear()
```

3. **Add error boundaries**:
```typescript
// Wrap integration components
<ErrorBoundary fallback={<IntegrationErrorFallback />}>
  <IntegrationsPage />
</ErrorBoundary>
```

## Success Criteria

1. ✅ No more "Failed to list integrations" errors
2. ✅ OAuth flow works end-to-end
3. ✅ Status polling shows real-time updates
4. ✅ Users can connect/disconnect integrations
5. ✅ Error messages are helpful, not cryptic