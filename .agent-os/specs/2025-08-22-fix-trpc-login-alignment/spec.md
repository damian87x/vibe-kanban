# Spec Requirements Document

> Spec: Fix tRPC Login System & Backend Structure Alignment
> Created: 2025-08-22
> Status: Planning

## Overview

Fix the broken tRPC-based login system by resolving client-server communication issues and align the backend folder structure with the main branch, ensuring the application has a unified tRPC-only architecture while maintaining essential non-tRPC endpoints for webhooks and OAuth callbacks.

## User Stories

### Authentication System Recovery

As a business professional, I want to log into the TaskPilot AI workspace with my credentials, so that I can access my personalized AI assistant and automation workflows without encountering transformation errors or server communication failures.

**Detailed Workflow:**
1. User enters email and password in the login form
2. Frontend sends properly formatted tRPC request with superjson serialization
3. Backend processes the request through the complete tRPC router structure
4. User receives successful authentication and is redirected to the dashboard
5. Session persistence works correctly across browser refreshes

### Complete tRPC Router Restoration

As a developer, I want all essential tRPC routers restored from the main branch, so that the application has complete feature coverage and users can access all TaskPilot functionality without encountering missing procedure errors.

**Detailed Workflow:**
1. Compare current simplified tRPC structure with main branch comprehensive structure
2. Restore all 15+ missing tRPC router modules (workflows, agents, knowledge, integrations, ai, mcp, etc.)
3. Import and wire all router dependencies correctly
4. Test each restored router for proper functionality
5. Ensure superjson transformation works across all endpoints

### Complete Feature Access

As a user, I want access to all TaskPilot features (workflows, agents, knowledge management, integrations), so that I can perform comprehensive business automation tasks without encountering missing router errors.

**Detailed Workflow:**
1. All essential routers restored: workflows, agents, knowledge, integrations, AI, MCP, health
2. Frontend can successfully communicate with all backend features
3. Navigation between features works without tRPC procedure errors
4. All existing functionality preserved during the structural migration

## Spec Scope

1. **tRPC Client-Server Communication Fix** - Resolve superjson transformation issues between frontend and backend
2. **Complete tRPC Router Restoration** - Restore all 15+ missing tRPC routers from main branch (workflows, agents, knowledge, integrations, ai, mcp, health, metrics, voice, etc.)
3. **Router Dependencies Resolution** - Import and configure all router dependencies and services
4. **Architecture Cleanup** - Establish clear tRPC-only policy with documented exceptions for webhooks/OAuth
5. **Feature Coverage Verification** - Ensure all TaskPilot features are accessible through restored tRPC endpoints

## Out of Scope

- New feature development
- UI/UX design changes  
- Performance optimization beyond fixing the communication issues
- Database schema modifications
- New OAuth provider integrations
- Backend folder relocation (keeping current src/backend structure)

## Expected Deliverable

1. **Working Login System** - Users can successfully authenticate through the web interface without tRPC transformation errors
2. **Complete tRPC Router Coverage** - All 15+ essential tRPC routers restored and functional (workflows, agents, knowledge, integrations, ai, mcp, health, metrics, voice, etc.)
3. **Full Feature Access** - All TaskPilot features accessible through properly functioning tRPC endpoints without missing procedure errors