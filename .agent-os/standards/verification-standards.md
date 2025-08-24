# Verification Standards

> Version: 1.0.0
> Last Updated: 2025-01-24
> Scope: Global verification and testing standards

## Context

This file is part of the Agent OS standards system. These verification standards ensure all development work is properly tested and validated before claiming completion. Individual projects may extend these standards in their `.agent-os/product/verification-standards.md` file.

## Core Principle: ALWAYS VERIFY - NEVER ASSUME

**NEVER say a feature is "done", "fixed", or "working" without proper verification.**

### What This Means
- Test every change in the actual application
- Verify with real user interactions
- Document proof of functionality
- If unable to verify, explicitly state so

### Verification Levels
1. **Code Review** - Inspect implementation
2. **Unit Tests** - Verify individual components
3. **Integration Tests** - Verify component interactions
4. **Browser Testing** - Verify actual user experience
5. **E2E Tests** - Verify complete user flows

## Pre-Implementation Verification

### MANDATORY PRE-IMPLEMENTATION CHECKLIST

**BEFORE implementing ANY new feature:**

1. **Search Existing Code Thoroughly**
   ```bash
   # Search for related functionality
   grep -r "feature_name" app/ --include="*.tsx"
   grep -r "similar_functionality" backend/ --include="*.ts"
   
   # Check all tab files for similar features
   ls app/\(tabs\)/ | xargs -I {} echo "=== {} ===" && cat "app/(tabs)/{}"
   ```

2. **Document Current State**
   - List all existing features found
   - Identify potential duplicates
   - Map out current navigation structure
   - Note any similar implementations

3. **Test Existing Functionality First**
   ```bash
   # Start services to test current state
   npm run start:backend &
   npm run start-web &
   sleep 10
   
   # Test routes work before claiming they're broken
   curl -s http://localhost:8081/[route] | grep -q "Expected Content"
   ```

4. **Verify Requirements**
   - Ask user to confirm if feature already exists
   - Show findings from codebase search
   - Get explicit approval before creating new files

## Browser Verification with MCP Tools

### Starting the Application
```bash
npm run start:backend &
npm run start-web &
sleep 10
```

### MCP Browser Testing Steps
1. Navigate to http://localhost:8081/
2. Handle authentication (see Authentication section)
3. Navigate to the affected page/feature
4. Test the specific functionality
5. Perform user interactions (click, fill forms, submit)
6. Check browser console for errors
7. Verify expected results appear
8. Take screenshot as proof

### Authentication for Testing

**Test Credentials**:
- **Email**: test@example.com
- **Password**: password123

**MCP Puppeteer Login**:
```javascript
// Fill email field
const emailField = document.querySelector('input[placeholder*="email" i]');
emailField.value = 'test@example.com';
emailField.dispatchEvent(new Event('input', { bubbles: true }));
emailField.dispatchEvent(new Event('change', { bubbles: true }));

// Fill password field
const passwordField = document.querySelector('input[placeholder*="password" i]');
passwordField.value = 'password123';
passwordField.dispatchEvent(new Event('input', { bubbles: true }));
passwordField.dispatchEvent(new Event('change', { bubbles: true }));

// Click Sign In
const signInButton = Array.from(document.querySelectorAll('*')).find(el => 
  el.textContent?.trim() === 'Sign In' && 
  (el.tagName === 'BUTTON' || el.tagName === 'DIV')
);
signInButton?.click();
```

## Handling Verification Failures

### When Browser Automation Fails

#### Option 1: Bypass Authentication Mode
```bash
# Enable bypass auth mode for automatic login
EXPO_PUBLIC_BYPASS_AUTH=true npm run dev

# Credentials automatically used:
# Email: test-bypass@example.com
# Password: TestBypass123!
```

Benefits:
- No manual login required
- Works around session persistence issues
- Perfect for quick testing
- Shows visual banner indicating bypass mode

#### Option 2: Manual Verification Instructions
When automation fails, provide clear manual steps:

```markdown
### Manual Verification Required

1. Start the application:
   ```bash
   npm run start:backend
   npm run start-web
   ```

2. Navigate to http://localhost:8081/

3. Login with test credentials:
   - Email: test@example.com
   - Password: password123

4. Test the specific feature:
   - [Exact navigation steps]
   - [What to click/interact with]
   - [What should happen]
   - [What to verify]

5. Check browser console for errors (F12)
```

#### Option 3: Create Verification Script
```typescript
// scripts/verify-[feature-name].ts
async function verifyFeature() {
  console.log('Starting feature verification...');
  
  // Setup test data
  await createTestUser();
  
  // Test API endpoints
  const response = await fetch('http://localhost:3001/api/endpoint');
  console.log('Response:', await response.json());
  
  // Output clear pass/fail
  console.log('✅ Feature working correctly');
}

verifyFeature().catch(console.error);
```

## Testing Standards

### MANDATORY TESTING PROTOCOL

For EVERY feature implementation:

1. **Run Unit Tests**
   ```bash
   npm test
   npm run test:coverage
   ```

2. **Run E2E Tests**
   ```bash
   npm run test:e2e
   npm run test:e2e:coverage  # Target: 90%+
   ```

3. **Run Integration Tests**
   ```bash
   npm run test:integration
   ```

### BDD Test Structure
```typescript
test('User journey description', async ({ page }) => {
  const bdd = createBDDHelpers(page);
  
  // Given - Initial state
  await bdd.givenUserIsLoggedIn('admin@test.com', 'password123');
  
  // When - Actions
  await bdd.whenUserNavigatesToPage('/feature');
  await bdd.whenUserClicksButton('Action');
  
  // Then - Verifications
  await bdd.thenUserShouldSeeText('Expected result');
});
```

## Data Attributes for Testing

Add `data-testid` attributes to all interactive elements:

```typescript
<TouchableOpacity 
  data-testid="action-button"
  onPress={handleAction}
>
  <Text>Action</Text>
</TouchableOpacity>
```

Common patterns:
- `data-testid="agent-card"` - Cards
- `data-testid="chat-input"` - Input fields
- `data-testid="tab-[name]"` - Navigation tabs
- `data-testid="integration-[name]-status"` - Status indicators

## Performance Verification

### Load Time Requirements
- Page load: < 3 seconds
- API responses: < 200ms
- Template loading: < 200ms
- Search results: < 500ms

### Performance Testing
```bash
# Use browser dev tools Network tab
# Check for:
- Bundle sizes
- API response times
- Render performance
- Memory usage
```

## Completion Criteria

### Before Claiming "Done"
- [ ] All code implemented according to standards
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] Browser verification completed
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Screenshots taken as proof
- [ ] Documentation updated

### If Unable to Verify
State clearly:
> "I've implemented the changes but cannot verify due to [specific reason]"

Never claim functionality works without verification.

## Common Verification Issues

### Browser Automation Session Persistence
- **Issue**: Auth state lost between MCP tool calls
- **Solution**: Use bypass auth mode
- **Command**: `EXPO_PUBLIC_BYPASS_AUTH=true npm run dev`

### Backend Server Instability
- **Issue**: Server crashes during testing
- **Solution**: Check logs, increase memory limits
- **Debug**: `npm run start:backend -- --inspect`

### Port Conflicts
- **Issue**: Ports 8081/3001 already in use
- **Solution**: Kill existing processes
- **Command**: `lsof -ti:8081,3001 | xargs kill -9`

## Documentation Requirements

### After Verification, Document:
1. **What was tested**
2. **How it was tested**
3. **Test results**
4. **Screenshots/evidence**
5. **Any issues found**
6. **Performance metrics**

### Example Documentation
```markdown
## Verification Report

### Feature: Agent Template Loading
- **Tested**: Template list loads from database
- **Method**: Browser testing with MCP Puppeteer
- **Result**: ✅ Templates load in < 200ms
- **Evidence**: screenshot-templates-loaded.png
- **Issues**: None
- **Performance**: API response 156ms
```

---

*These verification standards ensure quality and reliability across all development work.*