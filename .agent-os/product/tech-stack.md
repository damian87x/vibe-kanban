# Tech Stack

> Product: TaskPilot AI Workspace
> Version: 1.0.0
> Last Updated: 2025-07-26

## Overview

TaskPilot AI is built with a modern, scalable architecture using React Native for cross-platform mobile and web support, backed by a robust Node.js API layer.

## Frontend

### Core Framework
- **React Native** 0.79.1 - Cross-platform mobile framework
- **Expo** SDK 52 - Development platform and tooling
- **React** 19 - UI library
- **TypeScript** - Type-safe development

### Navigation & UI
- **Expo Router** v5 - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **React Native Reanimated** - Smooth animations
- **Expo Vector Icons** - Icon library

### State Management
- **Zustand** 5.0 - State management
- **AsyncStorage** - Persistent storage
- **React Query** (via tRPC) - Server state management

### Development Tools
- **Rork** - Expo development wrapper
- **Metro** - JavaScript bundler
- **Babel** - JavaScript transpiler
- **Module resolver** - Path aliasing (@/)
- **Mockoon** - Mock API server for development

## Backend

### Core Framework
- **Node.js** 20 - JavaScript runtime
- **Hono** 4.6 - Web framework
- **TypeScript** - Type-safe development
- **tRPC** 11.0 - End-to-end typesafe APIs

### Database
- **PostgreSQL** 17 - Primary database
- **pg** - PostgreSQL client (no ORM)
- **Connection pooling** - Built-in pooling
- **Manual migrations** - SQL migration files

### AI & Integrations
- **OpenRouter** - AI model routing
- **Claude API** - Anthropic's AI model
- **LiteLLM** - Model abstraction layer
- **LangChain** - AI application framework
- **MCP (Model Context Protocol)** - Tool integration

### OAuth Providers
- **Klavis** - OAuth provider (3 user limit)
- **Composio** - OAuth provider (10k user limit)
- **Provider Factory Pattern** - Abstraction layer

### Security
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - CORS middleware
- **helmet** - Security headers

## Infrastructure

### Deployment
- **Docker** - Containerization
- **Google Cloud Run** - Serverless container platform
- **Nginx** - Reverse proxy and static file serving
- **Supervisor** - Process management

### CI/CD
- **GitHub Actions** - CI/CD pipeline
- **Google Cloud Build** - Build and deploy
- **Automatic triggers** - On push to main

### Environment
- **Node.js** 20 Alpine - Production runtime
- **Environment variables** - Configuration management
- **Secret Manager** - Google Cloud secrets

## Development Dependencies

### Testing
- **Jest** - Unit testing framework
- **Playwright** - E2E testing
- **React Native Testing Library** - Component testing
- **Supertest** - API testing

### Build Tools
- **tsx** - TypeScript execution
- **concurrently** - Parallel command execution
- **nodemon** - Development auto-reload
- **webpack** - Web bundling

## External Services

### AI Providers
- **OpenRouter** - Multi-model AI routing
- **Claude (Anthropic)** - Primary AI model
- **LiteLLM Proxy** - Model management

### Storage
- **AWS S3** - File storage
- **CloudFront** - CDN (planned)

### Integrations
- **Gmail API** - Email integration
- **Google Calendar API** - Calendar integration
- **Slack API** - Team communication
- **Webhooks** - External triggers

## Production Readiness Status

### ✅ Implemented
- Core application architecture
- Authentication and authorization (JWT + bcrypt)
- Database setup with PostgreSQL
- Docker multi-stage build pipeline
- OAuth integrations (Klavis/Composio abstraction)
- E2E test suite with 70%+ coverage
- BDD test framework
- Mock provider system
- Production deployment to Cloud Run
- SSL support for database connections

### ⚠️ Required for Production
- HTTPS/SSL configuration
- Production logging service
- Error tracking (Sentry)
- Distributed rate limiting
- Database migration tracking
- Environment variable validation
- Comprehensive health checks

### 📋 Planned Improvements
- Redis for caching and sessions
- CDN for static assets
- APM monitoring
- Horizontal scaling support
- Automated backups

## Version Information

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 20 LTS | Alpine Linux in production |
| React Native | 0.79.1 | Latest stable |
| Expo SDK | 52 | Latest version |
| PostgreSQL | 17 | Latest major version |
| TypeScript | 5.x | Strict mode enabled |
| Docker | Latest | Multi-stage builds |

---

*This tech stack is optimized for rapid development while maintaining production-grade quality and scalability.*