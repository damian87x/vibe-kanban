# Technical Specification

> Integration Health Monitoring System
> Technical Design Document

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│   Backend API    │────▶│    Database     │
│  Health Status  │     │  Health Service  │     │  Health Tables  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌──────────────────┐              │
         └─────────────▶│  Background Jobs │──────────────┘
                        │  Health Checker  │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  MCP Providers   │
                        │ Composio/Klavis  │
                        └──────────────────┘
```

## Database Schema

### integration_health_checks
```sql
CREATE TABLE integration_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES user_integrations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  service VARCHAR(50) NOT NULL, -- gmail, calendar, slack
  provider VARCHAR(50) NOT NULL, -- composio, klavis
  status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
  response_time_ms INTEGER,
  last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_check_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consecutive_failures INTEGER DEFAULT 0,
  error_message TEXT,
  error_code VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_health_user_service (user_id, service),
  INDEX idx_health_next_check (next_check_at),
  INDEX idx_health_status (status)
);
```

### integration_health_history
```sql
CREATE TABLE integration_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL,
  user_id UUID NOT NULL,
  service VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  error_message TEXT,
  error_code VARCHAR(50),
  
  INDEX idx_history_integration (integration_id, checked_at DESC),
  INDEX idx_history_aggregation (service, checked_at)
);

-- Partitioned by month for efficient cleanup
CREATE TABLE integration_health_history_2025_01 PARTITION OF integration_health_history
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### health_check_alerts
```sql
CREATE TABLE health_check_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL,
  user_id UUID NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- failure, degraded, recovered
  severity VARCHAR(20) NOT NULL, -- critical, warning, info
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Backend Implementation

### IntegrationHealthService
```typescript
export class IntegrationHealthService {
  constructor(
    private db: Database,
    private mcpFactory: ProviderFactory,
    private alertService: AlertingService
  ) {}

  async checkIntegrationHealth(integrationId: string): Promise<HealthCheckResult> {
    const integration = await this.getIntegration(integrationId);
    const mcpClient = this.mcpFactory.createMCPClient();
    
    const startTime = Date.now();
    try {
      // Use existing getServerStatus method
      const status = await mcpClient.getServerStatus(integration.serverInstanceId);
      const responseTime = Date.now() - startTime;
      
      // Perform service-specific health checks
      const serviceHealth = await this.performServiceCheck(integration, mcpClient);
      
      const result: HealthCheckResult = {
        status: this.determineHealthStatus(status, serviceHealth),
        responseTimeMs: responseTime,
        details: {
          serverStatus: status,
          serviceCheck: serviceHealth
        }
      };
      
      await this.saveHealthCheck(integration, result);
      return result;
    } catch (error) {
      await this.handleHealthCheckError(integration, error);
      throw error;
    }
  }

  private async performServiceCheck(
    integration: Integration,
    mcpClient: IMCPClient
  ): Promise<ServiceHealthResult> {
    switch (integration.service) {
      case 'gmail':
        return this.checkGmailHealth(integration, mcpClient);
      case 'calendar':
        return this.checkCalendarHealth(integration, mcpClient);
      case 'slack':
        return this.checkSlackHealth(integration, mcpClient);
      default:
        return { healthy: true, message: 'No specific health check' };
    }
  }

  private async checkGmailHealth(
    integration: Integration,
    mcpClient: IMCPClient
  ): Promise<ServiceHealthResult> {
    try {
      // Test basic list operation
      const result = await mcpClient.callTool(
        integration.serverInstanceId,
        'gmail_list_messages',
        { maxResults: 1 }
      );
      
      return {
        healthy: result.success,
        message: result.success ? 'Gmail API accessible' : result.error
      };
    } catch (error) {
      return {
        healthy: false,
        message: error.message
      };
    }
  }
}
```

### HealthCheckScheduler
```typescript
export class HealthCheckScheduler {
  private queue: BullQueue;
  
  constructor(
    private healthService: IntegrationHealthService,
    private db: Database
  ) {
    this.queue = new BullQueue('health-checks', {
      redis: process.env.REDIS_URL
    });
    
    this.setupWorkers();
    this.scheduleChecks();
  }

  private setupWorkers() {
    this.queue.process('check-health', async (job) => {
      const { integrationId } = job.data;
      
      try {
        await this.healthService.checkIntegrationHealth(integrationId);
        
        // Schedule next check based on result
        const nextCheck = this.calculateNextCheckTime(integrationId);
        await this.scheduleCheck(integrationId, nextCheck);
      } catch (error) {
        // Handle failures with exponential backoff
        await this.handleCheckFailure(integrationId, error);
      }
    });
  }

  private calculateNextCheckTime(integrationId: string): Date {
    // Base interval: 5 minutes
    // Exponential backoff on failures: 5m, 10m, 20m, 40m, max 1h
    const health = await this.db.getLatestHealth(integrationId);
    
    if (health.status === 'healthy') {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }
    
    const backoffMinutes = Math.min(
      5 * Math.pow(2, health.consecutiveFailures),
      60
    );
    
    return new Date(Date.now() + backoffMinutes * 60 * 1000);
  }
}
```

## API Endpoints

### Health Status Endpoint
```typescript
// GET /api/integrations/:id/health
export const getIntegrationHealth = async (c: Context) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  
  const health = await db.query(
    `SELECT * FROM integration_health_checks 
     WHERE integration_id = $1 AND user_id = $2`,
    [id, userId]
  );
  
  const history = await db.query(
    `SELECT * FROM integration_health_history 
     WHERE integration_id = $1 
     ORDER BY checked_at DESC 
     LIMIT 100`,
    [id]
  );
  
  return c.json({
    current: health.rows[0],
    history: history.rows,
    statistics: calculateHealthStats(history.rows)
  });
};
```

### Manual Health Check Trigger
```typescript
// POST /api/integrations/:id/health/check
export const triggerHealthCheck = async (c: Context) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  
  // Rate limiting: Max 1 manual check per minute
  const rateLimitKey = `health-check:${userId}:${id}`;
  if (await redis.exists(rateLimitKey)) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  await redis.setex(rateLimitKey, 60, '1');
  
  // Trigger immediate health check
  const result = await healthService.checkIntegrationHealth(id);
  
  return c.json(result);
};
```

## Frontend Components

### IntegrationHealthStatus Component
```typescript
export const IntegrationHealthStatus: React.FC<{ integrationId: string }> = ({ 
  integrationId 
}) => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['integration-health', integrationId],
    queryFn: () => api.getIntegrationHealth(integrationId),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const triggerCheck = useMutation({
    mutationFn: () => api.triggerHealthCheck(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['integration-health', integrationId]);
    }
  });

  if (isLoading) return <HealthSkeleton />;

  return (
    <View className="flex-row items-center p-4 bg-white rounded-lg shadow">
      <HealthIndicator status={health.current.status} />
      <View className="flex-1 ml-3">
        <Text className="font-semibold">{health.service} Integration</Text>
        <Text className="text-sm text-gray-500">
          Last checked: {formatRelativeTime(health.current.lastCheckAt)}
        </Text>
        {health.current.status !== 'healthy' && (
          <Text className="text-sm text-red-600 mt-1">
            {health.current.errorMessage}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => triggerCheck.mutate()}
        disabled={triggerCheck.isLoading}
        className="px-3 py-1 bg-blue-500 rounded"
      >
        <Text className="text-white text-sm">Check Now</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Real-time Updates via WebSocket
```typescript
export const useHealthUpdates = (integrationIds: string[]) => {
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/health-updates`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ 
        type: 'subscribe', 
        integrationIds 
      }));
    };
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      // Update React Query cache
      queryClient.setQueryData(
        ['integration-health', update.integrationId],
        (old) => ({
          ...old,
          current: update.health
        })
      );
      
      // Show notification for critical failures
      if (update.health.status === 'unhealthy') {
        showNotification({
          title: 'Integration Error',
          message: `${update.service} integration is experiencing issues`,
          type: 'error'
        });
      }
    };
    
    return () => ws.close();
  }, [integrationIds]);
};
```

## Monitoring and Alerting

### Alert Configuration
```typescript
interface AlertRule {
  condition: 'consecutive_failures' | 'response_time' | 'error_rate';
  threshold: number;
  action: 'email' | 'webhook' | 'slack';
  cooldown: number; // Minutes before re-alerting
}

const defaultAlertRules: AlertRule[] = [
  {
    condition: 'consecutive_failures',
    threshold: 3,
    action: 'email',
    cooldown: 60
  },
  {
    condition: 'response_time',
    threshold: 5000, // 5 seconds
    action: 'webhook',
    cooldown: 30
  }
];
```

### System Metrics Collection
```typescript
export const collectHealthMetrics = async () => {
  const metrics = await db.query(`
    SELECT 
      service,
      status,
      COUNT(*) as count,
      AVG(response_time_ms) as avg_response_time,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time
    FROM integration_health_checks
    WHERE last_check_at > NOW() - INTERVAL '1 hour'
    GROUP BY service, status
  `);
  
  // Push to monitoring system
  await prometheus.push({
    jobName: 'integration_health',
    metrics: transformToPrometheus(metrics.rows)
  });
};
```

## Performance Optimizations

1. **Batch Health Checks**: Group checks by provider to reduce API calls
2. **Caching**: Cache successful health results for 1 minute
3. **Connection Pooling**: Reuse MCP client connections
4. **Async Processing**: Non-blocking health checks in background
5. **Database Indexing**: Optimized queries for dashboard performance

## Error Handling

1. **Transient Failures**: Automatic retry with exponential backoff
2. **OAuth Failures**: Trigger re-authentication flow
3. **Provider Outages**: Mark all integrations as degraded
4. **Network Issues**: Local caching of last known state
5. **Database Failures**: Fallback to Redis cache