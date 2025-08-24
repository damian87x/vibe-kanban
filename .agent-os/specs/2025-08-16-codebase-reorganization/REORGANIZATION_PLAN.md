# Codebase Reorganization Plan

## Overview

This document outlines the comprehensive plan to reorganize the existing codebase into a clean monorepo structure with minimal effort and maximum maintainability.

## Current State Analysis

### Root Level Issues
- Mixed frontend/backend files at root level
- Single package.json with all dependencies
- Scattered documentation and test files
- Scripts mixed with source code
- No clear separation of concerns

### Package.json Problems
- Frontend and backend scripts mixed together
- Dependencies not properly separated by domain
- Build scripts reference incorrect paths
- Test scripts scattered throughout

### Directory Structure Issues
- `app/`, `components/`, `hooks/` at root level (should be frontend)
- `backend/` at root level (should be in src)
- `scripts/` mixed with source code
- `__tests__/` and `e2e/` at root level
- `docs/` scattered throughout

## Target Structure

```
rork-getden-ai-workspace/
├── src/
│   ├── frontend/           # React Native/Expo app
│   │   ├── app/            # Expo Router
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # State management
│   │   ├── contexts/       # React contexts
│   │   ├── constants/      # Frontend constants
│   │   ├── lib/            # Frontend utilities
│   │   ├── types/          # Frontend types
│   │   ├── services/       # Frontend services
│   │   ├── assets/         # Images and assets
│   │   ├── public/         # Public assets
│   │   └── package.json    # Frontend dependencies
│   │
│   ├── backend/            # Backend services
│   │   ├── services/       # Business logic
│   │   ├── trpc/           # API routes
│   │   ├── database/       # Database layer
│   │   ├── config/         # Configuration
│   │   ├── utils/          # Utilities
│   │   ├── types/          # TypeScript types
│   │   ├── constants/      # Backend constants
│   │   ├── interfaces/     # Interfaces
│   │   ├── repositories/   # Data access
│   │   ├── mcp/            # MCP clients
│   │   └── package.json    # Backend dependencies
│   │
│   └── devops/             # Infrastructure
│       ├── docker/         # Docker files
│       ├── deployment/     # Deployment configs
│       ├── ssl/            # SSL configuration
│       └── package.json    # DevOps dependencies
│
├── scripts/                 # Utility scripts (root level)
│   ├── test-integration/   # Integration test scripts
│   ├── test-auth/          # Authentication test scripts
│   ├── test-database/      # Database test scripts
│   ├── test-workflows/     # Workflow test scripts
│   ├── test-agents/        # Agent test scripts
│   ├── build-scripts/      # Build utilities
│   ├── deployment/         # Deployment scripts
│   └── utilities/          # General utilities
│
├── docs/                    # Centralized documentation
│   ├── architecture/        # System architecture
│   ├── api/                 # API documentation
│   ├── deployment/          # Deployment guides
│   ├── development/         # Development guides
│   └── troubleshooting/     # Troubleshooting guides
│
├── tests/                   # Organized test structure
│   ├── unit/                # Unit tests
│   │   ├── frontend/        # Frontend unit tests
│   │   └── backend/         # Backend unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
│
├── package.json             # Workspace configuration
├── README.md                # Project overview
└── .gitignore              # Git ignore rules
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. **Create New Structure**
   - Create `src/` directory
   - Create subdirectories for frontend, backend, devops
   - Set up workspace-level package.json

2. **Prepare Migration Tools**
   - Create migration scripts
   - Set up backup and rollback procedures
   - Establish testing protocols

### Phase 2: Domain Migration (Week 2-3)
1. **Frontend Migration (Week 2)**
   - Move React Native/Expo code to `src/frontend/`
   - Update import paths
   - Create frontend-specific package.json
   - Verify functionality

2. **Backend Migration (Week 2-3)**
   - Move backend services to `src/backend/`
   - Update import paths and configurations
   - Create backend-specific package.json
   - Verify all services work

3. **DevOps Migration (Week 3)**
   - Move infrastructure files to `src/devops/`
   - Update deployment scripts
   - Create devops-specific package.json
   - Verify deployment processes

### Phase 3: Integration and Testing (Week 4)
1. **Cross-Domain Updates**
   - Update all import references
   - Fix cross-domain dependencies
   - Update test configurations

2. **Comprehensive Testing**
   - Run all test suites
   - Verify end-to-end functionality
   - Performance and stability testing

### Phase 4: Cleanup and Documentation (Week 5)
1. **Final Cleanup**
   - Remove old directories
   - Update all documentation
   - Create architectural guidelines

2. **Team Handover**
   - Train team on new structure
   - Document development workflows
   - Establish maintenance procedures

## Package.json Strategy

### Root Level (Workspace)
```json
{
  "name": "rork-getden-ai-workspace",
  "private": true,
  "workspaces": [
    "src/frontend",
    "src/backend",
    "src/devops"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "npm run dev --workspace=src/frontend",
    "dev:backend": "npm run dev --workspace=src/backend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "test:e2e": "npm run test:e2e --workspace=src/frontend"
  }
}
```

### Frontend Package.json
```json
{
  "name": "@rork/frontend",
  "scripts": {
    "start": "expo start",
    "start:web": "expo start --web",
    "build": "expo export --platform web",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "expo": "^53.0.4",
    "react": "19.0.0",
    "react-native": "^0.79.4"
  }
}
```

### Backend Package.json
```json
{
  "name": "@rork/backend",
  "scripts": {
    "start": "tsx server.ts",
    "dev": "tsx --watch server.ts",
    "build": "tsc -p tsconfig.json",
    "test": "jest",
    "db:migrate": "tsx database/run-migrations-tracked.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.14.4",
    "@trpc/server": "^11.4.2",
    "prisma": "^6.13.0"
  }
}
```

## Risk Mitigation

### High-Risk Areas
1. **Import Path Updates**: Risk of breaking functionality
2. **Build Scripts**: Risk of breaking CI/CD pipelines
3. **Test Configurations**: Risk of losing test coverage
4. **Cross-Domain Dependencies**: Risk of circular dependencies

### Mitigation Strategies
1. **Incremental Migration**: Move one domain at a time
2. **Comprehensive Testing**: Test each phase thoroughly
3. **Rollback Plans**: Maintain ability to revert quickly
4. **Documentation**: Document all changes and decisions

## Success Metrics

### Functional Metrics
- [ ] All existing functionality preserved
- [ ] All tests pass in new structure
- [ ] Build and deployment processes work
- [ ] Development workflows function correctly

### Architectural Metrics
- [ ] Clear separation of concerns achieved
- [ ] Consistent patterns across all domains
- [ ] Reduced coupling between components
- [ ] Improved developer experience

### Process Metrics
- [ ] Migration completed within timeline
- [ ] Minimal disruption to development
- [ ] Team can work effectively in new structure
- [ ] Future development is more efficient

## Next Steps

1. **Review and Approve Plan**: Get stakeholder approval
2. **Create Migration Branch**: Set up git branch for migration
3. **Begin Phase 1**: Start foundation work
4. **Coordinate Specialists**: Assign roles and responsibilities
5. **Execute Migration**: Follow phased approach
6. **Monitor Progress**: Track metrics and address issues
7. **Complete Handover**: Train team and document processes

## Conclusion

This reorganization will transform the codebase from a mixed structure to a clean, maintainable monorepo that follows modern best practices. The phased approach minimizes risk while achieving significant improvements in organization, maintainability, and developer experience.

The key to success is maintaining functionality throughout the migration while systematically improving the structure. With proper coordination between specialists and comprehensive testing at each phase, this reorganization will provide a solid foundation for future development.
