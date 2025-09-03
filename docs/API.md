# Vibe Kanban API Documentation

## Overview

Vibe Kanban provides a comprehensive REST API for managing projects, tasks, and AI agent executions. The API is built with Rust/Axum and provides type-safe endpoints with comprehensive error handling.

## Base URL

- **Development**: `http://localhost:{BACKEND_PORT}/api`
- **Production**: `http://localhost:{BACKEND_PORT}/api`

## Authentication

Currently, Vibe Kanban uses GitHub OAuth for authentication. All API endpoints require proper authentication headers.

## Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Error Handling

The API uses HTTP status codes and structured error responses:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## API Endpoints

### Projects

#### List All Projects

```http
GET /api/projects
```

**Response:**
```typescript
interface Project {
  id: string;
  name: string;
  git_repo_path: string;
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: string;
  created_at: string;
  updated_at: string;
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Project",
      "git_repo_path": "/path/to/repo",
      "setup_script": "npm install",
      "dev_script": "npm run dev",
      "cleanup_script": "npm run clean",
      "copy_files": "src/**/*",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Project by ID

```http
GET /api/projects/{id}
```

**Parameters:**
- `id` (path) - Project UUID

**Response:**
```typescript
interface Project
```

#### Create Project

```http
POST /api/projects
```

**Request Body:**
```typescript
interface CreateProject {
  name: string;
  git_repo_path: string;
  use_existing_repo: boolean;
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: string;
}
```

**Example Request:**
```json
{
  "name": "New Project",
  "git_repo_path": "/path/to/new/repo",
  "use_existing_repo": false,
  "setup_script": "npm install",
  "dev_script": "npm run dev"
}
```

#### Update Project

```http
PUT /api/projects/{id}
```

**Parameters:**
- `id` (path) - Project UUID

**Request Body:**
```typescript
interface UpdateProject {
  name?: string;
  git_repo_path?: string;
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: string;
}
```

#### Delete Project

```http
DELETE /api/projects/{id}
```

**Parameters:**
- `id` (path) - Project UUID

#### Get Project Branches

```http
GET /api/projects/{id}/branches
```

**Response:**
```typescript
interface GitBranch {
  name: string;
  is_current: boolean;
  last_commit: string;
}
```

#### Search Project Files

```http
GET /api/projects/{id}/search?q={query}
```

**Parameters:**
- `id` (path) - Project UUID
- `q` (query) - Search query

**Response:**
```typescript
interface SearchResult {
  path: string;
  is_file: boolean;
  match_type: "FileName" | "DirectoryName" | "FullPath";
}
```

#### Open Project in Editor

```http
POST /api/projects/{id}/open-editor
```

**Request Body:**
```typescript
interface OpenEditorRequest {
  editor_type?: string;
}
```

### Tasks

#### List Tasks by Project

```http
GET /api/projects/{project_id}/tasks
```

**Parameters:**
- `project_id` (path) - Project UUID

**Response:**
```typescript
interface TaskWithAttemptStatus {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: "todo" | "inprogress" | "inreview" | "done" | "cancelled";
  parent_task_attempt?: string;
  created_at: string;
  updated_at: string;
  has_in_progress_attempt: boolean;
  has_merged_attempt: boolean;
  last_attempt_failed: boolean;
  profile: string;
}
```

#### Get Task by ID

```http
GET /api/projects/{project_id}/tasks/{task_id}
```

**Parameters:**
- `project_id` (path) - Project UUID
- `task_id` (path) - Task UUID

#### Create Task

```http
POST /api/projects/{project_id}/tasks
```

**Request Body:**
```typescript
interface CreateTask {
  title: string;
  description?: string;
  parent_task_attempt?: string;
}
```

#### Update Task

```http
PUT /api/projects/{project_id}/tasks/{task_id}
```

**Request Body:**
```typescript
interface UpdateTask {
  title?: string;
  description?: string;
  status?: "todo" | "inprogress" | "inreview" | "done" | "cancelled";
  parent_task_attempt?: string;
}
```

#### Delete Task

```http
DELETE /api/projects/{project_id}/tasks/{task_id}
```

#### Create and Start Task

```http
POST /api/projects/{project_id}/tasks/create-and-start
```

**Request Body:**
```typescript
interface CreateAndStartTask {
  title: string;
  description?: string;
  profile: string;
  base_branch: string;
}
```

### Task Attempts

#### List Task Attempts

```http
GET /api/projects/{project_id}/tasks/{task_id}/attempts
```

**Response:**
```typescript
interface TaskAttempt {
  id: string;
  task_id: string;
  container_ref?: string;
  branch?: string;
  base_branch: string;
  merge_commit?: string;
  profile: string;
  pr_url?: string;
  pr_number?: number;
  pr_status?: string;
  pr_merged_at?: string;
  worktree_deleted: boolean;
  setup_completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### Create Task Attempt

```http
POST /api/projects/{project_id}/tasks/{task_id}/attempts
```

**Request Body:**
```typescript
interface CreateTaskAttempt {
  profile: string;
  base_branch: string;
}
```

#### Get Task Attempt by ID

```http
GET /api/projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}
```

#### Create Follow-up Attempt

```http
POST /api/projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/follow-up
```

**Request Body:**
```typescript
interface CreateFollowUpAttempt {
  prompt: string;
}
```

#### Resume Task Attempt

```http
POST /api/projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/resume
```

**Request Body:**
```typescript
interface ResumeAttemptRequest {
  context: AttemptResumeContext;
}
```

#### Merge Task Attempt

```http
POST /api/projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/merge
```

#### Cancel Task Attempt

```http
POST /api/projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/cancel
```

### Execution Processes

#### List Execution Processes

```http
GET /api/projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/processes
```

**Response:**
```typescript
interface ExecutionProcess {
  id: string;
  task_attempt_id: string;
  run_reason: "setupscript" | "cleanupscript" | "codingagent";
  status: "running" | "completed" | "failed" | "killed";
  executor_type?: string;
  executor_action?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### Get Execution Process by ID

```http
GET /api/execution-processes/{process_id}
```

#### Kill Execution Process

```http
POST /api/execution-processes/{process_id}/kill
```

### Task Templates

#### List Task Templates

```http
GET /api/task-templates
```

**Query Parameters:**
- `project_id` (optional) - Filter by project ID
- `global` (optional) - Include global templates

**Response:**
```typescript
interface TaskTemplate {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  template_name: string;
  created_at: string;
  updated_at: string;
}
```

#### Create Task Template

```http
POST /api/task-templates
```

**Request Body:**
```typescript
interface CreateTaskTemplate {
  project_id?: string;
  title: string;
  description?: string;
  template_name: string;
}
```

#### Update Task Template

```http
PUT /api/task-templates/{id}
```

#### Delete Task Template

```http
DELETE /api/task-templates/{id}
```

### Events (Server-Sent Events)

#### Process Logs Stream

```http
GET /api/events/processes/{process_id}/logs
```

**Response:** Server-Sent Events stream with JSON patches

**Event Types:**
- `json_patch` - JSON patch operations for log updates
- `finished` - Process completion signal

#### Task Attempt Diff Stream

```http
GET /api/events/task-attempts/{attempt_id}/diff
```

**Response:** Server-Sent Events stream with diff updates

### Configuration

#### Get Configuration

```http
GET /api/config
```

**Response:**
```typescript
interface Config {
  disclaimer_acknowledged: boolean;
  onboarding_acknowledged: boolean;
  github_login_acknowledged: boolean;
  telemetry_acknowledged: boolean;
  analytics_enabled: boolean;
  profile: string;
  editor: {
    editor_type: string;
    custom_command?: string;
  };
  theme: "light" | "dark" | "system";
}
```

#### Update Configuration

```http
PUT /api/config
```

**Request Body:**
```typescript
interface Config
```

### Authentication

#### GitHub OAuth Flow

```http
GET /api/auth/github/device
```

**Response:**
```typescript
interface GitHubDeviceFlow {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}
```

#### Check GitHub Authentication Status

```http
GET /api/auth/github/status
```

**Response:**
```typescript
interface GitHubAuthStatus {
  authenticated: boolean;
  user?: {
    login: string;
    name?: string;
    email?: string;
  };
}
```

### Health Check

#### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## MCP (Model Context Protocol) Server

Vibe Kanban includes a built-in MCP server that allows AI agents to interact with the system directly.

### MCP Tools

#### list_projects

Lists all available projects.

**Parameters:** None

**Response:**
```typescript
interface ListProjectsResponse {
  success: boolean;
  projects: ProjectSummary[];
  count: number;
}
```

#### list_tasks

Lists tasks in a project with optional filtering.

**Parameters:**
```typescript
interface ListTasksRequest {
  project_id: string;
  status?: string;
  limit?: number;
}
```

#### create_task

Creates a new task in a project.

**Parameters:**
```typescript
interface CreateTaskRequest {
  project_id: string;
  title: string;
  description?: string;
}
```

#### update_task

Updates an existing task.

**Parameters:**
```typescript
interface UpdateTaskRequest {
  project_id: string;
  task_id: string;
  title?: string;
  description?: string;
  status?: string;
}
```

#### delete_task

Deletes a task.

**Parameters:**
```typescript
interface DeleteTaskRequest {
  project_id: string;
  task_id: string;
}
```

#### get_task

Gets detailed information about a specific task.

**Parameters:**
```typescript
interface GetTaskRequest {
  project_id: string;
  task_id: string;
}
```

## Error Codes

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "Field validation message"
  }
}
```

#### Not Found Error
```json
{
  "success": false,
  "error": "Resource not found",
  "resource_type": "project",
  "resource_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Authentication Error
```json
{
  "success": false,
  "error": "Authentication required",
  "auth_type": "github"
}
```

## Rate Limiting

Currently, Vibe Kanban does not implement rate limiting. This may be added in future versions for production deployments.

## WebSocket/SSE Support

Vibe Kanban uses Server-Sent Events (SSE) for real-time updates:

- **Process Logs**: `/api/events/processes/{process_id}/logs`
- **Task Diffs**: `/api/events/task-attempts/{attempt_id}/diff`

### SSE Event Format

```typescript
interface SSEEvent {
  event: string;
  data: string; // JSON string
  id?: string;
  retry?: number;
}
```

## SDKs and Client Libraries

Currently, Vibe Kanban does not provide official SDKs. The API is designed to be consumed directly via HTTP requests or through the built-in MCP server.

## Versioning

The API currently does not use versioning. All endpoints are under `/api/` without version prefixes. Future versions may introduce versioning if breaking changes are required.

## Examples

### Complete Task Creation and Execution Flow

1. **Create Project**
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "git_repo_path": "/path/to/repo",
    "use_existing_repo": true
  }'
```

2. **Create Task**
```bash
curl -X POST http://localhost:8080/api/projects/{project_id}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature X",
    "description": "Add new functionality to the application"
  }'
```

3. **Start Task Execution**
```bash
curl -X POST http://localhost:8080/api/projects/{project_id}/tasks/{task_id}/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "claude-code",
    "base_branch": "main"
  }'
```

4. **Monitor Execution (SSE)**
```bash
curl -N http://localhost:8080/api/events/processes/{process_id}/logs
```

This comprehensive API provides full control over the Vibe Kanban system, enabling both human users and AI agents to manage projects, tasks, and executions effectively.