# Spec Requirements Document

> Spec: Fix Hardcoded URLs for Production
> Created: 2025-07-26
> Status: Planning

## Overview

Replace all hardcoded localhost URLs with environment variables to enable proper OAuth flows and API communications in production environments. This is a critical blocker for production deployment.

## User Stories

### OAuth Flow Fix

As a user, I want to complete OAuth integrations successfully in production, so that I can connect my Gmail, Calendar, and Slack accounts.

Currently, OAuth redirects are hardcoded to `http://localhost:8081`, causing failures in production where the actual URL is different. After OAuth authorization, users are redirected to localhost instead of the production domain.

### API Communication Fix

As a developer, I want the application to use correct API endpoints in all environments, so that frontend-backend communication works properly regardless of deployment location.

## Spec Scope

1. **OAuth Redirect URLs** - Replace hardcoded localhost URLs in OAuth flows with environment variables
2. **API Base URL Configuration** - Ensure all API calls use proper base URLs from environment
3. **Callback URL Management** - Fix OAuth callback URLs to work in any environment
4. **Environment Variable Documentation** - Document all required URL environment variables

## Out of Scope

- SSL/TLS configuration (separate task)
- CORS configuration (separate task)
- Database connection strings (already using env vars)
- Third-party API endpoints (not localhost)

## Expected Deliverable

1. All hardcoded localhost URLs replaced with environment variables
2. OAuth flows work correctly in production
3. Clear documentation of required environment variables
4. Backwards compatibility maintained for local development