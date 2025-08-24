# Prisma Architecture Migration Specification

> **Specification ID**: 2025-07-27-prisma-architecture-migration  
> **Created**: 2025-07-27  
> **Status**: Ready for Implementation  
> **Priority**: Critical (Production-Blocking Issues)  
> **Estimated Effort**: 4 months  

## Overview

Migrate from the current raw SQL + PostgreSQL setup to a modern Prisma-based architecture with proper service/repository/controller patterns, while addressing critical production issues including database sync problems, hardcoded URLs, and configuration management.

## Problem Statement

### Critical Production Issues Identified

#### 1. **Database Synchronization Problems**
- **Migration System Inconsistencies**: Two separate migration runners with different behaviors
- **Disabled Migrations**: Critical migrations disabled, causing schema drift
- **Missing Database Methods**: 8+ methods called but not implemented, causing runtime failures
- **Schema Inconsistencies**: Local and production databases out of sync

#### 2. **Extensive Hardcoded URLs** 
- **123+ Hardcoded localhost URLs** in frontend and backend code
- **Environment-Specific Failures**: Deployments fail in new environments
- **No Central Configuration**: URLs scattered across multiple files
- **Test Environment Brittleness**: Tests break when URLs change

#### 3. **Architecture Debt**
- **Mixed Database Patterns**: Raw SQL, service wrappers, and extensions without consistency
- **Missing Type Safety**: Extensive use of `any` types causing runtime errors
- **No Separation of Concerns**: Business logic mixed with database access
- **Poor Error Handling**: Silent failures and inconsistent error logging

### Impact Assessment
- **Production Deployment Failures**: Database schema mismatches
- **Runtime Application Crashes**: Missing database methods
- **Environment-Specific Bugs**: Hardcoded URLs causing failures
- **Developer Productivity Loss**: Complex raw SQL maintenance
- **Testing Brittleness**: Environment-dependent test failures

## Technical Requirements

### 1. Prisma ORM Migration
- **Type-Safe Database Access** with generated Prisma client
- **Unified Migration System** with proper rollback capabilities  
- **Schema Introspection** for development productivity
- **Connection Pooling Optimization** with automatic retry logic
- **Query Performance Monitoring** with built-in analytics

### 2. Service/Repository/Controller Architecture
- **Repository Layer** for clean data access abstraction
- **Service Layer** for business logic and orchestration
- **Controller Layer** for API request handling and validation
- **Dependency Injection** for testability and modularity
- **Clean Architecture Principles** with proper separation of concerns

### 3. Hybrid API Strategy (REST + GraphQL + tRPC)
- **tRPC** for type-safe internal app operations
- **REST API** for file uploads, webhooks, and public endpoints
- **GraphQL** for complex queries, analytics, and admin dashboards
- **Unified Frontend Client** with consistent error handling
- **API Strategy Documentation** with clear use case guidelines

### 4. Database-Driven Configuration System
- **Runtime Configuration Changes** without deployments
- **Environment-Specific Overrides** with fallback mechanisms
- **Admin Interface** for configuration management
- **Configuration History Tracking** with audit trails
- **Feature Flag Support** for safe rollouts

### 5. Environment Configuration Standardization
- **Centralized URL Configuration** with environment detection
- **Dynamic API Base URL Resolution** based on deployment context
- **Test Environment Stability** with consistent configuration
- **Production-Ready Deployment** with proper environment handling

## User Stories

### As a Developer
- **US-1**: As a developer, I want type-safe database operations, so I can catch errors at compile time
- **US-2**: As a developer, I want consistent migration handling, so deployments don't fail due to schema issues
- **US-3**: As a developer, I want clean architecture separation, so I can test and maintain code easily
- **US-4**: As a developer, I want environment-agnostic configuration, so deployments work in any environment

### As a DevOps Engineer
- **US-5**: As a DevOps engineer, I want reliable database migrations, so I can deploy with confidence
- **US-6**: As a DevOps engineer, I want runtime configuration changes, so I don't need deployments for config updates
- **US-7**: As a DevOps engineer, I want proper environment handling, so the same code works across all environments

### As a System Administrator
- **US-8**: As a system admin, I want database health monitoring, so I can proactively address issues
- **US-9**: As a system admin, I want configuration audit trails, so I can track changes and rollback if needed
- **US-10**: As a system admin, I want feature flags, so I can control feature rollouts safely

## Implementation Scope

### Phase 1: Critical Fixes (Month 1)
✅ Fix missing database methods (production-blocking)  
✅ Implement Prisma ORM with core tables  
✅ Create service/repository foundation  
✅ Replace hardcoded URLs with environment configuration  
✅ Establish proper migration system  

### Phase 2: Architecture Foundation (Month 2)  
✅ Complete service/repository/controller pattern  
✅ Implement dependency injection container  
✅ Add comprehensive error handling  
✅ Create database-driven configuration system  
✅ Add monitoring and health checks  

### Phase 3: API Strategy (Month 3)
✅ Implement REST API layer for file uploads/webhooks  
✅ Add GraphQL for analytics and admin features  
✅ Create unified frontend API client  
✅ Migrate complex components to appropriate API types  
✅ Add caching and performance optimization  

### Phase 4: Production Readiness (Month 4)
✅ Comprehensive testing across all layers  
✅ Performance optimization and monitoring  
✅ Documentation and deployment guides  
✅ Admin interfaces for configuration management  
✅ Production deployment with health monitoring  

### Out of Scope
❌ Complete database schema redesign  
❌ Real-time subscriptions implementation  
❌ Microservices architecture migration  
❌ Third-party service replacements  

## Architecture Design

### Database Layer with Prisma

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email                String              @unique @db.VarChar(255)
  name                 String?             @db.VarChar(255)
  passwordHash         String              @map("password_hash") @db.VarChar(255)
  createdAt           DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime            @updatedAt @map("updated_at") @db.Timestamptz
  lastLogin           DateTime?           @map("last_login") @db.Timestamptz
  
  // Relations
  agents               UserAgent[]
  integrations         Integration[]
  workflows            UserWorkflow[]
  
  @@map("users")
}

model AgentTemplate {
  id                    String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                  String    @db.VarChar(255)
  role                  String?   @db.Text
  purpose               String?   @db.Text
  icon                  String?   @db.VarChar(100)
  category              String?   @db.VarChar(100)
  requiredIntegrations  String[]  @map("required_integrations")
  capabilities          String[]
  defaultWorkflow       Json?     @map("default_workflow")
  isActive              Boolean   @default(true) @map("is_active")
  usageCount            Int       @default(0) @map("usage_count")
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  userAgents           UserAgent[]
  
  @@map("agent_templates_v2")
}

model UserAgent {
  id                   String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId               String              @map("user_id") @db.Uuid
  templateId           String?             @map("template_id") @db.Uuid
  name                 String              @db.VarChar(255)
  description          String?             @db.Text
  icon                 String?             @db.VarChar(100)
  category             String?             @db.VarChar(50)
  goal                 String?             @db.Text
  requiredIntegrations Json                @default("[]") @map("required_integrations")
  steps                Json                @default("[]")
  config               Json                @default("{}")
  isActive             Boolean             @default(true) @map("is_active")
  isFavorite           Boolean             @default(false) @map("is_favorite")
  lastUsed            DateTime?           @map("last_used") @db.Timestamptz
  executionCount       Int                 @default(0) @map("execution_count")
  createdAt           DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime            @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  user                 User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  template             AgentTemplate?      @relation(fields: [templateId], references: [id], onDelete: SetNull)
  executions           AgentExecution[]
  
  @@map("user_agents")
}

// Configuration management
model ConfigurationSetting {
  id           String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key          String                    @unique @db.VarChar(255)
  value        Json
  description  String?                   @db.Text
  environment  String                    @default("all") @db.VarChar(50)
  isActive     Boolean                   @default(true) @map("is_active")
  isSensitive  Boolean                   @default(false) @map("is_sensitive")
  createdBy    String?                   @map("created_by") @db.Uuid
  createdAt    DateTime                  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime                  @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  history      ConfigurationHistory[]
  
  @@map("configuration_settings")
}
```

### Service/Repository Architecture

```typescript
// backend/repositories/base-repository.ts
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected prisma: PrismaClient) {}
  
  abstract create(data: CreateInput): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findMany(filter?: any): Promise<T[]>;
}

// backend/repositories/agent-repository.ts
export class AgentRepository extends BaseRepository<UserAgent, CreateAgentInput, UpdateAgentInput> {
  async create(data: CreateAgentInput): Promise<UserAgent> {
    return this.prisma.userAgent.create({
      data,
      include: { template: true, user: { select: { id: true, email: true } } }
    });
  }
  
  async findByUserId(userId: string, options?: FindOptions): Promise<UserAgent[]> {
    return this.prisma.userAgent.findMany({
      where: { 
        userId,
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.category && { category: options.category }),
      },
      include: {
        template: true,
        _count: { select: { executions: true } }
      },
      orderBy: [
        { isFavorite: 'desc' },
        { lastUsed: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }
  
  async updateWithTransaction<R>(
    id: string, 
    data: UpdateAgentInput,
    transactionCallback?: (tx: PrismaTransaction) => Promise<R>
  ): Promise<UserAgent> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.userAgent.update({
        where: { id },
        data,
        include: { template: true }
      });
      
      if (transactionCallback) {
        await transactionCallback(tx);
      }
      
      return updated;
    });
  }
}

// backend/services/agent-service.ts
export class AgentService {
  constructor(
    private agentRepository: AgentRepository,
    private templateRepository: TemplateRepository,
    private integrationService: IntegrationService,
    private configService: ConfigurationService
  ) {}
  
  async createAgent(input: CreateAgentInput, userId: string): Promise<UserAgent> {
    const config = await this.configService.getConfiguration();
    
    // Business rule: Check user's agent limit
    const userAgentCount = await this.agentRepository.countByUserId(userId);
    if (userAgentCount >= config.features.maxAgentsPerUser) {
      throw new BusinessError('Agent limit exceeded', 'AGENT_LIMIT_EXCEEDED');
    }
    
    // Business rule: Validate required integrations
    await this.validateRequiredIntegrations(input.requiredIntegrations, userId);
    
    // Create agent with business logic
    const agent = await this.agentRepository.create({
      ...input,
      userId,
      config: this.buildDefaultConfig(input, config),
    });
    
    return agent;
  }
}

// backend/controllers/agent-controller.ts
export class AgentController {
  constructor(
    private agentService: AgentService,
    private authService: AuthService
  ) {}
  
  async createAgent(input: CreateAgentInput, context: TRPCContext): Promise<AgentResponseDTO> {
    await this.authService.requirePermission(context.user.id, 'agent:create');
    
    const agent = await this.agentService.createAgent(input, context.user.id);
    
    return this.formatAgentResponse(agent);
  }
}
```

### Hybrid API Strategy

```typescript
// backend/api/routes.ts
export const API_STRATEGY = {
  // tRPC for type-safe internal operations
  trpc: [
    'agent-management',
    'user-preferences', 
    'workflow-execution',
    'real-time-chat'
  ],
  
  // REST for specific use cases
  rest: [
    'file-uploads',
    'webhook-endpoints', 
    'oauth-callbacks',
    'health-monitoring',
    'public-apis'
  ],
  
  // GraphQL for complex queries
  graphql: [
    'analytics-dashboard',
    'admin-interface',
    'complex-reporting',
    'data-exploration'
  ]
};

// Unified frontend client
export class APIClient {
  async uploadFile(file: File, type: 'avatar' | 'document'): Promise<UploadResult> {
    return this.restClient.post(`/upload/${type}`, formData);
  }
  
  async getAnalytics(): Promise<DashboardData> {
    return this.graphqlClient.request(DASHBOARD_QUERY);
  }
  
  get agents() {
    return this.trpcClient.agents; // Type-safe
  }
}
```

### Configuration Management

```typescript
// Database-driven configuration with environment overrides
export class ConfigurationService {
  async getConfiguration(): Promise<AppConfiguration> {
    const settings = await this.loadFromDatabase();
    const config = this.mergeWithDefaults(settings);
    return this.applyEnvironmentOverrides(config);
  }
  
  async updateSetting(key: string, value: any, userId: string): Promise<void> {
    await this.recordConfigurationChange(key, value, userId);
    await this.updateDatabase(key, value);
    this.clearCache();
    this.notifyServices(key, value);
  }
}
```

## Acceptance Criteria

### Phase 1 - Critical Fixes (Month 1)
- [ ] All missing database methods implemented and tested
- [ ] Prisma client installed and configured for core tables
- [ ] Hardcoded URLs replaced with environment configuration
- [ ] Unified migration system with proper rollback capabilities
- [ ] Production deployments succeed without database errors

### Phase 2 - Architecture Foundation (Month 2)
- [ ] Complete service/repository/controller pattern implemented
- [ ] Dependency injection container with all services registered
- [ ] Comprehensive error handling with proper logging
- [ ] Database-driven configuration system with admin interface
- [ ] Health monitoring and performance metrics collection

### Phase 3 - API Strategy (Month 3)
- [ ] REST API endpoints for file uploads and webhooks
- [ ] GraphQL schema for analytics and admin operations
- [ ] Unified frontend API client with consistent error handling
- [ ] Performance optimization with caching and connection pooling
- [ ] API documentation with clear usage guidelines

### Phase 4 - Production Readiness (Month 4)
- [ ] Comprehensive testing suite with 90%+ coverage
- [ ] Performance benchmarks meet or exceed current system
- [ ] Complete documentation for development and operations
- [ ] Admin interfaces for all configuration management
- [ ] Production deployment with zero-downtime migration

### Quality Assurance
1. **Type Safety**: 100% TypeScript coverage with strict mode
2. **Performance**: Response times within 20% of current system
3. **Reliability**: 99.9% uptime with proper error handling
4. **Maintainability**: Code complexity reduced by 30%
5. **Testing**: Unit, integration, and E2E tests with CI/CD

## Risk Assessment

### High Risk
- **Database Migration Complexity**: Schema changes in production environment
- **Performance Impact**: Prisma overhead compared to raw SQL
- **Learning Curve**: Team adaptation to new architecture patterns

### Medium Risk  
- **API Strategy Complexity**: Multiple API types increasing maintenance
- **Configuration Migration**: Moving hardcoded values safely
- **Testing Coverage**: Ensuring comprehensive test coverage

### Low Risk
- **Type Safety Improvements**: Prisma provides better type safety than current
- **Development Productivity**: Better tooling and abstractions
- **Code Maintainability**: Cleaner architecture patterns

### Mitigation Strategies
- **Gradual Migration**: Phase-by-phase implementation with rollback plans
- **Comprehensive Testing**: Extensive testing at each phase
- **Performance Monitoring**: Continuous monitoring during migration
- **Team Training**: Documentation and knowledge transfer sessions
- **Feature Flags**: Safe rollout with ability to disable new features

## Success Metrics

### Technical Metrics
- **Type Safety**: 0 runtime type errors
- **Performance**: Response times within 95th percentile of current system
- **Code Quality**: Reduced cyclomatic complexity by 30%
- **Test Coverage**: 90%+ coverage across all layers
- **Error Rate**: < 1% error rate across all operations

### Operational Metrics
- **Deployment Success**: 100% successful deployments across environments
- **Configuration Changes**: Runtime config changes without downtime
- **Database Health**: 99.9% database operation success rate
- **API Performance**: < 200ms average response time
- **Developer Productivity**: 50% reduction in development time for new features

### Business Metrics
- **System Reliability**: Zero production outages due to database issues
- **Feature Velocity**: 25% faster feature development
- **Maintenance Cost**: 40% reduction in bug fix time
- **Scalability**: System supports 10x current load
- **User Experience**: No degradation in application performance

## Implementation Timeline

### Month 1: Critical Production Fixes
- **Week 1**: Fix missing database methods, implement core Prisma models
- **Week 2**: Replace hardcoded URLs, establish environment configuration
- **Week 3**: Create service/repository foundation, basic error handling
- **Week 4**: Unified migration system, production deployment testing

### Month 2: Architecture Foundation  
- **Week 5-6**: Complete service/repository/controller implementation
- **Week 7**: Dependency injection container and configuration system
- **Week 8**: Health monitoring, performance metrics, comprehensive testing

### Month 3: API Strategy Implementation
- **Week 9-10**: REST API layer and GraphQL implementation
- **Week 11**: Unified frontend client and API migration
- **Week 12**: Performance optimization and caching strategies

### Month 4: Production Readiness
- **Week 13-14**: Comprehensive testing and documentation
- **Week 15**: Admin interfaces and configuration management
- **Week 16**: Production deployment and monitoring setup

This specification provides a comprehensive roadmap for migrating to a modern, scalable architecture while addressing critical production issues that are currently blocking reliable deployments.