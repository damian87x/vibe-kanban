# API Reference

## Base URL
Development: `http://localhost:3000/api`

## Authentication
GitHub OAuth token in config or device flow authentication.

## Core Endpoints

### Projects

#### List Projects
`GET /api/projects`

Response:
```json
[
  {
    "id": "uuid",
    "name": "Project Name",
    "gitRepoPath": "/path/to/repo",
    "setupScript": "npm install",
    "devScript": "npm run dev",
    "cleanupScript": "npm run clean"
  }
]
```

#### Create Project
`POST /api/projects`

Request:
```json
{
  "name": "New Project",
  "gitRepoPath": "/path/to/repo",
  "setupScript": "npm install",
  "devScript": "npm run dev"
}
```

#### Update Project
`PUT /api/projects/:id`

#### Delete Project
`DELETE /api/projects/:id`

#### Get Project Branches
`GET /api/projects/:id/branches`

---

### Tasks

#### Get Task
`GET /api/tasks/:id`

Response includes:
- Task details
- Task attempts
- Parent task information

#### Create Task
`POST /api/tasks`

Request:
```json
{
  "projectId": "uuid",
  "title": "Implement feature",
  "description": "Detailed description",
  "parentTaskAttempt": "uuid (optional)"
}
```

#### Update Task
`PUT /api/tasks/:id`

Request:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "inprogress"
}
```

Status values: `todo`, `inprogress`, `inreview`, `done`, `cancelled`

#### Delete Task
`DELETE /api/tasks/:id`

#### Start Task
`POST /api/tasks/:id/start`

Request:
```json
{
  "prompt": "Build a REST API for user management",
  "executor": "CLAUDE_CODE",
  "baseBranch": "main (optional)"
}
```

---

### Task Attempts

#### Get Task Attempt
`GET /api/task-attempts/:id`

Includes:
- Attempt details
- Execution processes
- Conversation entries

#### Create Task Attempt
`POST /api/task-attempts`

Request:
```json
{
  "taskId": "uuid",
  "executor": "CLAUDE_CODE",
  "prompt": "Initial prompt"
}
```

#### Send Follow-up
`POST /api/task-attempts/:id/follow-up`

Request:
```json
{
  "prompt": "Follow-up instruction"
}
```

#### Get Diff
`GET /api/task-attempts/:id/diff`

Returns git diff of changes made in the attempt.

#### Stream Diff Updates
`GET /api/events/task-attempts/:id/diff`

Server-Sent Events stream for real-time diff updates.

#### Merge Changes
`POST /api/task-attempts/:id/merge`

Merges the task attempt branch into base branch.

#### Create Pull Request
`POST /api/task-attempts/:id/pr`

Request:
```json
{
  "title": "PR Title",
  "body": "PR Description"
}
```

---

### Execution Processes

#### Get Process Logs
`GET /api/processes/:id/logs`

Response:
```json
[
  {
    "id": "uuid",
    "isStdout": true,
    "content": "Log line content",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Stream Process Logs
`GET /api/events/processes/:id/logs`

Server-Sent Events stream for real-time log streaming.

#### Kill Process
`POST /api/processes/:id/kill`

Terminates a running process.

---

### Configuration

#### Get Config
`GET /api/config`

Returns user configuration including:
- Theme settings
- Profile selection
- GitHub configuration
- Notification preferences

#### Update Config
`PUT /api/config`

Request: Partial config object to update.

#### Get Profiles
`GET /api/config/profiles`

Returns available AI agent profiles.

#### Get MCP Servers
`GET /api/config/mcp-servers`

Returns MCP server configurations.

---

### Authentication

#### Start Device Flow
`POST /api/auth/device-flow/start`

Response:
```json
{
  "deviceCode": "xxx",
  "userCode": "XXXX-XXXX",
  "verificationUri": "https://github.com/login/device",
  "expiresIn": 900,
  "interval": 5
}
```

#### Poll Device Flow
`POST /api/auth/device-flow/poll`

Request:
```json
{
  "deviceCode": "xxx"
}
```

Response on success:
```json
{
  "accessToken": "gho_xxx",
  "tokenType": "bearer",
  "scope": "user:email,repo"
}
```

#### Check Token
`GET /api/auth/check-token`

Validates current authentication token.

---

## Event Streaming (SSE)

### Global Events
`GET /api/events/`

Streams all database changes as JSON patches.

### Process Logs
`GET /api/events/processes/:id/logs`

Streams process output in real-time.

### Task Diffs
`GET /api/events/task-attempts/:id/diff`

Streams diff updates as changes are made.

### Event Format
```typescript
interface EventPatch {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value: any;
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting
No rate limiting in local deployment.

## CORS
Configured for local development (localhost:3000).

## Content Types
- Request: `application/json`
- Response: `application/json`
- SSE: `text/event-stream`