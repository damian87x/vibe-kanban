# Development Best Practices

> Version: 1.0.0
> Last updated: 2025-03-02
> Scope: Global development standards

## Context

This file is part of the Agent OS standards system. These global best practices are referenced by all product codebases and provide default development guidelines. Individual projects may extend or override these practices in their `.agent-os/product/dev-best-practices.md` file.

## Core Principles

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations

### ALWAYS VERIFY - NEVER ASSUME
- Test every implementation in the actual application
- Never claim something works without verification
- Document proof of functionality with screenshots
- If unable to verify, explicitly state the reason
- Follow verification standards: @.agent-os/standards/verification-standards.md

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation

## Code Organization

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions

### Testing
- Write tests for new functionality
- Maintain existing test coverage (target 90%+)
- Test edge cases and error conditions
- Use BDD patterns for E2E tests

## React Native Best Practices

### Performance Optimization
- Use React.memo for expensive components
- Implement FlatList for long lists (never ScrollView)
- Optimize images with proper sizing and caching
- Minimize re-renders with proper state management

### Cross-Platform Development
- Test on both iOS and Android regularly
- Use platform-specific code sparingly (Platform.OS)
- Prefer cross-platform libraries
- Handle safe areas and notches properly

### State Management
- Keep component state local when possible
- Use Zustand stores for shared state
- Persist only necessary data to AsyncStorage
- Clear sensitive data on logout

### Navigation
- Use Expo Router's file-based routing
- Keep navigation stack shallow
- Handle deep linking properly
- Implement proper back button behavior

### Error Handling
- Implement error boundaries for React components
- Show user-friendly error messages
- Log errors to monitoring service
- Handle network failures gracefully

### Security
- Never hardcode API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication flows
- Clear sensitive data from memory

### Accessibility
- Add accessibility labels to all interactive elements
- Test with screen readers
- Ensure proper color contrast
- Support dynamic font sizes

## Backend Integration

### API Communication
- Use tRPC for type-safe API calls
- Handle loading and error states
- Implement proper retry logic
- Cache responses when appropriate

### Authentication
- Store tokens securely
- Implement token refresh logic
- Handle expired sessions gracefully
- Clear auth data on logout

## Verification Best Practices

### Pre-Implementation Verification
- Search for existing implementations before creating new features
- Test current functionality before claiming it's broken
- Document findings and get approval before proceeding
- Check both frontend and backend for similar features

### Post-Implementation Verification
- Start application and verify it loads correctly
- Navigate to the feature using browser tools
- Test all user interactions (clicks, forms, navigation)
- Check browser console for JavaScript errors
- Take screenshots as proof of functionality
- Run unit and E2E tests

### Handling Verification Issues
- Use bypass auth mode for session persistence issues
- Provide manual verification steps when automation fails
- Create verification scripts for complex features
- Document any blockers preventing verification

### Performance Verification
- Verify page load times < 3 seconds
- Check API response times < 200ms
- Monitor bundle sizes and optimization
- Test on both iOS and Android platforms

---

*Customize this file with your team's specific practices. These guidelines apply to all code written by humans and AI agents.*
