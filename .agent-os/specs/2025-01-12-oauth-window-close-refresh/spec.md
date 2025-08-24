# OAuth Window Close Detection and Auto-Refresh

## Problem Statement

When users complete OAuth authentication for integrations, the OAuth window closes but the integrations list doesn't automatically update. Users must manually refresh the page to see the connection status change. This creates a poor user experience, especially on mobile devices where window management is different.

### Current Issues:
1. OAuth window close detection is unreliable
2. No automatic refresh when OAuth completes
3. Mobile platforms handle OAuth differently than web
4. Status polling doesn't always trigger UI updates

## Proposed Solution

Implement robust OAuth completion detection with automatic UI refresh for both web and mobile platforms.

### Key Features:
1. **Enhanced Window Close Detection** - More reliable detection of OAuth window closure
2. **Automatic Status Refresh** - Force UI update when OAuth completes
3. **Mobile-Specific Handling** - Different approach for mobile OAuth flows
4. **Visual Feedback** - Show loading state during OAuth process

## Technical Approach

### 1. Web Platform Improvements

```typescript
// Enhanced OAuth window monitoring
const oauthWindow = window.open(authUrl, 'oauth', 'width=600,height=700');

if (oauthWindow) {
  // More aggressive polling
  const checkInterval = setInterval(() => {
    try {
      // Check if window is closed
      if (oauthWindow.closed) {
        clearInterval(checkInterval);
        handleOAuthWindowClosed();
      }
      
      // Try to access window location (will fail for cross-origin)
      // This helps detect successful redirects
      const currentUrl = oauthWindow.location.href;
      if (currentUrl.includes('/oauth/callback')) {
        clearInterval(checkInterval);
        oauthWindow.close();
        handleOAuthSuccess();
      }
    } catch (e) {
      // Cross-origin error is expected, continue polling
    }
  }, 100); // Check every 100ms for better responsiveness
  
  // Timeout after 5 minutes
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!oauthWindow.closed) {
      oauthWindow.close();
    }
  }, 300000);
}
```

### 2. Mobile Platform Handling

```typescript
// Mobile-specific OAuth handling
if (Platform.OS !== 'web') {
  // Use app state changes more effectively
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && oauthInProgress.size > 0) {
      // Immediately check OAuth status when app becomes active
      checkAllPendingOAuth();
    }
  };
  
  // Listen to deep linking for OAuth callbacks
  const handleDeepLink = (url: string) => {
    if (url.includes('/oauth/callback')) {
      const params = parseOAuthCallback(url);
      handleOAuthCallback(params);
    }
  };
  
  Linking.addEventListener('url', handleDeepLink);
}
```

### 3. Force UI Refresh

```typescript
// Force immediate UI update after OAuth
const handleOAuthComplete = async (provider: string) => {
  // Clear all OAuth tracking
  setOauthInProgress(new Map());
  setConnectingId(null);
  
  // Force immediate refetch
  await refetch();
  
  // Force re-render by updating a timestamp
  setLastRefreshTime(Date.now());
  
  // Show success feedback
  showSuccessToast(`${provider} connected successfully!`);
};
```

### 4. PostMessage Communication

```typescript
// Enhanced postMessage handling for OAuth callbacks
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'OAUTH_CALLBACK') {
      // Immediately update UI
      handleOAuthComplete(event.data.provider);
    }
  };
  
  // Also listen on the opener window
  if (window.opener) {
    window.opener.postMessage({
      type: 'OAUTH_COMPLETE',
      provider: getProviderFromUrl(),
      status: 'success'
    }, window.location.origin);
    
    // Close the OAuth window
    window.close();
  }
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

## Implementation Phases

### Phase 1: Web Platform (Day 1)
- Implement enhanced window close detection
- Add aggressive polling for OAuth window
- Implement postMessage communication
- Test with all browsers

### Phase 2: Mobile Platform (Day 2)
- Implement app state change detection
- Add deep linking support
- Test on iOS and Android
- Handle edge cases

### Phase 3: UI Feedback (Day 3)
- Add loading indicators during OAuth
- Implement success/error toasts
- Add retry mechanisms
- Polish the user experience

## Success Criteria

1. **Instant Updates** - Integration status updates within 1 second of OAuth completion
2. **No Manual Refresh** - Users never need to manually refresh the page
3. **Mobile Support** - Works seamlessly on iOS and Android
4. **Visual Feedback** - Clear indication of OAuth progress and completion
5. **Error Handling** - Graceful handling of OAuth failures

## Testing Plan

### Web Testing:
1. Test OAuth flow in Chrome, Firefox, Safari
2. Test popup blockers
3. Test OAuth window close at different stages
4. Test network interruptions

### Mobile Testing:
1. Test on iOS Safari and Chrome
2. Test on Android Chrome and Samsung Internet
3. Test app backgrounding during OAuth
4. Test deep linking callbacks

### Edge Cases:
1. User closes OAuth window early
2. OAuth provider is slow
3. Network timeout during OAuth
4. Multiple OAuth attempts

## Timeline

- **Day 1**: Web platform improvements
- **Day 2**: Mobile platform handling  
- **Day 3**: UI feedback and testing
- **Total**: 3 days

## Dependencies

- No new dependencies required
- Uses existing React Native APIs
- Compatible with current OAuth providers

## Risk Mitigation

1. **Browser Compatibility** - Test across all major browsers
2. **Mobile Differences** - Platform-specific code paths
3. **OAuth Provider Variations** - Handle different callback patterns
4. **Performance** - Optimize polling intervals

This implementation will ensure users always see up-to-date integration status without manual intervention, creating a seamless OAuth experience across all platforms.