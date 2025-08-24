# Composio API Reference for MCP Integration

## Key API Endpoints

### 1. MCP Server Management

#### Create MCP Server
```typescript
const mcpConfig = await composio.mcp.create(
  "Gmail MCP Server",                    // Server name
  [{
    authConfigId: "ac_auth_12",          // Auth config ID from Composio dashboard
    allowedTools: [                      // Specific tools to allow
      "GMAIL_FETCH_EMAILS",
      "GMAIL_CREATE_EMAIL_DRAFT",
      "GMAIL_SEND_EMAIL"
    ]
  }],
  { isChatAuth: true }                   // Enable chat-based auth
);
```

#### Get Server URLs for User
```typescript
const serverUrls = await composio.mcp.getServer(
  mcpConfig.id,                          // MCP server ID
  "user123@example.com"                  // User entity ID
);
// Returns: { authUrl: string, ... }
```

#### Check User Connection Status
```typescript
const connectionStatus = await composio.mcp.getUserConnectionStatus(
  "user123@example.com",                 // User entity ID
  mcpConfig.id                           // MCP server ID
);
// Returns: { connected: boolean, connectedToolkits: {...} }
```

### 2. Connected Accounts Management

#### Initiate Connection
```typescript
const connectionRequest = await composio.connectedAccounts.initiate(
  entityId,                              // User ID
  authConfigId,                          // Auth config ID
  {
    allowMultiple: false,                // Don't allow multiple connections
    force: true                          // Force new connection
  }
);
// Returns: { redirectUrl: string, connectedAccountId: string }
```

#### List Connected Accounts
```typescript
const accounts = await composio.connectedAccounts.list({
  clientUniqueUserId: "user123",         // Filter by user
  status: "ACTIVE"                       // Filter by status
});
// Returns: { items: ConnectedAccount[] }
```

#### Get Specific Connected Account
```typescript
const account = await composio.connectedAccounts.get(accountId);
// Returns: ConnectedAccount object
```

#### Delete Connected Account
```typescript
await composio.connectedAccounts.delete(accountId);
```

### 3. Tool Execution

#### Execute Action
```typescript
const response = await composio.actions.execute({
  actionName: "GMAIL_SEND_EMAIL",
  requestBody: {
    input: {
      to: "recipient@example.com",
      subject: "Test Email",
      body: "Hello from Composio!"
    },
    connectedAccountId: accountId
  }
});
// Returns: { data: any, error?: string }
```

#### List Available Actions
```typescript
const actions = await composio.actions.list({
  apps: "gmail",                         // Filter by app
  useCase: null                          // Optional use case filter
});
// Returns: { items: Action[] }
```

## Tool Names by Provider

### Gmail Tools
- `GMAIL_FETCH_EMAILS` - Fetch emails from inbox
- `GMAIL_SEND_EMAIL` - Send an email
- `GMAIL_CREATE_EMAIL_DRAFT` - Create a draft email
- `GMAIL_SEARCH_EMAILS` - Search for emails
- `GMAIL_MARK_AS_READ` - Mark emails as read
- `GMAIL_STAR_EMAIL` - Star/unstar emails

### Google Calendar Tools
- `GOOGLECALENDAR_CREATE_EVENT` - Create a calendar event
- `GOOGLECALENDAR_GET_EVENTS` - Get calendar events
- `GOOGLECALENDAR_GET_TODAYS_EVENTS` - Get today's events
- `GOOGLECALENDAR_UPDATE_EVENT` - Update an event
- `GOOGLECALENDAR_DELETE_EVENT` - Delete an event
- `GOOGLECALENDAR_SEARCH_EVENTS` - Search for events

### Slack Tools
- `SLACK_SEND_MESSAGE` - Send a message to a channel
- `SLACK_LIST_CHANNELS` - List available channels
- `SLACK_CREATE_CHANNEL` - Create a new channel
- `SLACK_INVITE_TO_CHANNEL` - Invite users to a channel
- `SLACK_LIST_USERS` - List workspace users

### Notion Tools
- `NOTION_CREATE_PAGE` - Create a new page
- `NOTION_UPDATE_PAGE` - Update a page
- `NOTION_GET_PAGE` - Get page content
- `NOTION_CREATE_DATABASE` - Create a database
- `NOTION_QUERY_DATABASE` - Query database entries

### GitHub Tools
- `GITHUB_CREATE_ISSUE` - Create an issue
- `GITHUB_CREATE_PR` - Create a pull request
- `GITHUB_GET_REPOS` - List repositories
- `GITHUB_CREATE_REPO` - Create a repository
- `GITHUB_COMMIT_FILE` - Commit a file

## Response Formats

### Connected Account Object
```typescript
interface ConnectedAccount {
  id: string;                            // Unique account ID
  clientUniqueUserId: string;            // User entity ID
  appName: string;                       // e.g., "gmail", "slack"
  status: "ACTIVE" | "PENDING" | "FAILED" | "INITIATED";
  createdAt: string;                     // ISO timestamp
  integrationId: string;                 // Integration ID
}
```

### MCP Server Response
```typescript
interface MCPServer {
  id: string;                            // Server ID
  name: string;                          // Server name
  authConfigs: Array<{
    authConfigId: string;
    allowedTools: string[];
  }>;
  isChatAuth: boolean;
}
```

### Connection Status Response
```typescript
interface ConnectionStatus {
  connected: boolean;
  connectedToolkits?: {
    [appName: string]: {
      status: "ACTIVE" | "INACTIVE";
      accountId: string;
    };
  };
}
```

## Error Handling

Common errors to handle:
- `Multiple connected accounts found` - User has multiple accounts for same service
- `No active connection found` - User needs to authenticate
- `Tool execution failed` - Action failed, check error details
- `Invalid auth config` - Auth config ID doesn't exist
- `Timeout` - API call timed out (implement retry logic)

## Best Practices

1. **Always Check Connection Status First**
   - Before initiating OAuth, check if user already has an active connection
   - Use `getAllConnectedAccounts` to find existing connections

2. **Clean Up Stale Connections**
   - Remove PENDING, FAILED, or INITIATED connections before creating new ones
   - Add delay after cleanup to ensure Composio processes the disconnections

3. **Store Account IDs Properly**
   - Always store the actual `connectedAccountId` from Composio
   - Don't rely on state parameters for account identification

4. **Handle OAuth Popup Properly**
   - Check for popup blockers
   - Implement polling for OAuth completion
   - Handle cases where user closes popup

5. **Implement Proper Error Recovery**
   - Retry failed API calls with exponential backoff
   - Provide clear error messages to users
   - Log all errors for debugging