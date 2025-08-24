# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-10-fix-dev-environment/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Development Scripts**
- Test that check-port.sh correctly identifies and kills processes
- Test that start-dev.sh handles missing dependencies gracefully
- Verify cleanup scripts remove temporary files

**Configuration Files**
- Validate Jest configuration loads without errors
- Ensure Metro config resolves paths correctly
- Test that all npm scripts have valid paths

### Integration Tests

**Development Startup Flow**
- Full `make dev` command executes successfully
- Both frontend and backend start without errors
- Database migrations run correctly

**Testing Environment**
- React Native components can be tested with Jest
- Mocks are applied before component loading
- Test environment handles React Native specifics

**Port Management**
- Backend starts even if port 3001 is occupied
- Multiple `make dev` calls don't cause conflicts
- Graceful shutdown releases ports properly

### Manual Testing Checklist

**Script Path Verification**
- [ ] Run `npm run db:migrate:ensure` - should complete without errors
- [ ] Check all npm scripts reference existing files
- [ ] Verify no "module not found" errors during startup

**Jest Testing**
- [ ] Run `npm test app/workflow/[id]/__tests__/edit.test.tsx`
- [ ] Verify no "jest is not defined" errors
- [ ] Confirm React Native components render in tests

**Port Conflict Resolution**
- [ ] Start backend twice in a row - second start should work
- [ ] Run `lsof -i :3001` after shutdown - port should be free
- [ ] Multiple developers can run `make dev` simultaneously

**Metro Bundler**
- [ ] Frontend starts without anonymous file errors
- [ ] Hot reload works properly
- [ ] Source maps generate correctly

### Mocking Requirements

- **File System Operations:** Mock file checks in tests
- **Process Management:** Mock process killing in port check tests
- **Network Ports:** Mock port availability checks