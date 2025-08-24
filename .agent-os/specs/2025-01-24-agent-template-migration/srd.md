# Agent Template Database Migration Specification

**Priority**: P0 (Critical)  
**Status**: Partially Implemented  
**Last Updated**: 2025-01-24

## Executive Summary

Currently, agent templates are hardcoded in `/backend/database/data/agent-templates-v2.ts`, which prevents dynamic updates without code deployment. This specification outlines the complete migration to a database-driven system that allows runtime management of agent templates through an admin interface.

## Current State Analysis

### What's Already Implemented
1. **Database Schema**: Tables `agent_templates_v2` and `workflow_templates` exist with proper structure
2. **Read-Only API**: Basic GET endpoints in `/backend/trpc/routes/templates.ts`
3. **Frontend Integration**: Templates page already fetches from API via `trpc.templates.getAgentTemplatesV2`
4. **Seeding Script**: `backend/database/seed-agent-templates-v2.ts` populates initial data

### What's Missing
1. **CRUD API Endpoints**: Create, Update, Delete operations for templates
2. **Admin UI**: Interface for managing templates
3. **Version Control**: Template versioning and rollback capabilities
4. **Audit Trail**: Track who modified templates and when
5. **Template Validation**: Business logic validation for template changes
6. **Migration Strategy**: Safe transition from hardcoded to database templates

## Requirements

### Functional Requirements

#### 1. Template Management API
- **Create Template**: Add new agent templates with validation
- **Update Template**: Modify existing templates with version tracking
- **Delete Template**: Soft delete with ability to restore
- **Clone Template**: Create copies for easy customization
- **Import/Export**: JSON format for backup and sharing

#### 2. Admin Interface
- **Template List View**: Searchable, filterable grid with usage stats
- **Template Editor**: Form-based editor with live preview
- **Workflow Builder**: Visual editor for default workflows
- **Version History**: View and restore previous versions
- **Bulk Operations**: Enable/disable multiple templates

#### 3. Template Versioning
- **Version Tracking**: Each change creates a new version
- **Rollback**: Restore to any previous version
- **Change Log**: Document what changed and why
- **Draft Mode**: Work on changes without affecting live templates

#### 4. Access Control
- **Role-Based**: Only admins can modify templates
- **Approval Workflow**: Optional review process for changes
- **API Key Access**: Programmatic template management

### Non-Functional Requirements

1. **Performance**: Template fetching < 100ms at 95th percentile
2. **Availability**: Zero downtime during template updates
3. **Scalability**: Support 10,000+ templates
4. **Security**: Audit all template modifications
5. **Backward Compatibility**: Existing agents continue working

## Technical Design

### Database Schema Updates

```sql
-- Add versioning and audit fields to agent_templates_v2
ALTER TABLE agent_templates_v2 ADD COLUMN IF NOT EXISTS
    version INTEGER DEFAULT 1,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    is_draft BOOLEAN DEFAULT false,
    published_at TIMESTAMP;

-- Create template versions table
CREATE TABLE IF NOT EXISTS agent_template_versions (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    change_description TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, version),
    FOREIGN KEY (template_id) REFERENCES agent_templates_v2(id)
);

-- Create template audit log
CREATE TABLE IF NOT EXISTS agent_template_audit (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, RESTORE
    user_id VARCHAR(255) NOT NULL,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### 1. Template CRUD Operations

```typescript
// Create new template
POST /api/trpc/templates.createAgentTemplate
{
  name: string;
  role: string;
  purpose: string;
  icon: string;
  category: string;
  requiredIntegrations: string[];
  optionalIntegrations?: string[];
  capabilities: string[];
  defaultWorkflow?: WorkflowDefinition;
  settings?: Record<string, any>;
}

// Update existing template
PUT /api/trpc/templates.updateAgentTemplate
{
  id: string;
  updates: Partial<AgentTemplate>;
  changeDescription?: string;
}

// Delete template (soft delete)
DELETE /api/trpc/templates.deleteAgentTemplate
{
  id: string;
  reason?: string;
}

// Clone template
POST /api/trpc/templates.cloneAgentTemplate
{
  sourceId: string;
  newName: string;
  modifications?: Partial<AgentTemplate>;
}
```

#### 2. Version Management

```typescript
// Get version history
GET /api/trpc/templates.getTemplateVersions
{
  templateId: string;
  limit?: number;
  offset?: number;
}

// Restore version
POST /api/trpc/templates.restoreTemplateVersion
{
  templateId: string;
  version: number;
  reason?: string;
}

// Compare versions
GET /api/trpc/templates.compareVersions
{
  templateId: string;
  version1: number;
  version2: number;
}
```

#### 3. Bulk Operations

```typescript
// Bulk enable/disable
POST /api/trpc/templates.bulkUpdateStatus
{
  templateIds: string[];
  isActive: boolean;
}

// Import templates
POST /api/trpc/templates.importTemplates
{
  templates: AgentTemplate[];
  overwriteExisting?: boolean;
}

// Export templates
GET /api/trpc/templates.exportTemplates
{
  templateIds?: string[];
  format?: 'json' | 'csv';
}
```

### Admin UI Components

#### 1. Template List Page (`/admin/templates`)
```tsx
// Features:
- DataGrid with sorting, filtering, pagination
- Quick actions: Edit, Clone, Delete, Toggle Active
- Bulk selection and operations
- Export selected templates
- Usage statistics per template
```

#### 2. Template Editor Page (`/admin/templates/[id]/edit`)
```tsx
// Features:
- Multi-step form wizard
- Live preview panel
- Integration selector with validation
- Capability builder
- Workflow visual editor
- Save as draft option
- Publish with changelog
```

#### 3. Version History Page (`/admin/templates/[id]/versions`)
```tsx
// Features:
- Timeline view of changes
- Diff viewer for version comparison
- Restore to previous version
- Change descriptions
- Author and timestamp info
```

### Migration Strategy

#### Phase 1: Database Setup (Week 1)
1. Run schema migrations to add new fields
2. Create version and audit tables
3. Implement versioning triggers
4. Set up database backups

#### Phase 2: API Development (Week 2-3)
1. Implement CRUD endpoints
2. Add version management
3. Create validation middleware
4. Build audit logging
5. Add rate limiting

#### Phase 3: Admin UI (Week 4-5)
1. Create admin route protection
2. Build template list view
3. Implement template editor
4. Add version history UI
5. Create bulk operations

#### Phase 4: Migration Execution (Week 6)
1. Run initial data migration from hardcoded templates
2. Update frontend to use only API templates
3. Remove hardcoded template imports
4. Deploy with feature flag
5. Monitor for issues

#### Phase 5: Cleanup (Week 7)
1. Remove old template constants file
2. Update documentation
3. Train admin users
4. Set up monitoring alerts
5. Performance optimization

## Security Considerations

1. **Authentication**: Admin-only access with MFA required
2. **Authorization**: Role-based permissions for template management
3. **Validation**: Strict input validation to prevent injection
4. **Sanitization**: Clean HTML/scripts from template content
5. **Rate Limiting**: Prevent abuse of template APIs
6. **Audit Trail**: Log all modifications with user context

## Monitoring & Alerts

1. **Template Usage**: Track which templates are most/least used
2. **Error Rates**: Monitor template creation/update failures
3. **Performance**: Alert on slow template queries
4. **Security**: Detect unusual modification patterns
5. **Version Drift**: Alert when many old versions exist

## Testing Strategy

### Unit Tests
- Template validation logic
- Version comparison algorithms
- Permission checks
- Data transformation

### Integration Tests
- CRUD operations end-to-end
- Version restore functionality
- Bulk operations
- Import/export

### E2E Tests
- Admin UI workflows
- Template creation journey
- Version rollback scenario
- Bulk management

### Performance Tests
- Load test with 10k templates
- Concurrent modification handling
- Query optimization validation

## Success Metrics

1. **Zero Downtime**: No service interruption during migration
2. **API Performance**: 95th percentile < 100ms
3. **Admin Efficiency**: 80% reduction in template update time
4. **Error Rate**: < 0.1% for template operations
5. **Adoption**: 100% of templates managed via admin UI within 30 days

## Rollback Plan

1. **Feature Flag**: Disable database templates, revert to hardcoded
2. **Data Backup**: Restore from pre-migration snapshot
3. **Code Revert**: Git revert to previous release
4. **Cache Clear**: Invalidate all template caches
5. **Communication**: Notify admins of temporary reversion

## Future Enhancements

1. **Template Marketplace**: Share templates between organizations
2. **AI-Generated Templates**: Use LLM to create templates from descriptions
3. **Template Analytics**: Deep insights into template performance
4. **A/B Testing**: Test template variations
5. **Template Inheritance**: Base templates with overrides

## Implementation Checklist

- [ ] Database schema migrations
- [ ] CRUD API endpoints
- [ ] Version management system
- [ ] Audit logging
- [ ] Admin UI pages
- [ ] Migration scripts
- [ ] Documentation updates
- [ ] Training materials
- [ ] Monitoring setup
- [ ] Performance testing
- [ ] Security review
- [ ] Rollback procedures

## Dependencies

1. **PostgreSQL 14+**: For JSONB and performance features
2. **tRPC**: Existing RPC framework
3. **React Admin**: Or similar admin UI framework
4. **Feature Flags**: For gradual rollout
5. **Monitoring**: DataDog or similar

## Timeline

- **Total Duration**: 7 weeks
- **Development**: 5 weeks
- **Testing & Migration**: 2 weeks
- **Buffer**: 1 week for unexpected issues

## Team Requirements

- **Backend Developer**: 1 FTE for 7 weeks
- **Frontend Developer**: 1 FTE for 3 weeks
- **QA Engineer**: 0.5 FTE for 2 weeks
- **DevOps**: 0.25 FTE for migration support

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | High | Low | Comprehensive backups, dry runs |
| Performance degradation | Medium | Medium | Load testing, query optimization |
| Admin UI complexity | Medium | High | User testing, iterative design |
| Breaking existing agents | High | Low | Backward compatibility layer |
| Security vulnerabilities | High | Medium | Security audit, penetration testing |

## Conclusion

This migration will transform agent template management from a developer-dependent process to a self-service admin capability. The phased approach ensures minimal risk while delivering immediate value. With proper execution, this will significantly reduce operational overhead and enable rapid template iteration.