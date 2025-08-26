---
description: Improved Spec Creation with Date-Name Pattern
version: 2.0
encoding: UTF-8
---

# Improved Spec Creation Rules

<ai_meta>
  <parsing_rules>
    - Process XML blocks first for structured data
    - Execute instructions in sequential order
    - Use templates as exact patterns
    - Create proper folder structure with date-name pattern
  </parsing_rules>
  <file_conventions>
    - encoding: UTF-8
    - line_endings: LF
    - indent: 2 spaces
    - markdown_headers: no indentation
    - folder_pattern: YYYY-MM-DD-feature-name
  </file_conventions>
</ai_meta>

## Overview

<purpose>
  - Create detailed spec plans with proper date-name folder structure
  - Generate separated spec.md and tasks.md documentation
  - Include sub-specs folder for technical specifications
  - Ensure alignment with product roadmap and mission
</purpose>

<folder_structure>
  .agent-os/
  └── specs/
      └── YYYY-MM-DD-feature-name/
          ├── spec.md          # Main specification document
          ├── tasks.md         # Task breakdown and checklist
          └── sub-specs/       # Technical specifications
              ├── technical-design.md
              ├── test-plan.md
              └── implementation-details.md
</folder_structure>

## Process Flow

<step number="1" name="spec_folder_creation">

### Step 1: Create Spec Folder Structure

<instructions>
  1. GENERATE folder name:
     - Format: YYYY-MM-DD-feature-name
     - Example: 2025-01-12-oauth-window-close-refresh
     - Use current date from environment
     - Convert feature name to kebab-case
  
  2. CREATE directory structure:
     ```bash
     mkdir -p .agent-os/specs/YYYY-MM-DD-feature-name/sub-specs
     ```
  
  3. VERIFY structure created successfully
</instructions>

<validation>
  - Date format must be YYYY-MM-DD
  - Feature name must be kebab-case
  - No spaces in folder names
  - All lowercase except for date separators
</validation>

</step>

<step number="2" name="spec_initiation">

### Step 2: Spec Initiation

<step_metadata>
  <trigger_options>
    - option_a: user_asks_whats_next
    - option_b: user_provides_specific_spec
  </trigger_options>
</step_metadata>

<option_a_flow>
  <trigger_phrases>
    - "what's next?"
    - "what should we work on next?"
  </trigger_phrases>
  <actions>
    1. CHECK @.agent-os/product/roadmap.md
    2. FIND next uncompleted item
    3. SUGGEST item to user with proposed folder name
    4. WAIT for approval
  </actions>
</option_a_flow>

<option_b_flow>
  <trigger>user describes specific spec idea</trigger>
  <actions>
    1. EXTRACT feature name from description
    2. GENERATE folder name with date
    3. SHOW proposed folder structure to user
    4. WAIT for confirmation
  </actions>
</option_b_flow>

</step>

<step number="3" name="spec_document_creation">

### Step 3: Create spec.md

<location>.agent-os/specs/YYYY-MM-DD-feature-name/spec.md</location>

<template>
# Feature Specification: [Feature Name]

## Metadata
- **Date Created**: YYYY-MM-DD
- **Author**: Agent OS
- **Status**: Draft | In Review | Approved | Implemented
- **Version**: 1.0.0

## Executive Summary
[2-3 sentence high-level description of the feature and its purpose]

## Problem Statement
### Current Situation
[Describe the current state and pain points]

### Desired Outcome
[Describe the ideal state after implementation]

## Solution Overview
### Approach
[High-level approach to solving the problem]

### Key Components
1. [Component 1]
2. [Component 2]
3. [Component 3]

## User Stories
### Primary User Story
As a [user type], I want to [action] so that [benefit].

### Additional User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Requirements
### Architecture
[High-level architecture description]

### Dependencies
- [Dependency 1]
- [Dependency 2]

### Constraints
- [Constraint 1]
- [Constraint 2]

## Implementation Phases
### Phase 1: Foundation
- Description: [What will be built]
- Timeline: [Estimated duration]
- Deliverables: [What will be delivered]

### Phase 2: Core Features
- Description: [What will be built]
- Timeline: [Estimated duration]
- Deliverables: [What will be delivered]

### Phase 3: Polish & Optimization
- Description: [What will be built]
- Timeline: [Estimated duration]
- Deliverables: [What will be delivered]

## Success Metrics
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]
- [Metric 3]: [Target value]

## Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |
| [Risk 2] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |

## References
- [Related specification or document]
- [External documentation or resource]
</template>

</step>

<step number="4" name="tasks_document_creation">

### Step 4: Create tasks.md

<location>.agent-os/specs/YYYY-MM-DD-feature-name/tasks.md</location>

<template>
# Task Breakdown: [Feature Name]

## Task Organization
- **Total Tasks**: [Number]
- **Estimated Total Effort**: [Hours/Days]
- **Priority**: High | Medium | Low
- **Sprint Assignment**: Sprint [X]

## Task Categories

### 🔧 Setup & Configuration
- [ ] **TASK-001**: Set up development environment
  - Effort: 1 hour
  - Dependencies: None
  - Assignee: TBD
  
- [ ] **TASK-002**: Configure build tools
  - Effort: 2 hours
  - Dependencies: TASK-001
  - Assignee: TBD

### 💾 Database & Models
- [ ] **TASK-010**: Create database migrations
  - Effort: 2 hours
  - Dependencies: TASK-001
  - Assignee: TBD
  
- [ ] **TASK-011**: Implement data models
  - Effort: 4 hours
  - Dependencies: TASK-010
  - Assignee: TBD

### 🎯 Core Implementation
- [ ] **TASK-020**: Implement [Core Feature 1]
  - Effort: 8 hours
  - Dependencies: TASK-011
  - Assignee: TBD
  
- [ ] **TASK-021**: Implement [Core Feature 2]
  - Effort: 6 hours
  - Dependencies: TASK-011
  - Assignee: TBD

### 🌐 API Development
- [ ] **TASK-030**: Create REST endpoints
  - Effort: 4 hours
  - Dependencies: TASK-020, TASK-021
  - Assignee: TBD
  
- [ ] **TASK-031**: Add API documentation
  - Effort: 2 hours
  - Dependencies: TASK-030
  - Assignee: TBD

### 🎨 Frontend Implementation
- [ ] **TASK-040**: Create UI components
  - Effort: 6 hours
  - Dependencies: TASK-030
  - Assignee: TBD
  
- [ ] **TASK-041**: Implement state management
  - Effort: 4 hours
  - Dependencies: TASK-040
  - Assignee: TBD

### ✅ Testing
- [ ] **TASK-050**: Write unit tests
  - Effort: 4 hours
  - Dependencies: TASK-020, TASK-021
  - Assignee: TBD
  
- [ ] **TASK-051**: Write integration tests
  - Effort: 3 hours
  - Dependencies: TASK-030
  - Assignee: TBD
  
- [ ] **TASK-052**: End-to-end testing
  - Effort: 4 hours
  - Dependencies: TASK-041
  - Assignee: TBD

### 📚 Documentation
- [ ] **TASK-060**: Write user documentation
  - Effort: 2 hours
  - Dependencies: TASK-041
  - Assignee: TBD
  
- [ ] **TASK-061**: Update developer docs
  - Effort: 1 hour
  - Dependencies: TASK-031
  - Assignee: TBD

### 🚀 Deployment
- [ ] **TASK-070**: Prepare deployment scripts
  - Effort: 2 hours
  - Dependencies: TASK-052
  - Assignee: TBD
  
- [ ] **TASK-071**: Deploy to staging
  - Effort: 1 hour
  - Dependencies: TASK-070
  - Assignee: TBD
  
- [ ] **TASK-072**: Deploy to production
  - Effort: 1 hour
  - Dependencies: TASK-071
  - Assignee: TBD

## Task Dependencies Graph
```
TASK-001 ──┬── TASK-002
           ├── TASK-010 ── TASK-011 ──┬── TASK-020 ──┐
           │                           └── TASK-021 ──┴── TASK-030 ── TASK-031
           │                                                    │
           │                                                    └── TASK-040 ── TASK-041
           │
           └── TASK-050, TASK-051, TASK-052
                    │
                    └── TASK-060, TASK-061 ── TASK-070 ── TASK-071 ── TASK-072
```

## Completion Tracking
| Phase | Tasks | Completed | Percentage |
|-------|-------|-----------|------------|
| Setup | 2 | 0 | 0% |
| Database | 2 | 0 | 0% |
| Core | 2 | 0 | 0% |
| API | 2 | 0 | 0% |
| Frontend | 2 | 0 | 0% |
| Testing | 3 | 0 | 0% |
| Documentation | 2 | 0 | 0% |
| Deployment | 3 | 0 | 0% |
| **Total** | **18** | **0** | **0%** |

## Notes
- Tasks can be executed in parallel where no dependencies exist
- Effort estimates are preliminary and may be adjusted
- Task IDs follow pattern: TASK-XXX where XXX is a sequential number
</template>

</step>

<step number="5" name="sub_specs_creation">

### Step 5: Create Sub-Specifications

<location>.agent-os/specs/YYYY-MM-DD-feature-name/sub-specs/</location>

<sub_spec_1 name="technical-design.md">
# Technical Design: [Feature Name]

## Architecture Overview
### System Context
[Diagram or description of where this feature fits in the system]

### Component Design
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│  Component  │────▶│  Component  │
│      A      │     │      B      │     │      C      │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Data Flow
### Request Flow
1. User initiates action
2. Frontend sends request
3. Backend processes
4. Database updates
5. Response returned

### Data Models
```typescript
interface FeatureModel {
  id: string;
  // Add fields
}
```

## API Design
### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/feature | List features |
| POST | /api/feature | Create feature |
| PUT | /api/feature/:id | Update feature |
| DELETE | /api/feature/:id | Delete feature |

### Request/Response Schemas
```json
{
  "request": {},
  "response": {}
}
```

## Security Considerations
- Authentication requirements
- Authorization levels
- Data validation rules
- Rate limiting

## Performance Requirements
- Response time: < 200ms
- Throughput: 1000 req/s
- Concurrent users: 100

## Technology Stack
- Frontend: [Technologies]
- Backend: [Technologies]
- Database: [Technologies]
- Infrastructure: [Technologies]
</sub_spec_1>

<sub_spec_2 name="test-plan.md">
# Test Plan: [Feature Name]

## Test Strategy
### Scope
- What will be tested
- What will not be tested
- Test environments

### Approach
- Unit testing
- Integration testing
- E2E testing
- Performance testing

## Test Cases

### Unit Tests
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| UT-001 | Test function X | Input A | Output B |
| UT-002 | Test function Y | Input C | Output D |

### Integration Tests
| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| IT-001 | API integration | API + DB | Success response |
| IT-002 | Service integration | Service A + B | Data flow works |

### End-to-End Tests
| Test ID | User Story | Steps | Expected Result |
|---------|------------|-------|-----------------|
| E2E-001 | User creates item | 1. Login<br>2. Navigate<br>3. Create | Item created |
| E2E-002 | User updates item | 1. Login<br>2. Select<br>3. Update | Item updated |

## Test Data
### Required Test Data
- User accounts
- Sample data sets
- Edge cases

## Test Environment
### Requirements
- Development environment
- Staging environment
- Test database

## Success Criteria
- All unit tests pass
- All integration tests pass
- All E2E tests pass
- Code coverage > 80%
- No critical bugs
- Performance benchmarks met
</sub_spec_2>

<sub_spec_3 name="implementation-details.md">
# Implementation Details: [Feature Name]

## Development Setup
### Prerequisites
```bash
# Required tools
- Node.js v18+
- Rust 1.75+
- Docker
```

### Environment Variables
```env
FEATURE_ENABLED=true
FEATURE_CONFIG=value
```

## Code Structure
```
src/
├── components/
│   └── feature/
│       ├── FeatureComponent.tsx
│       └── FeatureComponent.test.tsx
├── services/
│   └── feature/
│       ├── feature.service.ts
│       └── feature.service.test.ts
└── models/
    └── feature.model.ts
```

## Implementation Steps

### Step 1: Backend Implementation
```rust
// Example Rust code structure
pub struct FeatureService {
    // Implementation
}

impl FeatureService {
    pub async fn create(&self) -> Result<Feature> {
        // Implementation
    }
}
```

### Step 2: Frontend Implementation
```typescript
// Example TypeScript code structure
export const FeatureComponent: React.FC = () => {
  // Implementation
  return <div>Feature</div>;
};
```

### Step 3: Database Schema
```sql
CREATE TABLE features (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration
### Feature Flags
```json
{
  "features": {
    "newFeature": {
      "enabled": true,
      "rolloutPercentage": 100
    }
  }
}
```

## Deployment Instructions
### Build Process
```bash
# Build commands
npm run build
cargo build --release
```

### Deployment Steps
1. Run tests
2. Build artifacts
3. Deploy to staging
4. Verify staging
5. Deploy to production

## Monitoring & Logging
### Key Metrics
- Response time
- Error rate
- Usage statistics

### Log Levels
- ERROR: Critical issues
- WARN: Potential problems
- INFO: General information
- DEBUG: Detailed debugging

## Rollback Plan
1. Identify issue
2. Disable feature flag
3. Revert deployment if needed
4. Investigate root cause
</sub_spec_3>

</step>

<step number="6" name="spec_review">

### Step 6: Review and Finalize

<checklist>
  - [ ] Folder structure follows YYYY-MM-DD-feature-name pattern
  - [ ] spec.md contains all required sections
  - [ ] tasks.md has complete task breakdown with IDs
  - [ ] Sub-specs folder contains technical details
  - [ ] All files use proper markdown formatting
  - [ ] Dependencies are clearly identified
  - [ ] Success metrics are measurable
  - [ ] Risks are documented with mitigations
</checklist>

<finalization_steps>
  1. REVIEW all created files for completeness
  2. VERIFY folder structure matches pattern
  3. ENSURE task IDs are sequential and logical
  4. CONFIRM sub-specs cover technical needs
  5. ADD to git:
     ```bash
     git add .agent-os/specs/YYYY-MM-DD-feature-name/
     ```
  6. SHOW summary to user with file paths
</finalization_steps>

</step>

<step number="7" name="integration_with_existing">

### Step 7: Integration with Existing System

<update_roadmap>
  1. LOCATE the spec in @.agent-os/product/roadmap.md
  2. ADD reference to new spec folder:
     ```markdown
     - [ ] Feature Name
       - Spec: .agent-os/specs/YYYY-MM-DD-feature-name/
       - Status: In Development
     ```
</update_roadmap>

<create_tracking>
  1. OPTIONAL: Create a tracking document
     ```
     .agent-os/specs/YYYY-MM-DD-feature-name/progress.md
     ```
  2. UPDATE as implementation progresses
</create_tracking>

</step>

## Usage Examples

<example_1>
User: "/create-spec oauth window close refresh"

Response:
1. Creating spec folder: .agent-os/specs/2025-01-12-oauth-window-close-refresh/
2. Generated:
   - spec.md - Main specification
   - tasks.md - 18 tasks organized by category
   - sub-specs/technical-design.md
   - sub-specs/test-plan.md
   - sub-specs/implementation-details.md
</example_1>

<example_2>
User: "what's next?"

Response:
1. Checking roadmap...
2. Next item: "User authentication improvements"
3. Proposed folder: .agent-os/specs/2025-01-12-user-authentication-improvements/
4. Would you like me to create this spec?
</example_2>

## Benefits of This Approach

1. **Date-based Organization**: Specs are chronologically organized
2. **Clear Separation**: spec.md for planning, tasks.md for execution
3. **Technical Details**: Sub-specs folder for deep technical documentation
4. **Searchable**: YYYY-MM-DD prefix makes finding specs by date easy
5. **Consistent Structure**: Every spec follows the same pattern
6. **Task Tracking**: Numbered tasks with clear dependencies
7. **Scalable**: Can handle multiple specs without confusion