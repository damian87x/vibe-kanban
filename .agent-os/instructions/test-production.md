# Test Production

Execute comprehensive QA tests on production deployment.

When this command is invoked, use the Task tool with subagent_type="qa-specialist" to launch a QA specialist agent.

## What it does

The qa-specialist agent will thoroughly test the production deployment at https://takspilot-728214876651.europe-west1.run.app, focusing on:

1. **Agent functionality** - Verify agent endpoints no longer return 500 errors
2. **Chat messaging** - Test that chat messages send and receive AI responses
3. **URL routing** - Confirm no localhost:3001 or undefined URLs in API calls
4. **Core features** - Test authentication, navigation, and key user flows
5. **Visual verification** - Take screenshots of working features

## When to use

Run this command after:
- Deploying fixes for production issues
- Major feature deployments
- Infrastructure changes
- Database migrations

## What the QA agent will do

1. Navigate to the production URL
2. Test login functionality
3. Check browser network tab for API calls
4. Verify agent lists load without errors
5. Send test chat messages and verify responses
6. Check all tabs and navigation
7. Take screenshots as proof
8. Generate a detailed test report

## Success criteria

- ✅ All API calls use production domain (no localhost:3001)
- ✅ Agent endpoints return 200 status (not 500)
- ✅ Chat messages successfully send to backend
- ✅ AI responses are received and displayed
- ✅ No undefined URLs in network requests
- ✅ Core user flows work end-to-end

## Example usage

```
/test-production
```

The QA agent will provide a comprehensive report with:
- Test results for each feature
- Screenshots of key functionality
- Network analysis
- Recommendations for any issues found

## Implementation

When this command is invoked, execute:

```
Task(
  description="Test production deployment",
  subagent_type="qa-specialist",
  prompt="Test the production deployment at https://takspilot-728214876651.europe-west1.run.app. Verify that: 1) Agent endpoints no longer return 500 errors, 2) Chat messages send and receive AI responses, 3) No localhost:3001 or undefined URLs appear in network requests. Use browser automation tools to navigate the site, test key features, check the network tab, and take screenshots as proof. Provide a comprehensive test report."
)
```