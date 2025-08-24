# Workflow Trigger Monitoring System - API Specification

## API Overview

This document provides detailed API specifications for the workflow trigger monitoring system, including request/response formats, authentication requirements, and error handling.

## Base URL
```
Production: https://api.yourapp.com/api
Development: http://localhost:3001/api
```

## Authentication
All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Trigger Management

#### 1.1 Create Workflow Trigger
Creates a new trigger for a workflow.

**Endpoint:** `POST /workflows/:workflowId/triggers`

**Request Body:**
```typescript
{
  "triggerType": "webhook" | "schedule" | "email" | "integration",
  "config": {
    // Type-specific configuration (see below)
  },
  "conditions": [
    {
      "conditionType": "field_match" | "expression" | "custom",
      "fieldPath": "payload.status", // JSONPath to field
      "operator": "equals" | "contains" | "greater_than" | "less_than" | "regex" | "exists",
      "expectedValue": any, // Value to compare against
      "isRequired": boolean // Default: true
    }
  ],
  "authConfig": {
    "requireSignature": boolean,
    "ipWhitelist": string[], // Optional IP restrictions
    "apiKeyName": string // Header name for API key
  },
  "rateLimitConfig": {
    "maxExecutions": number, // Max executions per window
    "windowSeconds": number, // Time window in seconds
    "strategy": "sliding" | "fixed" // Rate limit strategy
  },
  "notificationConfig": {
    "onSuccess": boolean,
    "onFailure": boolean,
    "channels": ["email", "slack", "in-app"],
    "webhookUrl": string // Optional webhook for notifications
  },
  "isActive": boolean // Default: true
}
```

**Type-Specific Configurations:**

*Webhook Config:*
```typescript
{
  "timeout": number, // Request timeout in seconds (default: 30)
  "maxPayloadSize": number, // Max payload size in bytes (default: 1MB)
  "verifySSL": boolean, // Verify SSL certificates (default: true)
  "requireSignature": boolean, // Require webhook signature (default: false)
  "signatureHeader": string, // Header name for signature (default: "X-Webhook-Signature")
  "signatureAlgorithm": "sha256" | "sha1" // Signature algorithm
}
```

*Schedule Config:*
```typescript
{
  "cronExpression": string, // Standard cron format (e.g., "0 9 * * MON-FRI")
  "timezone": string, // IANA timezone (default: "UTC")
  "startDate": string, // ISO 8601 date (optional)
  "endDate": string, // ISO 8601 date (optional)
  "maxRetries": number, // Max retry attempts (default: 3)
  "retryDelay": number, // Retry delay in seconds (default: 60)
  "skipOnFailure": boolean // Skip if previous execution failed (default: false)
}
```

*Email Config:*
```typescript
{
  "checkInterval": number, // Check interval in seconds (default: 300)
  "maxEmailsPerCheck": number, // Max emails to process per check (default: 10)
  "processUnreadOnly": boolean, // Only process unread emails (default: true)
  "markAsRead": boolean, // Mark processed emails as read (default: true)
  "filterCriteria": {
    "from": string[], // Email addresses or domains
    "to": string[], // Email addresses (for shared mailboxes)
    "subject": string, // Subject line filter (supports wildcards)
    "bodyContains": string[], // Text that must appear in body
    "labels": string[], // Gmail labels
    "hasAttachment": boolean, // Must have attachments
    "minSize": number, // Minimum email size in bytes
    "maxAge": number // Max age in seconds
  }
}
```

*Integration Event Config:*
```typescript
{
  "integrationId": string, // ID of the user's integration
  "eventTypes": string[], // Events to monitor (integration-specific)
  "filterConfig": {
    // Integration-specific filters
    
    // Slack example:
    "channels": string[], // Channel IDs
    "users": string[], // User IDs
    "messageTypes": ["message", "file_share", "reaction_added"],
    
    // Calendar example:
    "calendars": string[], // Calendar IDs
    "eventTypes": ["created", "updated", "cancelled"],
    "minDuration": number, // Minimum event duration in minutes
    
    // GitHub example:
    "repositories": string[], // Repository names
    "events": ["push", "pull_request", "issue"],
    "branches": string[] // Branch filters
  }
}
```

**Response:**
```typescript
{
  "trigger": {
    "id": "trg_abc123",
    "workflowId": "wf_xyz789",
    "userId": "usr_123456",
    "triggerType": "webhook",
    "config": { /* trigger config */ },
    "conditions": [ /* conditions */ ],
    "authConfig": { /* auth config */ },
    "rateLimitConfig": { /* rate limit config */ },
    "notificationConfig": { /* notification config */ },
    "isActive": true,
    "createdAt": "2025-07-27T10:00:00Z",
    "updatedAt": "2025-07-27T10:00:00Z",
    
    // Additional fields for specific types
    "webhookUrl": "https://api.yourapp.com/api/webhooks/workflow/trg_abc123", // For webhooks
    "webhookSecret": "whsec_1234567890abcdef", // For webhooks
    "nextTriggerAt": "2025-07-27T15:00:00Z" // For schedules
  }
}
```

#### 1.2 Update Trigger
Updates an existing trigger configuration.

**Endpoint:** `PUT /triggers/:triggerId`

**Request Body:**
```typescript
{
  "config": { /* Updated configuration */ },
  "conditions": [ /* Updated conditions */ ],
  "authConfig": { /* Updated auth config */ },
  "rateLimitConfig": { /* Updated rate limit config */ },
  "notificationConfig": { /* Updated notification config */ },
  "isActive": boolean
}
```

**Response:** Same as Create Trigger

#### 1.3 Delete Trigger
Deletes a trigger and all associated data.

**Endpoint:** `DELETE /triggers/:triggerId`

**Response:**
```typescript
{
  "success": true,
  "message": "Trigger deleted successfully"
}
```

#### 1.4 Get Trigger
Retrieves trigger details.

**Endpoint:** `GET /triggers/:triggerId`

**Response:** Same as Create Trigger

#### 1.5 List Workflow Triggers
Lists all triggers for a specific workflow.

**Endpoint:** `GET /workflows/:workflowId/triggers`

**Query Parameters:**
- `includeInactive`: Include inactive triggers (default: false)
- `includeMetrics`: Include execution metrics (default: false)

**Response:**
```typescript
{
  "triggers": [
    {
      /* trigger object */
      "metrics": { // Only if includeMetrics=true
        "totalExecutions": 150,
        "successfulExecutions": 145,
        "failedExecutions": 5,
        "averageExecutionTime": 1234, // milliseconds
        "lastExecutionAt": "2025-07-27T14:30:00Z"
      }
    }
  ],
  "total": 3
}
```

### 2. Trigger Monitoring

#### 2.1 Get Trigger Status
Retrieves current status and metrics for a trigger.

**Endpoint:** `GET /triggers/:triggerId/status`

**Response:**
```typescript
{
  "trigger": { /* trigger details */ },
  "status": "active" | "paused" | "error" | "disabled",
  "health": {
    "isHealthy": boolean,
    "lastCheck": "2025-07-27T14:30:00Z",
    "issues": [
      {
        "type": "rate_limit_exceeded" | "integration_error" | "configuration_error",
        "message": string,
        "since": "2025-07-27T14:00:00Z"
      }
    ]
  },
  "lastExecution": {
    "id": "exec_123",
    "triggeredAt": "2025-07-27T14:30:00Z",
    "status": "success" | "failed",
    "duration": 1234, // milliseconds
    "error": string // Only if failed
  },
  "metrics": {
    "today": {
      "total": 10,
      "success": 8,
      "failed": 2,
      "averageDuration": 1000
    },
    "week": {
      "total": 50,
      "success": 45,
      "failed": 5,
      "averageDuration": 1200
    },
    "month": {
      "total": 200,
      "success": 190,
      "failed": 10,
      "averageDuration": 1100
    }
  },
  "nextScheduledRun": "2025-07-27T15:00:00Z", // For schedule triggers
  "rateLimitStatus": { // Current rate limit status
    "remaining": 45,
    "limit": 100,
    "resetsAt": "2025-07-27T15:00:00Z"
  }
}
```

#### 2.2 Get Trigger Execution History
Retrieves execution history for a trigger.

**Endpoint:** `GET /triggers/:triggerId/executions`

**Query Parameters:**
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (success, failed, skipped)
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `sortBy`: Sort field (triggeredAt, duration, status)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```typescript
{
  "executions": [
    {
      "id": "exec_123",
      "triggerId": "trg_abc123",
      "workflowExecutionId": "wfe_456",
      "triggeredAt": "2025-07-27T14:30:00Z",
      "triggerSource": {
        "type": "webhook",
        "data": { /* trigger-specific data */ }
      },
      "status": "success" | "failed" | "skipped",
      "duration": 1234, // milliseconds
      "error": { // Only if failed
        "message": string,
        "code": string,
        "details": any
      },
      "workflowInputs": { /* inputs passed to workflow */ }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 2.3 Get Trigger Metrics
Retrieves detailed metrics for a trigger.

**Endpoint:** `GET /triggers/:triggerId/metrics`

**Query Parameters:**
- `startDate`: Start date for metrics (ISO 8601)
- `endDate`: End date for metrics (ISO 8601)
- `granularity`: Metric granularity (hour, day, week, month)

**Response:**
```typescript
{
  "summary": {
    "totalExecutions": 1000,
    "successRate": 0.95,
    "averageDuration": 1234,
    "medianDuration": 1000,
    "p95Duration": 2000,
    "p99Duration": 3000
  },
  "timeSeries": [
    {
      "timestamp": "2025-07-27T00:00:00Z",
      "executions": 42,
      "successes": 40,
      "failures": 2,
      "averageDuration": 1100
    }
  ],
  "errorBreakdown": [
    {
      "errorType": "timeout",
      "count": 5,
      "percentage": 0.5
    }
  ],
  "triggerSourceBreakdown": { // For webhooks/integrations
    "sources": [
      {
        "source": "api.github.com",
        "count": 100,
        "percentage": 10
      }
    ]
  }
}
```

### 3. Trigger Testing

#### 3.1 Test Trigger
Tests a trigger with sample data without executing the workflow.

**Endpoint:** `POST /triggers/:triggerId/test`

**Request Body:**
```typescript
{
  "testData": {
    // Trigger-specific test data
    
    // Webhook example:
    "payload": { /* webhook payload */ },
    "headers": { /* webhook headers */ },
    
    // Email example:
    "email": {
      "from": "test@example.com",
      "subject": "Test Email",
      "body": "Test email body",
      "attachments": []
    },
    
    // Integration event example:
    "event": {
      "type": "message",
      "data": { /* event data */ }
    }
  },
  "dryRun": boolean, // If true, don't execute workflow (default: true)
  "skipConditions": boolean // If true, bypass condition checks (default: false)
}
```

**Response:**
```typescript
{
  "testResult": {
    "wouldTrigger": boolean,
    "conditionResults": [
      {
        "condition": { /* condition details */ },
        "passed": boolean,
        "actualValue": any,
        "reason": string // Why it passed/failed
      }
    ],
    "workflowInputs": { /* inputs that would be passed */ },
    "validationErrors": [
      {
        "field": string,
        "message": string
      }
    ]
  },
  "execution": { // Only if dryRun=false
    "id": "exec_123",
    "status": "started",
    "workflowExecutionId": "wfe_456"
  }
}
```

### 4. Webhook Management

#### 4.1 Get Webhook Info
Retrieves webhook URL and configuration for a trigger.

**Endpoint:** `GET /triggers/:triggerId/webhook-info`

**Response:**
```typescript
{
  "webhookUrl": "https://api.yourapp.com/api/webhooks/workflow/trg_abc123",
  "webhookSecret": "whsec_1234567890abcdef",
  "signatureHeader": "X-Webhook-Signature",
  "signatureAlgorithm": "sha256",
  "requiresSignature": true,
  "verificationInstructions": {
    "description": "Include the signature in the X-Webhook-Signature header",
    "algorithm": "HMAC-SHA256",
    "example": "sha256=abcdef1234567890..."
  },
  "sampleCurl": "curl -X POST https://api.yourapp.com/api/webhooks/workflow/trg_abc123 \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Webhook-Signature: sha256=...' \\\n  -d '{\"event\": \"test\"}'"
}
```

#### 4.2 Regenerate Webhook Secret
Regenerates the webhook secret for a trigger.

**Endpoint:** `POST /triggers/:triggerId/regenerate-secret`

**Response:**
```typescript
{
  "webhookSecret": "whsec_new1234567890abcdef",
  "message": "Webhook secret regenerated successfully"
}
```

### 5. Webhook Receiver

#### 5.1 Receive Webhook
Receives webhook calls for workflow triggers.

**Endpoint:** `POST /webhooks/workflow/:triggerId`

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256=... (if signature required)
X-Webhook-Secret: ... (alternative to signature)
```

**Request Body:** Any valid JSON payload

**Response:**
```typescript
// Success
{
  "success": true,
  "message": "Webhook processed successfully",
  "executionId": "exec_123" // If workflow was triggered
}

// Rate limited
{
  "error": "Rate limit exceeded",
  "retryAfter": 60 // seconds
}
// Status: 429

// Invalid signature
{
  "error": "Invalid webhook signature"
}
// Status: 401

// Trigger not found or inactive
{
  "error": "Webhook not found or inactive"
}
// Status: 404
```

## Error Responses

All endpoints follow a consistent error response format:

```typescript
{
  "error": {
    "code": "TRIGGER_NOT_FOUND" | "VALIDATION_ERROR" | "RATE_LIMIT_EXCEEDED" | etc,
    "message": "Human-readable error message",
    "details": { /* Additional error details */ },
    "requestId": "req_abc123" // For tracking
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TRIGGER_NOT_FOUND` | 404 | Trigger does not exist |
| `WORKFLOW_NOT_FOUND` | 404 | Workflow does not exist |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | User lacks permission |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTEGRATION_ERROR` | 502 | External integration failed |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

API endpoints are rate limited per user:

- **Trigger Management**: 100 requests per minute
- **Monitoring Endpoints**: 300 requests per minute
- **Test Endpoints**: 30 requests per minute
- **Webhook Receivers**: Configurable per trigger

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1627814400
```

## Webhooks

### Webhook Security

1. **Signature Verification**
   ```javascript
   const crypto = require('crypto');
   
   function verifyWebhookSignature(payload, signature, secret) {
     const hash = crypto
       .createHmac('sha256', secret)
       .update(JSON.stringify(payload))
       .digest('hex');
     
     return `sha256=${hash}` === signature;
   }
   ```

2. **IP Whitelisting**
   - Configure allowed IP ranges in trigger auth config
   - Supports CIDR notation (e.g., "192.168.1.0/24")

3. **Payload Size Limits**
   - Default: 1MB
   - Configurable per trigger (max: 10MB)

### Webhook Best Practices

1. Always verify webhook signatures
2. Implement idempotency using event IDs
3. Respond quickly (< 5 seconds) and process asynchronously
4. Handle retries gracefully
5. Monitor webhook health and failures

## Integration Events

### Supported Integrations

| Integration | Event Types |
|-------------|-------------|
| Slack | `message`, `file_share`, `reaction_added`, `channel_created`, `user_joined` |
| Google Calendar | `event.created`, `event.updated`, `event.cancelled`, `event.started` |
| Gmail | `email.received`, `email.labeled`, `email.starred` |
| GitHub | `push`, `pull_request`, `issue`, `release`, `workflow_run` |
| Jira | `issue.created`, `issue.updated`, `issue.transitioned`, `comment.added` |

### Event Payload Format

All integration events follow a consistent format:

```typescript
{
  "eventId": "evt_123",
  "eventType": "message",
  "integration": "slack",
  "timestamp": "2025-07-27T14:30:00Z",
  "data": {
    // Integration-specific event data
  },
  "metadata": {
    "userId": "usr_123",
    "integrationId": "int_456"
  }
}
```

## Pagination

List endpoints support cursor-based pagination:

```typescript
{
  "data": [ /* results */ ],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "nextCursor": "eyJvZmZzZXQiOjUwfQ=="
  }
}
```

Use the `nextCursor` value as the `cursor` parameter for the next page:
```
GET /triggers/:triggerId/executions?cursor=eyJvZmZzZXQiOjUwfQ==
```

## Versioning

The API uses URL versioning. The current version is v1. Future versions will be available at:
```
/api/v2/triggers/...
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { WorkflowTriggerClient } from '@yourapp/workflow-triggers';

const client = new WorkflowTriggerClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.yourapp.com'
});

// Create a webhook trigger
const trigger = await client.createTrigger({
  workflowId: 'wf_123',
  triggerType: 'webhook',
  config: {
    requireSignature: true
  },
  conditions: [
    {
      conditionType: 'field_match',
      fieldPath: 'event.type',
      operator: 'equals',
      expectedValue: 'order.completed'
    }
  ]
});

// Monitor trigger status
const status = await client.getTriggerStatus(trigger.id);
console.log(`Trigger health: ${status.health.isHealthy}`);
```

### Python
```python
from workflow_triggers import TriggerClient

client = TriggerClient(
    api_key='your-api-key',
    base_url='https://api.yourapp.com'
)

# Create a schedule trigger
trigger = client.create_trigger(
    workflow_id='wf_123',
    trigger_type='schedule',
    config={
        'cron_expression': '0 9 * * MON-FRI',
        'timezone': 'America/New_York'
    }
)

# Get execution history
executions = client.get_executions(
    trigger_id=trigger.id,
    status='failed',
    limit=10
)
```

This API specification provides a complete reference for implementing and using the workflow trigger monitoring system.