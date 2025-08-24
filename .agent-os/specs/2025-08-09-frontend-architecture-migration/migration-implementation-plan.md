# Practical Migration Implementation Plan

## Why We'll Never Finish With Current Approach

Looking at the git history and current issues:
- Integration errors persisting for weeks
- OAuth flow broken in multiple places
- Each fix creates new bugs
- No end in sight

**Reality**: Fixing the current codebase is like patching a sinking ship.

## New Approach: Start Fresh, Migrate Gradually

### Week 1: New Foundation (While Current App Runs)

```bash
# Step 1: Create new Next.js app alongside current one
npx create-next-app@latest web --typescript --tailwind --app

# Step 2: Set up monorepo structure
mkdir packages
mv backend packages/
mv web packages/
```

**File Structure**:
```
taskpilot/
├── apps/
│   ├── expo/          # Current app (keep running)
│   └── web/           # New Next.js app
├── packages/
│   ├── backend/       # Existing backend
│   ├── ui/            # New component library
│   └── api/           # GraphQL gateway
```

### Week 2: First Working Feature (Dashboard)

**Day 1-2**: GraphQL Gateway
```typescript
// packages/api/src/schema.ts
import { createYoga } from 'graphql-yoga'
import { trpcClient } from './trpc-wrapper'

// Wrap existing tRPC endpoints
const typeDefs = `
  type User {
    id: ID!
    email: String!
    integrations: [Integration!]!
  }
  
  type Integration {
    id: ID!
    service: String!
    status: String!
  }
  
  type Query {
    me: User
    integrations: [Integration!]!
  }
`

// Reuse existing backend logic
const resolvers = {
  Query: {
    me: (_, __, context) => context.user,
    integrations: async (_, __, context) => {
      // Call existing tRPC endpoint
      return trpcClient.integrations.list.query()
    }
  }
}
```

**Day 3-4**: New Dashboard Page
```typescript
// apps/web/app/dashboard/page.tsx
import { gql, useQuery } from '@apollo/client'

const DASHBOARD_QUERY = gql`
  query Dashboard {
    me {
      email
      integrations {
        service
        status
      }
    }
  }
`

export default function Dashboard() {
  const { data, loading, error } = useQuery(DASHBOARD_QUERY)
  
  // Proper error boundary
  if (error) return <ErrorFallback error={error} />
  if (loading) return <DashboardSkeleton />
  
  return (
    <div className="grid gap-6">
      <WelcomeCard user={data.me} />
      <IntegrationsCard integrations={data.me.integrations} />
    </div>
  )
}
```

**Day 5**: Deploy Preview
- Deploy to Vercel preview URL
- Test with real users
- Keep old app running

### Week 3: Fix Integrations (The Broken Part)

**New Integration Flow**:
```typescript
// apps/web/app/integrations/page.tsx
export default function IntegrationsPage() {
  return (
    <IntegrationProvider>
      <IntegrationsList />
      <IntegrationDetails />
    </IntegrationProvider>
  )
}

// features/integrations/components/IntegrationsList.tsx
function IntegrationsList() {
  const { integrations, connect, disconnect } = useIntegrations()
  
  return (
    <div className="grid gap-4">
      {AVAILABLE_INTEGRATIONS.map(integration => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onConnect={() => connect(integration)}
          onDisconnect={() => disconnect(integration)}
        />
      ))}
    </div>
  )
}

// features/integrations/hooks/useIntegrations.ts
function useIntegrations() {
  const [connectMutation] = useMutation(CONNECT_INTEGRATION)
  
  const connect = async (integration: Integration) => {
    // Proper error handling
    try {
      const { data } = await connectMutation({
        variables: { provider: integration.provider },
        // Optimistic update
        optimisticResponse: {
          connectIntegration: {
            ...integration,
            status: 'CONNECTING'
          }
        }
      })
      
      // Open OAuth in new window
      window.open(data.connectIntegration.authUrl, '_blank')
      
      // Start polling for status
      startPolling(integration.id)
    } catch (error) {
      showError('Failed to connect integration')
    }
  }
  
  return { integrations, connect, disconnect }
}
```

### Week 4: Progressive Migration

**Feature Flags**:
```typescript
// lib/features.ts
export const features = {
  newDashboard: process.env.NEXT_PUBLIC_NEW_DASHBOARD === 'true',
  newIntegrations: process.env.NEXT_PUBLIC_NEW_INTEGRATIONS === 'true',
  newWorkflows: process.env.NEXT_PUBLIC_NEW_WORKFLOWS === 'true',
}

// Gradual rollout
if (features.newDashboard) {
  router.push('https://new.taskpilot.ai/dashboard')
} else {
  router.push('/dashboard') // Old app
}
```

### Week 5: Mobile Strategy

**Option 1**: Progressive Web App
```typescript
// apps/web/app/manifest.ts
export default function manifest() {
  return {
    name: 'TaskPilot AI',
    short_name: 'TaskPilot',
    description: 'AI-powered task automation',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
```

**Option 2**: React Native Rewrite (Later)
- Share GraphQL client
- Share business logic
- Native UI components

## Success Metrics

### Week 1-2 Success
- [ ] New app deployed to preview URL
- [ ] Dashboard loading in < 2 seconds
- [ ] Error boundaries working
- [ ] Users can log in

### Week 3-4 Success  
- [ ] Integrations actually work
- [ ] OAuth flow completes
- [ ] Status updates in real-time
- [ ] No white screen errors

### Week 5-6 Success
- [ ] 50% of traffic on new app
- [ ] Performance metrics improved
- [ ] Bug reports decreased
- [ ] Developer velocity increased

## Why This Will Actually Work

1. **Clean Slate**: No legacy code to work around
2. **Modern Stack**: Best practices by default
3. **Incremental**: Can stop/start anytime
4. **Low Risk**: Old app keeps running
5. **Fast Feedback**: Deploy daily, test with users

## Implementation Checklist

### Immediate Actions
- [ ] Create Next.js app
- [ ] Set up Vercel deployment
- [ ] Create GraphQL gateway
- [ ] Build component library
- [ ] Migrate authentication

### This Week
- [ ] Dashboard page
- [ ] Error boundaries
- [ ] Loading states
- [ ] Basic styling

### Next Week
- [ ] Integrations page
- [ ] OAuth flow
- [ ] Status polling
- [ ] Error handling

### Following Week
- [ ] Workflows page
- [ ] Agents page
- [ ] Knowledge base
- [ ] Search functionality

## The Key Difference

Instead of:
```
Fix bug → Create new bug → Fix new bug → Create another bug → ∞
```

We get:
```
Build right → Test → Deploy → Move to next feature → ✓
```

## Final Note

The current frontend is beyond repair. The integration errors, state management issues, and performance problems are symptoms of fundamental architectural flaws. 

Starting fresh with a modern stack is the only way to deliver a quality product in a reasonable timeframe. The incremental migration ensures we can keep serving users while building a better future.