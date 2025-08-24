# Fix Register Console Error on Cloud Deployment

## Overview

The registration form on the cloud deployment (https://takspilot-728214876651.europe-west1.run.app/auth/register) is failing due to a console.log error when the "Create Account" button is clicked. The error occurs because the console object is being overridden in the Puppeteer evaluation context, causing `console.log` calls in the application to fail.

## Problem Statement

### Current Behavior
- User fills out registration form
- Clicks "Create Account" button
- JavaScript error occurs: `TypeError: Cannot read properties of undefined (reading 'logs')`
- Registration process fails silently with no user feedback
- Error occurs at `onPress` handler in the bundled entry file

### Expected Behavior
- User fills out registration form
- Clicks "Create Account" button
- Form validates and submits to backend
- User is registered and redirected to appropriate page
- Proper error messages shown if registration fails

### Root Cause
The error trace shows:
```
at console.<computed> [as log] (pptr:evaluate;handleToolCall...)
at onPress (entry-f90c6a40117a4ebf072cc26bfe7a34d6.js:11941:2795)
```

This indicates that:
1. The register form's onPress handler uses `console.log`
2. In production/Puppeteer context, the console object is modified
3. The modified console object doesn't have the expected structure

## Technical Specification

### Affected Files
- `app/(auth)/register.tsx` - Registration form component
- Any shared authentication components using console.log
- Build/bundling configuration that might strip console statements

### Solution Approach

#### Option 1: Remove Console Statements (Recommended)
- Remove all console.log statements from production code
- Use proper error handling and user feedback instead
- Add ESLint rule to prevent console statements in production

#### Option 2: Safe Console Wrapper
- Create a safe console wrapper that checks for console availability
- Replace direct console.log calls with the wrapper
- Ensures graceful degradation in environments where console is modified

#### Option 3: Production Build Configuration
- Configure build process to automatically strip console statements
- Use babel-plugin-transform-remove-console or similar
- Ensures clean production builds without manual changes

### Implementation Details

#### 1. Immediate Fix
```typescript
// In register form onPress handler
const handleSubmit = async () => {
  try {
    // Remove or comment out console.log
    // console.log('Submitting registration form');
    
    // Or use safe console wrapper
    if (typeof console !== 'undefined' && console.log) {
      console.log('Submitting registration form');
    }
    
    // Registration logic here
  } catch (error) {
    // Proper error handling
  }
};
```

#### 2. Long-term Solution
Create a logger utility:
```typescript
// utils/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (__DEV__ && typeof console !== 'undefined' && console.log) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (__DEV__ && typeof console !== 'undefined' && console.error) {
      console.error(...args);
    }
  },
  // ... other methods
};
```

#### 3. Build Configuration
Update Metro/Babel config to strip console in production:
```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...api.env('production') ? ['transform-remove-console'] : []
    ]
  };
};
```

## Success Criteria

1. Registration form works without JavaScript errors
2. Users can successfully create accounts on cloud deployment
3. No console-related errors in production
4. Proper error messages displayed to users
5. Automated tests verify registration flow

## Testing Plan

1. **Unit Tests**
   - Test registration form submission without console
   - Verify error handling works correctly

2. **Integration Tests**
   - Test full registration flow
   - Verify API calls succeed
   - Check user creation in database

3. **E2E Tests**
   - Automated Puppeteer test for registration
   - Manual testing on cloud deployment
   - Cross-browser testing

## Risk Assessment

- **Low Risk**: Removing console statements
- **Medium Risk**: Changing build configuration might affect other parts
- **High Risk**: Missing other console usages that could break

## Timeline

- Immediate fix: 1 hour
- Complete solution with testing: 4 hours
- Deployment and verification: 1 hour

## Dependencies

- Access to cloud deployment logs
- Ability to deploy fixes to Cloud Run
- Testing on production environment

## Notes

This is a P0 priority issue as it completely blocks user registration on the production deployment. The fix should be implemented and deployed as soon as possible.