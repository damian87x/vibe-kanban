# Enhance Execute Tasks Testing Requirements

## Executive Summary

This specification addresses gaps in the current `execute-tasks.md` instruction file where testing requirements are not consistently enforced. The agent sometimes misses critical testing steps including E2E tests, unit tests, coverage verification, and BDD test creation. This spec will ensure comprehensive testing is mandatory for all task executions.

## Problem Statement

### Current Issues
1. **Missing E2E Test Verification**: Agents sometimes skip E2E testing after implementation
2. **Inconsistent Unit Test Creation**: Unit tests are not always written for new features
3. **No Coverage Requirements**: Coverage targets are mentioned but not enforced
4. **BDD Test Gaps**: BDD test patterns are not created when applicable
5. **Test-First Approach Not Enforced**: TDD workflow mentioned but not mandatory

### Impact
- Features shipped without proper testing
- Regressions introduced due to missing test coverage
- Manual testing burden on developers
- Inconsistent quality across implementations

## Goals & Success Criteria

### Primary Goals
1. **Mandatory Testing Protocol**: Make all testing steps non-skippable
2. **Coverage Enforcement**: Require 90%+ coverage for new code
3. **BDD Test Creation**: Auto-generate BDD tests for user journeys
4. **Test-First Development**: Enforce TDD workflow

### Success Metrics
- [ ] 100% of implementations include unit tests
- [ ] 100% of user-facing features have E2E tests
- [ ] All implementations achieve 90%+ test coverage
- [ ] BDD tests created for all applicable scenarios
- [ ] Test failures block task completion

## Technical Requirements

### 1. Enhanced Testing Workflow

#### Phase 1: Test Planning (NEW)
```yaml
test_planning:
  required_before_implementation: true
  components:
    - identify_test_scenarios
    - determine_test_types_needed
    - create_bdd_scenarios
    - estimate_coverage_target
```

#### Phase 2: Test-First Development (ENHANCED)
```yaml
tdd_workflow:
  mandatory: true
  steps:
    1. Write failing unit tests
    2. Write failing E2E tests
    3. Implement minimal code
    4. Make tests pass
    5. Refactor with green tests
    6. Check coverage
```

#### Phase 3: Test Verification (ENHANCED)
```yaml
test_verification:
  unit_tests:
    required: true
    command: npm test
    failure_blocks_completion: true
  
  e2e_tests:
    required: true
    commands:
      - npm run test:e2e
      - npm run test:integration
    failure_blocks_completion: true
  
  coverage:
    required: true
    command: npm run test:coverage
    minimum: 90%
    failure_blocks_completion: true
```

### 2. BDD Test Generation

#### Automatic BDD Test Creation
```typescript
// For every user-facing feature, create BDD test:
test('User journey: [FEATURE_NAME]', async ({ page }) => {
  const bdd = createBDDHelpers(page);
  
  // Given - Initial state
  await bdd.givenUserIsLoggedIn('admin@test.com', 'password123');
  await bdd.givenUserIsOnPage('/[feature]');
  
  // When - User actions
  await bdd.whenUserClicksButton('[action]');
  await bdd.whenUserFillsForm({ /* data */ });
  
  // Then - Expected outcomes
  await bdd.thenUserShouldSeeText('[success message]');
  await bdd.thenDataShouldBeSaved('[entity]');
});
```

#### BDD Test Locations
- Unit tests: `__tests__/` directories
- E2E tests: `e2e/integration/journeys/`
- API tests: `e2e/api/`

### 3. Coverage Requirements

#### Coverage Configuration
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

#### Coverage Reporting
- Generate HTML reports
- Include in completion summary
- Block completion if below threshold

### 4. Test Documentation

#### Test Plan Template
```markdown
## Test Plan for [TASK_NAME]

### Unit Tests
- [ ] Component: [name] - [what it tests]
- [ ] Function: [name] - [what it tests]
- [ ] Service: [name] - [what it tests]

### Integration Tests
- [ ] API endpoint: [route] - [scenarios]
- [ ] Database operations: [what it verifies]

### E2E Tests
- [ ] User journey: [description]
- [ ] Error scenarios: [what failures to test]
- [ ] Edge cases: [boundary conditions]

### Coverage Target
- Lines: 90%+
- Branches: 90%+
- Functions: 90%+
```

## Implementation Details

### Step Modifications

#### Step 4: Implementation Planning (MODIFIED)
Add mandatory test planning section:
```xml
<test_planning>
  <unit_tests>
    - List all functions/components to test
    - Define test cases for each
  </unit_tests>
  <e2e_tests>
    - Define user journeys
    - Create BDD scenarios
  </e2e_tests>
  <coverage_target>90% minimum</coverage_target>
</test_planning>
```

#### Step 8: Development Execution (MODIFIED)
Enforce test-first approach:
```xml
<tdd_enforcement>
  <step_1>Write failing tests FIRST</step_1>
  <step_2>Run tests to confirm they fail</step_2>
  <step_3>Implement code to pass tests</step_3>
  <step_4>Refactor with passing tests</step_4>
  <blocker>Cannot proceed without tests</blocker>
</tdd_enforcement>
```

#### Step 11: Test Suite Verification (ENHANCED)
Add comprehensive test checks:
```xml
<comprehensive_testing>
  <unit_tests>
    <command>npm test</command>
    <required>true</required>
  </unit_tests>
  <e2e_tests>
    <command>npm run test:e2e</command>
    <required>true</required>
  </e2e_tests>
  <coverage>
    <command>npm run test:coverage</command>
    <threshold>90%</threshold>
    <required>true</required>
  </coverage>
  <bdd_tests>
    <location>e2e/integration/journeys/</location>
    <required_for>user-facing features</required_for>
  </bdd_tests>
</comprehensive_testing>
```

### New Step: Test Creation Step

Add between Step 7 and Step 8:

```xml
<step number="7.5" name="test_creation">

### Step 7.5: Test Creation (MANDATORY)

<step_metadata>
  <critical>MANDATORY - NEVER SKIP</critical>
  <creates>comprehensive test suite</creates>
  <blocks>implementation until tests written</blocks>
</step_metadata>

<test_creation_process>
  <unit_tests>
    1. Create test files for each component
    2. Write test cases for all functions
    3. Include edge cases and error scenarios
    4. Mock external dependencies
  </unit_tests>
  
  <e2e_tests>
    1. Create BDD test file in journeys/
    2. Define Given/When/Then scenarios
    3. Test happy path
    4. Test error conditions
    5. Test edge cases
  </e2e_tests>
  
  <api_tests>
    1. Test all endpoints
    2. Verify response schemas
    3. Test authentication
    4. Test error responses
  </api_tests>
</test_creation_process>

<bdd_template>
  // e2e/integration/journeys/[feature].spec.ts
  import { test } from '@playwright/test';
  import { createBDDHelpers } from '../helpers/bdd-helpers';
  
  test.describe('[FEATURE_NAME] Journey', () => {
    test('should [USER_GOAL]', async ({ page }) => {
      const bdd = createBDDHelpers(page);
      
      // Given
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[page]');
      
      // When
      await bdd.whenUser[ACTION]();
      
      // Then
      await bdd.thenUserShouldSee[RESULT]();
    });
  });
</bdd_template>

<instructions>
  ACTION: Create all test files before implementation
  WRITE: Failing tests that define expected behavior
  VERIFY: Tests fail initially (red phase)
  BLOCK: Do not implement until tests are written
</instructions>

</step>
```

### Validation Rules

#### Pre-Implementation Validation
```yaml
before_implementation:
  must_have:
    - test_plan_documented
    - test_files_created
    - failing_tests_written
  blocks_if_missing: true
```

#### Post-Implementation Validation
```yaml
after_implementation:
  must_pass:
    - all_unit_tests
    - all_e2e_tests
    - coverage_threshold_90
    - no_console_errors
    - no_linting_errors
  blocks_completion_if_failing: true
```

## Testing Examples

### Example 1: New Feature Implementation

```typescript
// Step 1: Write unit test first
// __tests__/components/FeatureComponent.test.tsx
describe('FeatureComponent', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});

// Step 2: Write E2E test
// e2e/integration/journeys/feature.spec.ts
test('User can use new feature', async ({ page }) => {
  // BDD test implementation
});

// Step 3: Implement feature to pass tests
// components/FeatureComponent.tsx
export function FeatureComponent() {
  // Implementation
}
```

### Example 2: Bug Fix Implementation

```typescript
// Step 1: Write test that reproduces bug
test('should not have [BUG_BEHAVIOR]', () => {
  // Test that currently fails due to bug
});

// Step 2: Fix bug
// Make the test pass

// Step 3: Verify all tests still pass
// Run full test suite
```

## Migration Strategy

### Phase 1: Update execute-tasks.md
1. Add new test creation step
2. Enhance existing testing steps
3. Add validation checkpoints

### Phase 2: Create Test Templates
1. Unit test templates
2. E2E BDD test templates
3. API test templates

### Phase 3: Enforcement
1. Make testing steps non-skippable
2. Add coverage thresholds
3. Block completion on test failures

## Rollback Plan

If issues arise:
1. Keep original execute-tasks.md as backup
2. Gradually introduce requirements
3. Start with warnings before hard blocks

## Documentation Updates

### Files to Update
1. `.agent-os/instructions/execute-tasks.md` - Main changes
2. `.agent-os/instructions/create-spec.md` - Add test planning
3. `CLAUDE.md` - Reference new testing requirements

### New Documentation
1. `.agent-os/standards/testing-standards.md` - Comprehensive testing guide
2. `.agent-os/templates/test-templates/` - Test file templates

## Success Validation

### Metrics to Track
- Percentage of tasks with tests: Target 100%
- Average test coverage: Target 90%+
- Test execution in CI/CD: All passing
- BDD test coverage: All user journeys

### Review Process
1. Weekly review of test metrics
2. Identify gaps in coverage
3. Update templates based on patterns
4. Share learnings across team

## Conclusion

This specification ensures that testing becomes an integral, non-negotiable part of the development workflow. By enforcing test-first development, requiring comprehensive coverage, and automating BDD test creation, we guarantee higher quality implementations and prevent regressions.

The enhanced execute-tasks.md will make it impossible for agents to skip testing steps, ensuring every feature is properly validated before completion.