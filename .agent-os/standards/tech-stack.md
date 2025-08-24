# Tech Stack

> Version: 1.0.0
> Last Updated: 2025-01-24

## Context

This file is part of the Agent OS standards system. These global tech stack defaults are referenced by all product codebases when initializing new projects. Individual projects may override these choices in their `.agent-os/product/tech-stack.md` file.

## Core Technologies

### Application Framework
- **Framework:** React Native with Expo
- **Version:** React Native 0.79.1, Expo SDK 52
- **Language:** TypeScript
- **Runtime:** React 19

### Backend Framework
- **Framework:** Hono.js
- **Version:** Latest stable
- **API Layer:** tRPC
- **Port:** 3001

### Database
- **Primary:** PostgreSQL
- **Version:** 17+
- **ORM:** Prisma (or raw SQL with pg)
- **Connection:** Pooled connections

## Frontend Stack

### Mobile Framework
- **Framework:** React Native
- **Platform:** Expo managed workflow
- **Navigation:** Expo Router v5 (file-based)
- **Version:** Latest SDK

### Import Strategy
- **Strategy:** ES Modules with TypeScript
- **Package Manager:** npm
- **Node Version:** 22 LTS
- **Path Aliases:** @/ for project root

### CSS Framework
- **Framework:** NativeWind (TailwindCSS for React Native)
- **Version:** Latest stable
- **Styling:** Tailwind utility classes

### State Management
- **Library:** Zustand
- **Persistence:** AsyncStorage
- **Pattern:** Store-based architecture

## Assets & Media

### Fonts
- **Provider:** Google Fonts
- **Loading Strategy:** Self-hosted for performance

### Icons
- **Library:** Lucide React Native
- **Implementation:** React Native components
- **Alternative:** Expo Vector Icons

## Infrastructure

### Application Hosting
- **Platform:** Digital Ocean
- **Service:** App Platform / Droplets
- **Region:** Primary region based on user base

### Database Hosting
- **Provider:** Digital Ocean
- **Service:** Managed PostgreSQL
- **Backups:** Daily automated

### Asset Storage
- **Provider:** Amazon S3
- **CDN:** CloudFront
- **Access:** Private with signed URLs

## Deployment

### CI/CD Pipeline
- **Platform:** GitHub Actions
- **Trigger:** Push to main/staging branches
- **Tests:** Run before deployment

### Environments
- **Production:** main branch
- **Staging:** staging branch
- **Review Apps:** PR-based (optional)

## Development Tools

### CLI Tools
- **Expo CLI:** Via Rork wrapper
- **TypeScript:** tsx for scripts
- **Linting:** ESLint with React Native config
- **Formatting:** Prettier

### Testing Framework
- **Unit Tests:** Jest with React Native preset
- **E2E Tests:** Playwright for web
- **BDD Tests:** Custom BDD helpers
- **Coverage Target:** 90%+

### Provider Integration
- **Pattern:** Factory pattern with interfaces
- **Mock Mode:** Mockoon for development
- **OAuth Providers:** Klavis/Composio abstraction
- **AI Providers:** OpenRouter, LiteLLM

## Mobile Specific

### Platform Support
- **iOS:** Via Expo Go or custom dev client
- **Android:** Via Expo Go or custom dev client
- **Web:** First-class support via React Native Web

### Development Server
- **Frontend:** Port 8081 (web)
- **Backend:** Port 3001
- **Tunnel:** ngrok for mobile device testing

---

*Customize this file with your organization's preferred tech stack. These defaults are used when initializing new projects with Agent OS.*
