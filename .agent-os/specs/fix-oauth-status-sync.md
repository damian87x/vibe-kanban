# Fix OAuth Connection Status Synchronization

> Spec ID: fix-oauth-status-sync
> Created: 2025-07-30
> Status: Planning
> Priority: High
> Type: Bug Fix

## Problem Statement

After completing OAuth connection and closing the callback tab, the UI continues showing a spinner and doesn't update to show connected status even after page refresh. The current implementation requires users to manually click "Check Status" to verify OAuth completion, providing a poor user experience.

### Current Issues
1. No automatic communication between OAuth callback window and main application
2. Manual status checking required via alert dialog
3. Focus-based refresh has a 5-second cooldown that may miss immediate updates
4. No real-time status synchronization across tabs/windows
5. OAuth completion status not persisted properly for page refreshes

## Proposed Solution

Implement a robust OAuth status synchronization system using multiple complementary approaches:

### 1. Cross-Window Communication (Primary Solution)
- Use `postMessage` API for secure communication between OAuth callback and main window
- Implement BroadcastChannel API for same-origin tab communication
- Fall back to localStorage events for older browsers

### 2. Server-Side Status Persistence
- Store OAuth completion status immediately in database
- Add timestamp for completion tracking
- Implement status polling endpoint for active OAuth sessions

### 3. Real-Time Updates
- Add WebSocket support for instant status updates (optional enhancement)
- Implement smart polling with exponential backoff for active OAuth sessions
- Remove manual "Check Status" dialog

### 4. UI State Management
- Persist OAuth-in-progress state to handle page refreshes
- Show appropriate loading states during OAuth flow
- Auto-dismiss spinners on successful connection

## Technical Design

### Frontend Changes

#### 1. OAuth Callback Enhancement (`app/oauth/callback.tsx`)
```typescript
// After successful OAuth processing
if (result.success) {
  // Notify parent window if opened as popup
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({
      type: 'oauth-complete',
      provider: result.provider,
      success: true,
      integrationId: result.integrationId
    }, window.location.origin);
  }
  
  // Broadcast to other tabs
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('oauth-status');
    channel.postMessage({
      type: 'oauth-complete',
      provider: result.provider,
      success: true,
      integrationId: result.integrationId
    });
    channel.close();
  }
  
  // Fallback: localStorage event
  localStorage.setItem('oauth-status', JSON.stringify({
    provider: result.provider,
    success: true,
    integrationId: result.integrationId,
    timestamp: Date.now()
  }));
  
  // Close window after delay
  setTimeout(() => {
    window.close();
  }, 2000);
}
```

#### 2. Integration Page Updates (`app/integrations.tsx`)
```typescript
// Listen for OAuth completion messages
useEffect(() => {
  // PostMessage listener
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'oauth-complete') {
      handleOAuthComplete(event.data);
    }
  };
  
  // BroadcastChannel listener
  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel('oauth-status');
    channel.onmessage = (event) => {
      if (event.data.type === 'oauth-complete') {
        handleOAuthComplete(event.data);
      }
    };
  }
  
  // Storage event listener (fallback)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'oauth-status' && event.newValue) {
      const data = JSON.parse(event.newValue);
      handleOAuthComplete(data);
      // Clean up after processing
      localStorage.removeItem('oauth-status');
    }
  };
  
  window.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    channel?.close();
  };
}, []);

// Handle OAuth completion
const handleOAuthComplete = (data: OAuthCompleteData) => {
  // Clear connecting state
  setConnectingId(null);
  
  // Remove from OAuth tracking
  setOauthInProgress(prev => {
    const updated = new Map(prev);
    updated.delete(data.provider);
    return updated;
  });
  
  // Refresh integrations list
  refetch();
  
  // Show success notification
  showNotification({
    type: 'success',
    message: `${data.provider} connected successfully!`
  });
};
```

#### 3. Smart Polling for Active OAuth Sessions
```typescript
// Poll for OAuth status while connection is in progress
useEffect(() => {
  if (oauthInProgress.size === 0) return;
  
  let pollInterval: NodeJS.Timeout;
  let pollCount = 0;
  const maxPolls = 30; // 5 minutes max
  
  const pollStatus = async () => {
    for (const [provider, timestamp] of oauthInProgress.entries()) {
      try {
        const response = await trpc.integrations.checkOAuthStatus.query({
          provider,
          timestamp
        });
        
        if (response.completed) {
          handleOAuthComplete({
            provider,
            success: response.success,
            integrationId: response.integrationId
          });
        }
      } catch (error) {
        console.error('Failed to poll OAuth status:', error);
      }
    }
    
    pollCount++;
    if (pollCount >= maxPolls || oauthInProgress.size === 0) {
      clearInterval(pollInterval);
    }
  };
  
  // Start polling - exponential backoff
  const startPolling = () => {
    pollStatus(); // Initial check
    
    let delay = 2000; // Start with 2 seconds
    const scheduleNext = () => {
      if (pollCount < 10) {
        // First 10 polls: every 2 seconds
        setTimeout(() => {
          pollStatus();
          scheduleNext();
        }, 2000);
      } else if (pollCount < 20) {
        // Next 10 polls: every 5 seconds
        setTimeout(() => {
          pollStatus();
          scheduleNext();
        }, 5000);
      } else if (pollCount < maxPolls) {
        // Final polls: every 10 seconds
        setTimeout(() => {
          pollStatus();
          scheduleNext();
        }, 10000);
      }
    };
    
    scheduleNext();
  };
  
  startPolling();
  
  return () => {
    // Cleanup handled by pollCount check
  };
}, [oauthInProgress]);
```

### Backend Changes

#### 1. Add OAuth Status Check Endpoint
```typescript
// backend/trpc/routes/integrations/oauth.ts
checkOAuthStatus: protectedProcedure
  .input(z.object({
    provider: z.string(),
    timestamp: z.number()
  }))
  .query(async ({ ctx, input }) => {
    // Check if OAuth was completed since timestamp
    const integration = await database.query(
      `SELECT * FROM user_integrations 
       WHERE user_id = $1 AND service = $2 
       AND updated_at > to_timestamp($3/1000)
       AND status = 'active'`,
      [ctx.userId, input.provider, input.timestamp]
    );
    
    return {
      completed: integration.rows.length > 0,
      success: integration.rows.length > 0,
      integrationId: integration.rows[0]?.id
    };
  })
```

#### 2. Enhance OAuth Callback Processing
```typescript
// backend/services/oauth-service.ts
async handleOAuthCallback(state: string, code: string, error?: string): Promise<OAuthResult> {
  // ... existing callback processing ...
  
  if (result.success) {
    // Mark OAuth session as completed
    await this.markOAuthCompleted(state, result.integration_id);
    
    // Optional: Notify via WebSocket if implemented
    // this.notifyOAuthComplete(userId, provider, integrationId);
  }
  
  return result;
}

private async markOAuthCompleted(state: string, integrationId: string) {
  await database.query(
    `UPDATE oauth_states 
     SET completed_at = NOW(), integration_id = $2 
     WHERE state = $1`,
    [state, integrationId]
  );
}
```

### State Persistence

#### 1. Persist OAuth In-Progress State
```typescript
// Use Zustand store for OAuth tracking
interface OAuthStore {
  oauthInProgress: Map<string, number>;
  setOAuthInProgress: (provider: string) => void;
  clearOAuthInProgress: (provider: string) => void;
  hydrateFromStorage: () => void;
}

// Persist to AsyncStorage for React Native
const oauthStore = create<OAuthStore>()(
  persist(
    (set, get) => ({
      oauthInProgress: new Map(),
      setOAuthInProgress: (provider) => {
        set(state => {
          const updated = new Map(state.oauthInProgress);
          updated.set(provider, Date.now());
          return { oauthInProgress: updated };
        });
      },
      clearOAuthInProgress: (provider) => {
        set(state => {
          const updated = new Map(state.oauthInProgress);
          updated.delete(provider);
          return { oauthInProgress: updated };
        });
      },
      hydrateFromStorage: async () => {
        // Restore from AsyncStorage
      }
    }),
    {
      name: 'oauth-tracking',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
```

## Implementation Tasks

### Phase 1: Core Communication (Priority: High)
1. **Task 1.1**: Implement postMessage communication in OAuth callback
   - Add message sending on successful OAuth completion
   - Include provider, success status, and integration ID
   - Handle window.opener checks safely

2. **Task 1.2**: Add message listeners to integrations page
   - Listen for postMessage events
   - Validate message origin for security
   - Update UI state on message receipt

3. **Task 1.3**: Implement BroadcastChannel for cross-tab sync
   - Create OAuth status channel
   - Send completion messages
   - Handle browser compatibility

### Phase 2: Status Persistence (Priority: High)
4. **Task 2.1**: Add OAuth status check endpoint
   - Create tRPC query for checking OAuth completion
   - Filter by timestamp to avoid stale data
   - Return completion status and integration ID

5. **Task 2.2**: Implement smart polling
   - Poll only when OAuth is in progress
   - Use exponential backoff to reduce server load
   - Stop polling on completion or timeout

6. **Task 2.3**: Persist OAuth tracking state
   - Store OAuth-in-progress state in Zustand
   - Persist to AsyncStorage for page refreshes
   - Clean up expired sessions on load

### Phase 3: UI Improvements (Priority: Medium)
7. **Task 3.1**: Remove manual status check dialog
   - Replace alert with automatic detection
   - Show inline status updates
   - Add progress indicators

8. **Task 3.2**: Enhance loading states
   - Show specific "Waiting for authorization" message
   - Add timeout warnings after 2 minutes
   - Provide retry options on timeout

9. **Task 3.3**: Add success animations
   - Smooth transition from loading to connected
   - Show success toast notifications
   - Update integration card immediately

### Phase 4: Error Handling (Priority: Medium)
10. **Task 4.1**: Handle OAuth failures gracefully
    - Detect and display specific error messages
    - Provide clear retry instructions
    - Log errors for debugging

11. **Task 4.2**: Add timeout handling
    - Set 5-minute timeout for OAuth flows
    - Show timeout message with retry option
    - Clean up expired OAuth sessions

### Phase 5: Testing (Priority: High)
12. **Task 5.1**: Unit tests for communication logic
    - Test postMessage handling
    - Test BroadcastChannel fallbacks
    - Test localStorage event handling

13. **Task 5.2**: E2E tests for OAuth flow
    - Test successful OAuth completion
    - Test cross-tab synchronization
    - Test page refresh scenarios

14. **Task 5.3**: Manual testing scenarios
    - Test with popup blockers
    - Test with multiple tabs open
    - Test with slow network conditions

## Success Criteria

1. **Automatic Status Updates**: OAuth connection status updates automatically without manual intervention
2. **Cross-Tab Sync**: Status synchronizes across all open tabs within 2 seconds
3. **Persistence**: OAuth status persists correctly across page refreshes
4. **No Manual Checks**: Remove all manual "Check Status" dialogs
5. **Fast Updates**: Status updates within 2-5 seconds of OAuth completion
6. **Error Recovery**: Clear error messages and retry options for failures

## Testing Strategy

### Unit Tests
- Test message validation and origin checks
- Test polling logic with mocked timers
- Test state persistence and hydration

### Integration Tests
- Test OAuth flow with mocked providers
- Test status synchronization between components
- Test error scenarios and timeouts

### E2E Tests
- Complete OAuth flow with real providers
- Verify UI updates automatically
- Test multi-tab scenarios
- Test page refresh during OAuth

### Manual Testing
- Test with different browsers (Chrome, Safari, Firefox)
- Test popup blocker scenarios
- Test mobile web behavior
- Test slow/unreliable network conditions

## Migration & Rollback Plan

### Migration
1. Deploy backend changes first (backwards compatible)
2. Deploy frontend with feature flag
3. Enable for internal testing
4. Gradual rollout to users
5. Remove old manual check code

### Rollback
- Feature flag to disable new communication
- Keep old manual check as fallback
- Backend endpoints remain compatible
- No data migration required

## Dependencies

- Existing OAuth provider implementations (Klavis/Composio)
- tRPC for new status check endpoint
- Zustand for state management
- AsyncStorage for persistence
- Browser APIs (postMessage, BroadcastChannel, localStorage)

## Timeline

- Phase 1: 2 days (Core communication)
- Phase 2: 2 days (Status persistence)
- Phase 3: 1 day (UI improvements)
- Phase 4: 1 day (Error handling)
- Phase 5: 2 days (Testing)

**Total: 8 days**

## Notes

- Consider WebSocket implementation for real-time updates in future
- Monitor polling frequency to avoid rate limits
- Add analytics to track OAuth success rates
- Consider adding OAuth status to user activity logs