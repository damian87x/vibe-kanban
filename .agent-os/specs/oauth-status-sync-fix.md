# OAuth Connection Status Synchronization Fix

## Problem Summary

After completing OAuth connection and closing the callback tab, the main integrations page continues showing a spinner and doesn't update to show connected status, even after page refresh. This creates a poor user experience where users don't know if their integration was successfully connected.

## Root Cause Analysis

1. **Cross-Tab Communication Gap**: OAuth callback happens in a separate browser tab with no communication channel to the main application tab
2. **Manual Status Check**: Current implementation requires users to manually click "Check Status" button
3. **Unreliable Focus Events**: AppState/visibility change events don't trigger reliably across browsers
4. **No Status Persistence**: Connection status isn't persisted in a way that survives page refreshes
5. **Polling Limitations**: Current auto-refresh logic has cooldowns and doesn't work immediately

## Solution Overview

Implement a multi-layered approach for reliable OAuth status synchronization:

1. **BroadcastChannel API** for instant cross-tab communication (primary)
2. **localStorage events** as fallback for browsers without BroadcastChannel support
3. **Status persistence** to survive page refreshes
4. **Automatic status checking** when OAuth window closes
5. **Enhanced UI feedback** with proper loading states

## Technical Specification

### Phase 1: Cross-Tab Communication Layer

#### 1.1 Create Broadcasting Service
```typescript
// utils/oauth-broadcast.ts
export class OAuthBroadcast {
  private channel: BroadcastChannel | null = null;
  private storageKey = 'oauth_status_update';
  
  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('oauth_status');
    }
  }
  
  // Send status update to all tabs
  broadcast(data: {
    service: string;
    status: 'connected' | 'failed';
    timestamp: number;
    userId: string;
  }) {
    // Primary: BroadcastChannel
    if (this.channel) {
      this.channel.postMessage(data);
    }
    
    // Fallback: localStorage event
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    
    // Clean up after broadcast
    setTimeout(() => {
      localStorage.removeItem(this.storageKey);
    }, 1000);
  }
  
  // Listen for status updates
  subscribe(callback: (data: any) => void): () => void {
    const handlers: Array<() => void> = [];
    
    // BroadcastChannel listener
    if (this.channel) {
      const channelHandler = (event: MessageEvent) => callback(event.data);
      this.channel.addEventListener('message', channelHandler);
      handlers.push(() => this.channel?.removeEventListener('message', channelHandler));
    }
    
    // localStorage listener (fallback)
    const storageHandler = (event: StorageEvent) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          callback(data);
        } catch (e) {
          console.error('Failed to parse OAuth broadcast:', e);
        }
      }
    };
    window.addEventListener('storage', storageHandler);
    handlers.push(() => window.removeEventListener('storage', storageHandler));
    
    // Return cleanup function
    return () => handlers.forEach(cleanup => cleanup());
  }
  
  close() {
    this.channel?.close();
  }
}
```

### Phase 2: OAuth Callback Enhancement

#### 2.1 Update OAuth Callback Component
```typescript
// app/oauth/callback.tsx modifications
import { OAuthBroadcast } from '@/utils/oauth-broadcast';

export default function OAuthCallbackScreen() {
  const broadcast = useRef(new OAuthBroadcast());
  
  // In the success handler:
  const handleCallbackMutation = trpc.integrations.oauth.callback.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setStatus('success');
        setMessage(`Successfully connected ${result.provider}!`);
        
        // Broadcast success to other tabs
        broadcast.current.broadcast({
          service: result.provider,
          status: 'connected',
          timestamp: Date.now(),
          userId: user?.id || ''
        });
        
        // Also persist to AsyncStorage for mobile/refresh scenarios
        AsyncStorage.setItem(
          `oauth_success_${result.provider}`,
          JSON.stringify({
            status: 'connected',
            timestamp: Date.now()
          })
        );
        
        // Auto-close window after short delay
        setTimeout(() => {
          if (Platform.OS === 'web' && window.opener) {
            window.close();
          } else {
            router.replace('/integrations');
          }
        }, 2000);
      }
    }
  });
}
```

### Phase 3: Integrations Page Enhancement

#### 3.1 Add OAuth Status Listener Hook
```typescript
// hooks/useOAuthStatusListener.ts
export function useOAuthStatusListener(
  onStatusUpdate: (service: string, status: string) => void
) {
  useEffect(() => {
    const broadcast = new OAuthBroadcast();
    
    // Subscribe to broadcast updates
    const unsubscribe = broadcast.subscribe((data) => {
      // Verify it's for current user
      if (data.userId === user?.id) {
        onStatusUpdate(data.service, data.status);
      }
    });
    
    // Check for persisted success status on mount
    const checkPersistedStatus = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const oauthKeys = keys.filter(k => k.startsWith('oauth_success_'));
      
      for (const key of oauthKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const { status, timestamp } = JSON.parse(data);
          // Only use if recent (within 5 minutes)
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            const service = key.replace('oauth_success_', '');
            onStatusUpdate(service, status);
          }
          // Clean up old status
          await AsyncStorage.removeItem(key);
        }
      }
    };
    
    checkPersistedStatus();
    
    return () => {
      unsubscribe();
      broadcast.close();
    };
  }, [onStatusUpdate, user?.id]);
}
```

#### 3.2 Update Integrations Screen
```typescript
// app/integrations.tsx modifications
export default function IntegrationsScreen() {
  // Existing code...
  
  // Add OAuth window tracking
  const oauthWindows = useRef<Map<string, Window | null>>(new Map());
  
  // Listen for OAuth status updates
  useOAuthStatusListener((service, status) => {
    logger.log('[Integrations] Received OAuth status update:', { service, status });
    
    // Clear connecting state
    if (connectingId === service) {
      setConnectingId(null);
    }
    
    // Remove from OAuth tracking
    setOauthInProgress(prev => {
      const updated = new Map(prev);
      updated.delete(service);
      return updated;
    });
    
    // Refetch integrations to show updated status
    refetch();
    
    // Show success message
    Alert.alert('Success', `${service} connected successfully!`);
  });
  
  // Enhanced connect handler
  const handleConnect = (integration: Integration) => {
    // ... existing code ...
    
    // For web, track the OAuth window
    if (Platform.OS === 'web') {
      const authWindow = window.open(result.authUrl, '_blank');
      oauthWindows.current.set(integration.id, authWindow);
      
      // Poll for window close
      const checkWindow = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkWindow);
          oauthWindows.current.delete(integration.id);
          
          // Auto-check status when window closes
          setTimeout(() => {
            checkOAuthStatus(integration.id, instanceId);
          }, 1000);
        }
      }, 500);
    }
  };
  
  // New method to check OAuth status
  const checkOAuthStatus = async (service: string, instanceId: string) => {
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/trpc/integrations.oauth.status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            json: { service, instanceId }
          })
        }
      );
      
      const data = await response.json();
      if (data?.result?.data?.json?.connected) {
        // Status will be updated via broadcast
        logger.log('[Integrations] OAuth completed successfully');
      }
    } catch (error) {
      logger.error('[Integrations] Failed to check OAuth status:', error);
    }
  };
}
```

### Phase 4: Backend Status Endpoint

#### 4.1 Add Status Check Endpoint
```typescript
// backend/trpc/routes/integrations/oauth.ts
export const checkOAuthStatus = protectedProcedure
  .input(z.object({
    service: z.string(),
    instanceId: z.string()
  }))
  .query(async ({ input, ctx }) => {
    try {
      // Check if integration exists and is active
      const integration = await db.query(
        `SELECT * FROM integrations 
         WHERE user_id = $1 AND service = $2 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [ctx.user.id, input.service]
      );
      
      return {
        connected: integration.rows.length > 0,
        integration: integration.rows[0] || null
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  });
```

### Phase 5: UI Improvements

#### 5.1 Enhanced Loading States
```typescript
// components/IntegrationCard.tsx
interface IntegrationCardProps {
  integration: Integration;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function IntegrationCard({
  integration,
  isConnecting,
  onConnect,
  onDisconnect
}: IntegrationCardProps) {
  // Show different states
  if (isConnecting) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.connectingText}>
          Connecting to {integration.name}...
        </Text>
        <Text style={styles.helpText}>
          Complete authorization in your browser
        </Text>
      </View>
    );
  }
  
  // Regular card display...
}
```

### Phase 6: Error Handling

#### 6.1 Connection Timeout Handling
```typescript
// Add timeout handling to integrations page
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  oauthInProgress.forEach((timestamp, service) => {
    if (Date.now() - timestamp > CONNECTION_TIMEOUT) {
      // Connection timed out
      setOauthInProgress(prev => {
        const updated = new Map(prev);
        updated.delete(service);
        return updated;
      });
      
      if (connectingId === service) {
        setConnectingId(null);
        Alert.alert(
          'Connection Timeout',
          'The connection process took too long. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  });
}, [oauthInProgress, connectingId]);
```

## Testing Strategy

### Unit Tests
1. Test BroadcastChannel message sending/receiving
2. Test localStorage fallback mechanism
3. Test OAuth status persistence and retrieval
4. Test timeout handling

### Integration Tests
1. Test full OAuth flow with status updates
2. Test cross-tab communication
3. Test page refresh scenarios
4. Test mobile OAuth flow

### E2E Tests
```typescript
test('OAuth connection updates status without refresh', async ({ page }) => {
  await page.goto('/integrations');
  
  // Start OAuth flow
  const popup = page.waitForEvent('popup');
  await page.click('[data-testid="connect-gmail"]');
  
  // Complete OAuth in popup
  const oauthPage = await popup;
  await oauthPage.fill('#email', 'test@example.com');
  await oauthPage.click('#submit');
  
  // Status should update automatically in main page
  await expect(page.locator('[data-testid="gmail-status"]'))
    .toContainText('Connected', { timeout: 5000 });
});
```

## Implementation Tasks

### Task 1: Implement BroadcastChannel Service (2 hours)
- Create `utils/oauth-broadcast.ts`
- Add localStorage fallback
- Add TypeScript types

### Task 2: Update OAuth Callback (1 hour)
- Modify `app/oauth/callback.tsx`
- Add broadcast on success
- Add status persistence

### Task 3: Enhance Integrations Page (3 hours)
- Add `useOAuthStatusListener` hook
- Update connection handling
- Add window tracking for web
- Implement auto-status checking

### Task 4: Backend Status Endpoint (1 hour)
- Add status check endpoint
- Update tRPC router

### Task 5: UI Improvements (2 hours)
- Create better loading states
- Add timeout handling
- Improve error messages

### Task 6: Testing (3 hours)
- Write unit tests
- Write integration tests
- Write E2E tests

## Success Criteria

1. **Instant Updates**: OAuth success immediately reflects in UI without manual refresh
2. **Cross-Tab Sync**: Status updates work across multiple browser tabs
3. **Persistence**: Status survives page refreshes
4. **No Manual Steps**: Users never need to click "Check Status"
5. **Timeout Handling**: Clear feedback when connections timeout
6. **Mobile Support**: Solution works on both web and mobile platforms

## Rollback Plan

If issues arise:
1. Disable BroadcastChannel, fall back to localStorage only
2. Re-enable manual "Check Status" button
3. Increase auto-refresh frequency as temporary fix
4. Document known issues for users

## Future Enhancements

1. Implement full WebSocket support for real-time updates
2. Add connection retry mechanisms
3. Show detailed connection progress
4. Add connection health monitoring
5. Implement server-sent events as alternative to WebSockets