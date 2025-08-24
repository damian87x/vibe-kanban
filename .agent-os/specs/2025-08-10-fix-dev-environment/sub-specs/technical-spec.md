# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-10-fix-dev-environment/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## Technical Requirements

- Fix npm script path in package.json to match actual file location
- Configure Jest to work properly with React Native components and mocks
- Implement port conflict detection and cleanup for backend server
- Fix Metro bundler configuration to resolve path issues
- Organize scripts into proper directory structure

## Approach Options

**Option A: Quick Fixes Only**
- Pros: Minimal changes, fast implementation
- Cons: Doesn't address root causes, problems may recur

**Option B: Comprehensive Environment Overhaul** (Selected)
- Pros: Addresses root causes, prevents future issues, improves developer experience
- Cons: More time required, touches multiple configuration files

**Rationale:** Option B is selected because the current issues indicate systemic problems with the development environment setup. A comprehensive fix will prevent these issues from recurring and improve overall developer productivity.

## Implementation Details

### 1. Script Path Corrections

**Current Issue:**
```json
"db:migrate:ensure": "npx tsx scripts/ensure-migrations.ts"
```

**Fix:**
```json
"db:migrate:ensure": "npx tsx scripts/migration-scripts/ensure-migrations.ts"
```

### 2. Jest Configuration for React Native

**Current Issues:**
- Mocks not being applied before component imports
- React Native Testing Library compatibility issues
- Jest environment not properly configured

**Solution:**
- Create proper Jest setup files for React Native
- Configure module mocks in setupFilesAfterEnv
- Use proper test environment for React Native

### 3. Port Management Solution

**Implementation:**
- Add pre-start script to check and kill processes on port 3001
- Implement graceful shutdown in backend server
- Add port availability check before starting

**Port Check Script:**
```bash
#!/bin/bash
PORT=3001
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
  echo "Killing process on port $PORT (PID: $PID)"
  kill -9 $PID
fi
```

### 4. Metro Bundler Configuration

**Issues:**
- Path resolution errors for anonymous files
- Source map generation problems

**Solution:**
- Update metro.config.js with proper resolver configuration
- Add source map configuration
- Fix module resolution for TypeScript files

### 5. Script Organization Structure

**New Structure:**
```
scripts/
├── dev/                    # Development scripts
│   ├── check-port.sh
│   ├── start-dev.sh
│   └── cleanup.sh
├── test/                   # Test-related scripts
│   ├── setup-jest.ts
│   └── run-tests.sh
├── migration-scripts/      # Database migrations (existing)
└── build-scripts/         # Build and deployment (existing)
```

## External Dependencies

- **No new dependencies required** - All fixes use existing packages
- **Justification:** We're fixing configuration and organization issues, not adding new functionality