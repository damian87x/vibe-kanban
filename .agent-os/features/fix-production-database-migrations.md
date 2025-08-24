# Fix Production Database Migrations

## Overview

Production deployment at https://takspilot-728214876651.europe-west1.run.app is returning 500 errors due to missing database tables. While the application works locally, the production database is missing critical tables because migrations are not running during deployment.

## Problem Statement

### Current Issues
1. **Missing Tables in Production**:
   - `agent_templates`, `user_agents`, `agent_flows` (from 003_create_agents_tables.sql)
   - `knowledge_items` (from 006_create_knowledge_items_table.sql)
   - `workflow_triggers` (from 007_create_workflow_triggers_table.sql)

2. **Deployment Process Gap**:
   - Only base schema (`postgres-schema.sql`) is applied
   - Migration files in `/backend/database/migrations/` are never executed
   - `MigrationRunner` class exists but isn't integrated into deployment

3. **Impact**:
   - All agent-related features fail with 500 errors
   - Knowledge management features are broken
   - Workflow triggers cannot be created or managed

## Technical Specifications

### Migration Strategy

#### 1. Automatic Migration on Deployment
- Run migrations as part of the container startup process
- Execute before the main application starts
- Handle Supabase pooler connection limitations

#### 2. Production-Safe Migration Runner
```javascript
// Key features:
- Use savepoints instead of full transactions (Supabase pooler compatibility)
- Continue on individual migration failures
- Detailed logging for debugging
- Connection pooling awareness
```

#### 3. Deployment Integration
- Update `start-production-safe.sh` to run migrations
- Ensure Dockerfile includes migration files
- Add health checks after migration completion

### Implementation Details

#### File Structure
```
backend/
├── database/
│   ├── migrations/           # SQL migration files
│   ├── run-migrations.ts     # TypeScript migration runner
│   └── run-migrations-production.js  # Production-optimized runner
├── scripts/
│   └── start-production-safe.sh  # Updated startup script
└── Dockerfile                # Updated to include migrations
```

#### Database Connection Handling
```javascript
// Production connection configuration
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  query_timeout: 60000,
  statement_timeout: 60000
};
```

## Task Breakdown

### Phase 1: Migration Runner Implementation
- [ ] Create production-safe migration runner (`run-migrations-production.js`)
- [ ] Implement savepoint-based transaction handling
- [ ] Add comprehensive error logging
- [ ] Test with Supabase pooler connection

### Phase 2: Deployment Integration
- [ ] Update `start-production-safe.sh` to run migrations
- [ ] Modify Dockerfile to copy migration files
- [ ] Add migration success verification
- [ ] Implement rollback safety checks

### Phase 3: Manual Migration Support
- [ ] Create manual migration script for emergencies
- [ ] Add production database connection helper
- [ ] Include safety confirmation prompts
- [ ] Document manual intervention procedures

### Phase 4: Documentation and Testing
- [ ] Create production migration guide
- [ ] Document troubleshooting steps
- [ ] Add migration status endpoint
- [ ] Test full deployment cycle

## Testing Strategy

### Local Testing
1. Test migration runner with production-like database
2. Verify savepoint handling works correctly
3. Test failure scenarios and recovery

### Staging Testing
1. Deploy to staging environment first
2. Verify all migrations run successfully
3. Test application functionality post-migration
4. Monitor for any performance impacts

### Production Deployment
1. Create database backup before deployment
2. Deploy during low-traffic period
3. Monitor migration logs in real-time
4. Have rollback plan ready

## Success Criteria

1. **All migrations run successfully** on deployment
2. **No 500 errors** when accessing agent/workflow features
3. **Database schema matches** local development
4. **Deployment process is repeatable** and reliable
5. **Clear logging** for debugging migration issues

## Risk Mitigation

### Risks
1. **Migration Failures**: Handled by continuing on error, logging issues
2. **Connection Timeouts**: Extended timeouts for long migrations
3. **Concurrent Deployments**: Use migration locks to prevent conflicts
4. **Schema Conflicts**: Check existing tables before creating

### Rollback Plan
1. Keep previous container version available
2. Document which migrations were applied
3. Have manual rollback scripts ready
4. Monitor application health post-deployment

## Timeline

- **Phase 1**: 1 hour (Migration runner implementation)
- **Phase 2**: 1 hour (Deployment integration)
- **Phase 3**: 30 minutes (Manual migration support)
- **Phase 4**: 30 minutes (Documentation and testing)
- **Total**: 3 hours

## Dependencies

- Access to production database
- Cloud Build/Run deployment permissions
- Existing migration files in `/backend/database/migrations/`
- PostgreSQL client libraries

## Notes

- This fix has already been partially implemented by the tech-lead-architect agent
- Key files have been created but need to be deployed
- Once deployed, this will prevent future migration issues
- Consider adding migration status monitoring for ongoing visibility