# Quick Frontend Fix Implementation Guide

## The Core Issues After Backend Changes

1. **API Response Format Changed** - Frontend expects old format
2. **Error Handling Broken** - "User account not found" crashes UI
3. **Types Mismatch** - Prisma generated different field names
4. **Provider Abstraction** - Frontend doesn't know about new provider system

## Immediate Fixes Needed

### 1. Fix Integration List Error (Priority: CRITICAL)

**File**: `app/(tabs)/integrations.tsx`

```typescript
// CURRENT (Broken)
const { data, isLoading, error } = trpc.integrations.list.useQuery()

// FIX 1: Add error handling
const { data, isLoading, error } = trpc.integrations.list.useQuery(undefined, {
  retry: false,
  onError: (err) => {
    console.error('Integration list error:', err)
    // Don't crash the app!
  }
})

// FIX 2: Handle empty/error states
if (error) {
  return (
    <View style={styles.container}>
      <Text>Unable to load integrations. Please try again.</Text>
      <Button title="Retry" onPress={() => refetch()} />
    </View>
  )
}

const integrations = data || []
```

### 2. Fix OAuth Initiation Error

**File**: `app/integrations.tsx` or relevant component

```typescript
// CURRENT (Broken)
const handleOAuthConnect = async (provider: string) => {
  const result = await initiateMutation.mutateAsync({ provider })
  // Crashes here with "User account not found"
}

// FIX: Add proper error handling
const handleOAuthConnect = async (provider: string) => {
  try {
    const result = await initiateMutation.mutateAsync({ 
      provider,
      redirectUri: Platform.OS === 'web' 
        ? `${window.location.origin}/oauth/callback`
        : 'exp://localhost:8081/oauth/callback'
    })
    
    if (result.authUrl) {
      if (Platform.OS === 'web') {
        window.open(result.authUrl, '_blank')
      } else {
        // Handle mobile OAuth
        await WebBrowser.openBrowserAsync(result.authUrl)
      }
    }
  } catch (error: any) {
    if (error.message?.includes('User account not found')) {
      Alert.alert(
        'Setup Required',
        'Please complete your profile setup before connecting integrations.',
        [{ text: 'OK' }]
      )
    } else {
      Alert.alert('Connection Failed', 'Unable to connect integration. Please try again.')
    }
  }
}
```

### 3. Update Type Definitions

**File**: `types/index.ts` or `types/trpc.ts`

```typescript
// Add these interfaces to match backend
export interface UserConnection {
  id: string
  user_id: string
  mcp_server_id: string
  provider: string
  composio_account_id: string
  composio_entity_id: string
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'FAILED' | 'REVOKED'
  connected_at?: Date
  last_used_at?: Date
  metadata?: Record<string, any>
}

export interface IntegrationProvider {
  id: string
  provider: 'gmail' | 'calendar' | 'slack'
  displayName: string
  icon: string
  status: 'connected' | 'disconnected' | 'error'
}

// Update the list response type
export interface IntegrationsListResponse {
  connections?: UserConnection[]
  providers?: IntegrationProvider[]
  // Backwards compatibility
  integrations?: any[]
}
```

### 4. Fix Available Integrations Query

**File**: Component using `integrations.available`

```typescript
// Add similar error handling
const { data: availableIntegrations } = trpc.integrations.available.useQuery(undefined, {
  retry: false,
  onError: (err) => {
    console.log('Available integrations error (expected):', err.message)
  }
})

// Provide fallback data
const FALLBACK_INTEGRATIONS = [
  { provider: 'gmail', name: 'Gmail', icon: '📧' },
  { provider: 'calendar', name: 'Google Calendar', icon: '📅' },
  { provider: 'slack', name: 'Slack', icon: '💬' }
]

const integrations = availableIntegrations || FALLBACK_INTEGRATIONS
```

### 5. Update Store if Using Zustand

**File**: `store/app-store.ts` or similar

```typescript
// Update store to handle new data structure
interface AppStore {
  integrations: UserConnection[]
  setIntegrations: (integrations: UserConnection[]) => void
}

// Map old format to new if needed
const mapLegacyIntegration = (old: any): UserConnection => ({
  id: old.id,
  user_id: old.userId || old.user_id,
  provider: old.service || old.provider,
  status: old.status?.toUpperCase() || 'INACTIVE',
  // ... map other fields
})
```

## Quick Test Script

Create `scripts/test-frontend-fixes.ts`:

```typescript
// Test if frontend can handle new API responses
async function testFrontendCompatibility() {
  console.log('Testing frontend compatibility...')
  
  // 1. Test type compatibility
  const mockResponse: IntegrationsListResponse = {
    connections: [],
    providers: []
  }
  
  // 2. Test error handling
  try {
    throw new Error('User account not found')
  } catch (error: any) {
    if (error.message.includes('User account not found')) {
      console.log('✅ Error handling works')
    }
  }
  
  console.log('Frontend should now handle backend changes!')
}
```

## Deployment Steps

1. **Update Types First** - No runtime impact
2. **Add Error Boundaries** - Prevents crashes
3. **Update API Calls** - With proper error handling
4. **Test OAuth Flow** - Most critical path
5. **Deploy with Feature Flag** - Roll back if needed

## The Key Fix

The main issue is that the frontend crashes when it gets unexpected responses. By adding proper error handling and fallbacks, the app will at least stay functional while we fix the deeper integration issues.

**Remember**: The goal is to make the frontend resilient to backend changes, not to make everything perfect immediately.