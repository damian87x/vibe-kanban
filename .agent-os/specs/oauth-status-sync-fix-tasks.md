# OAuth Status Sync Fix - Task Breakdown

## Overview
Fix OAuth connection status synchronization to automatically update UI when OAuth completes in another tab, eliminating the need for manual refresh or "Check Status" clicks.

## Task List

### 🔴 Task 1: Create OAuth Broadcast Service (2 hours)
**File**: `utils/oauth-broadcast.ts`

**Implementation**:
- [ ] Create OAuthBroadcast class with BroadcastChannel support
- [ ] Add localStorage fallback for older browsers
- [ ] Implement broadcast() method for sending status updates
- [ ] Implement subscribe() method for receiving updates
- [ ] Add proper TypeScript types and error handling
- [ ] Add cleanup methods to prevent memory leaks

**Acceptance Criteria**:
- Can send messages between browser tabs
- Falls back to localStorage events when BroadcastChannel unavailable
- Properly typed with TypeScript
- Includes unit tests

---

### 🔴 Task 2: Enhance OAuth Callback Page (1 hour)
**File**: `app/oauth/callback.tsx`

**Implementation**:
- [ ] Import and initialize OAuthBroadcast
- [ ] Add broadcast call on successful OAuth completion
- [ ] Persist success status to AsyncStorage
- [ ] Auto-close OAuth window/tab after success
- [ ] Update error handling to broadcast failures

**Acceptance Criteria**:
- Broadcasts success/failure to other tabs
- Persists status for page refresh scenarios
- Auto-closes OAuth tab after 2 seconds
- Shows clear success/error messages

---

### 🔴 Task 3: Create OAuth Status Listener Hook (1.5 hours)
**File**: `hooks/useOAuthStatusListener.ts`

**Implementation**:
- [ ] Create hook that subscribes to OAuth broadcasts
- [ ] Check for persisted OAuth status on mount
- [ ] Validate updates are for current user
- [ ] Clean up old persisted statuses
- [ ] Handle both web and mobile platforms

**Acceptance Criteria**:
- Receives real-time OAuth status updates
- Recovers status after page refresh
- Cleans up old status data
- Works on both web and mobile

---

### 🔴 Task 4: Update Integrations Page (3 hours)
**File**: `app/integrations.tsx`

**Implementation**:
- [ ] Integrate useOAuthStatusListener hook
- [ ] Add OAuth window tracking for web platform
- [ ] Implement automatic status checking when OAuth window closes
- [ ] Remove manual "Check Status" UI elements
- [ ] Update state management for real-time updates
- [ ] Improve connection timeout handling

**Acceptance Criteria**:
- UI updates instantly when OAuth completes
- No manual refresh required
- OAuth windows are tracked and monitored
- Clear timeout messages after 5 minutes
- Smooth loading states during connection

---

### 🟡 Task 5: Add Backend Status Check Endpoint (1 hour)
**File**: `backend/trpc/routes/integrations/oauth.ts`

**Implementation**:
- [ ] Create checkOAuthStatus query endpoint
- [ ] Query database for active integration status
- [ ] Return connection status and integration details
- [ ] Add proper error handling and logging

**Acceptance Criteria**:
- Returns accurate connection status
- Validates user ownership
- Handles database errors gracefully
- Includes integration details when connected

---

### 🟡 Task 6: Improve UI Loading States (2 hours)
**Files**: `components/IntegrationCard.tsx`, `app/integrations.tsx`

**Implementation**:
- [ ] Create dedicated connecting state UI
- [ ] Add progress indicators during OAuth flow
- [ ] Show helpful messages during connection
- [ ] Add timeout warnings
- [ ] Implement smooth state transitions

**Acceptance Criteria**:
- Clear visual feedback during connection
- Helpful instructions for users
- Smooth animations between states
- Timeout warnings after 4 minutes

---

### 🟢 Task 7: Comprehensive Testing (3 hours)

**Unit Tests**:
- [ ] Test OAuthBroadcast class methods
- [ ] Test useOAuthStatusListener hook
- [ ] Test status persistence logic
- [ ] Test timeout handling

**Integration Tests**:
- [ ] Test full OAuth flow with status updates
- [ ] Test cross-tab communication
- [ ] Test page refresh scenarios
- [ ] Test error handling

**E2E Tests**:
- [ ] Test OAuth flow without manual refresh
- [ ] Test multiple tab scenarios
- [ ] Test timeout scenarios
- [ ] Test mobile OAuth flow

**Acceptance Criteria**:
- 90%+ code coverage
- All tests passing
- E2E tests verify no manual steps needed

---

### 🟢 Task 8: Documentation and Cleanup (1 hour)

**Implementation**:
- [ ] Document OAuth broadcast architecture
- [ ] Update integration setup guide
- [ ] Remove old manual check code
- [ ] Add inline code comments
- [ ] Update API documentation

**Acceptance Criteria**:
- Clear architecture documentation
- Updated user guides
- Removed deprecated code
- Well-commented implementation

---

## Priority Legend
- 🔴 **Critical**: Core functionality, must be completed
- 🟡 **Important**: Enhances functionality, should be completed
- 🟢 **Nice to have**: Improves quality, complete if time allows

## Total Estimated Time: 14.5 hours

## Implementation Order
1. Task 1 → Task 3 → Task 4 (Frontend foundation)
2. Task 2 (OAuth callback enhancement)
3. Task 5 (Backend support)
4. Task 6 (UI polish)
5. Task 7 → Task 8 (Quality assurance)

## Definition of Done
- [ ] All critical tasks completed
- [ ] Tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] Verified on both web and mobile platforms
- [ ] No manual "Check Status" clicks required