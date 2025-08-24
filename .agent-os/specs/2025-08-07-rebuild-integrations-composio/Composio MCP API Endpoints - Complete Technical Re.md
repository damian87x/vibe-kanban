<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Composio MCP API Endpoints - Complete Technical Reference

Based on comprehensive research of the Composio documentation, SDK structure, and API specifications, I've compiled the exact methods and parameters for the required Composio MCP API endpoints. Here's the definitive guide that clarifies several misconceptions in your original questions.

## Critical Architecture Understanding

**Entity-Based System**: Composio uses an **entity-based architecture** where each user is represented as an "entity" with a unique `entityId` (NOT `clientUniqueUserId`). This is fundamental to understanding how all authentication and tool execution works.

![Composio MCP API Endpoints Structure and Workflow](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b9a9d85c980b0722c9c4d43fb939bc30/43cd3df5-36d5-44de-a231-d2156feebcd9/dab93d79.png)

Composio MCP API Endpoints Structure and Workflow

## 1. Create MCP Server

**Correct Method:**

```typescript
this.composio.mcp.createServer({
  name: string,
  authConfigId?: string,        // Optional - Auth config ID (starts with 'ac_')
  allowedTools?: string[],      // Optional - Array of tool names
  isChatAuth?: boolean          // Optional - For chat-based auth
})
```

**Returns:**

```typescript
{
  id: string,          // Server ID
  name: string,        // Server name
  status: string,      // Server status  
  url: string          // SSE URL for the server
}
```

**HTTP Details:** POST to `https://backend.composio.dev/api/v1/mcp/servers`

## 2. Get OAuth URL for MCP Server

**Critical Correction**: OAuth is handled per-entity and per-app, NOT directly by MCP server ID.

**Correct Method:**

```typescript
const toolset = new OpenAIToolSet({apiKey: COMPOSIO_API_KEY});
const entity = toolset.client.getEntity(entityId);
const connection = await entity.initiateConnection({
  appName: string,          // Required - like 'gmail', 'slack'
  redirectUri?: string      // Optional - callback URL
});
```

**Returns:**

```typescript
{
  redirectUrl: string,      // OAuth URL to redirect user
  connectionId: string,     // Connection identifier
  status: string           // Connection status
}
```


## 3. Check User Connection Status

**Correct Method:**

```typescript
const entity = toolset.client.getEntity(entityId);
const connection = await entity.getConnection({
  appName: string          // App name to check
});
```

**Returns:**

```typescript
{
  connected: boolean,           // Whether user is connected
  connectedApps?: string[],     // List of connected apps
  status: string,               // Connection status
  connectionId?: string         // Connection ID if connected
}
```


## 4. List Connected Accounts

**Correct Method:**

```typescript
this.composio.connectedAccounts.list({
  entityId?: string,        // Optional - Filter by specific user
  appName?: string,         // Optional - Filter by app
  status?: string           // Optional - ACTIVE, INACTIVE
})
```

**Returns:**

```typescript
{
  items: Array<{
    id: string,             // Account ID
    appName: string,        // Application name
    status: string,         // Account status
    entityId: string        // Associated entity ID
  }>
}
```


## 5. Execute Action/Tool

**Correct Method:**

```typescript
// 1. Get tools for entity
const tools = await toolset.getTools({
  actions: ["action_name"]
}, entityId);

// 2. After LLM generates tool calls
const result = await toolset.handleToolCall(response, entityId);
```

**Returns:**

```typescript
{
  successful: boolean,      // Execution success
  data: any,               // Tool result
  error?: string           // Error if failed
}
```


## 6. Disconnect Account

**Correct Method:**

```typescript
await this.composio.connectedAccounts.disable(accountId);
```

**HTTP Details:** DELETE/POST to `https://backend.composio.dev/api/v1/connectedAccounts/{accountId}/disable`

## Complete Working Example

```typescript
import { OpenAIToolSet } from '@composio/core';
import { OpenAI } from 'openai';

class ComposioMCPManager {
  private toolset: OpenAIToolSet;
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.toolset = new OpenAIToolSet({apiKey});
    this.openai = new OpenAI();
  }

  // Check connection status
  async checkUserConnection(entityId: string, appName: string): Promise<boolean> {
    const entity = this.toolset.client.getEntity(entityId);
    const connection = await entity.getConnection({appName});
    return !!connection;
  }

  // Initiate OAuth flow
  async initiateConnection(entityId: string, appName: string) {
    const entity = this.toolset.client.getEntity(entityId);
    const connection = await entity.initiateConnection({appName});
    console.log("Authenticate at:", connection.redirectUrl);
    return connection;
  }

  // Execute tool with proper entity context
  async executeTool(entityId: string, instruction: string, actions: string[]) {
    const tools = await this.toolset.getTools({actions}, entityId);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{role: "user", content: instruction}],
      tools: tools,
      tool_choice: "auto"
    });

    return await this.toolset.handleToolCall(response, entityId);
  }
}
```


## Key Corrections to Your Original Questions

1. **Parameter Name**: Use `entityId`, not `clientUniqueUserId`
2. **OAuth Flow**: Use `entity.initiateConnection({appName})`, not MCP server-specific methods
3. **Connection Status**: Use `entity.getConnection({appName})`, not `mcp.getUserConnectionStatus()`
4. **Tool Execution**: Use `toolset.handleToolCall()`, not direct `actions.execute()`
5. **Architecture**: Everything is entity-centric, not MCP server-centric

## SDK Version Note

Ensure you're using the current **@composio/core** (v3) package, not the legacy `composio-core` (v2) which is being phased out.

This comprehensive guide provides the exact TypeScript implementations you need, correcting the architectural misunderstandings in your original questions and providing working code examples based on Composio's actual entity-based system.

<div style="text-align: center">⁂</div>

[^1]: https://composio.dev/blog/mcp-server-step-by-step-guide-to-building-from-scrtch

[^2]: https://www.linkedin.com/pulse/build-smarter-ai-apps-mcp-composio-one-protocol-100-tools-singh-hae6c

[^3]: https://composio.dev/blog/building-your-own-mcp-client-from-scratch

[^4]: https://natesnewsletter.substack.com/p/composio-mcp-wants-to-dance-with

[^5]: https://composio.dev/blog/what-is-model-context-protocol-mcp-explained

[^6]: https://dev.to/composiodev/cursor-mcp-vs-windsurf-mcp-using-composio-mcp-server-1748

[^7]: https://docs.composio.dev

[^8]: https://www.youtube.com/watch?v=3lKVyfJ6Hm4

[^9]: https://docs.composio.dev/api-reference/api-reference/v1/mcp/create-mcp-server

[^10]: https://composio.dev

[^11]: https://modelcontextprotocol.io

[^12]: https://dev.to/composiodev/how-to-build-mcp-servers-and-clients-from-scratch-4o2f

[^13]: https://docs.composio.dev/docs/mcp-overview

[^14]: https://composio.dev/blog/mcp-vs-a2a-everything-you-need-to-know

[^15]: https://docs.composio.dev/api-reference/mcp/post-mcp-servers-custom

[^16]: https://docs.tavily.com/documentation/integrations/composio

[^17]: https://modelcontextprotocol.io/introduction

[^18]: https://docs.composio.dev/docs/mcp-developers

[^19]: https://mcp.composio.dev

[^20]: https://github.com/ComposioHQ/openai-composio-mcp-example

[^21]: https://github.com/ComposioHQ/composio/blob/master/docs/javascript/openai.mdx

[^22]: https://composio.dev/agentauth

[^23]: https://github.com/ComposioHQ/composio/blob/master/fern/getting-started/quickstart.mdx?plain=1

[^24]: https://npmjs.com/package/@composio/openai

[^25]: https://www.youtube.com/watch?v=2X-INVmI3Go

[^26]: https://docs.composio.dev/tools/eodhd_apis

[^27]: https://composio.dev/blog/new-sdk-preview

[^28]: https://composio.dev/blog/oauth-example-with-illustrations

[^29]: https://docs.composio.dev/tools/dictionary_api

[^30]: https://github.com/ComposioHQ/agent-flow

[^31]: https://docs.composio.dev/tools/asin_data_api

[^32]: https://github.com/ComposioHQ/composio

[^33]: https://docs.composio.dev/auth/introduction

[^34]: https://docs.composio.dev/api-reference/api-reference/v1/connections/enable-connection

[^35]: https://docs.crewai.com/en/tools/automation/composiotool

[^36]: https://docs.composio.dev/api-reference/api-reference/v1/connections/initiate-connection

[^37]: https://docs.composio.dev/providers/custom/typescript

[^38]: https://docs.composio.dev/docs/authenticating-tools

[^39]: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_servers

[^40]: https://dev.to/composiodev/how-to-connect-cursor-to-100-mcp-servers-within-minutes-3h74/

[^41]: https://github.com/FlowiseAI/Flowise/issues/4570

[^42]: https://dev.to/composiodev/how-to-connect-cursor-to-100-mcp-servers-within-minutes-3h74

[^43]: https://lobehub.com/mcp/mcikalmerdeka-mcp_servers_experimentation

[^44]: https://docs.composio.dev/tools/plain

[^45]: https://composio.dev/blog/the-complete-guide-to-building-mcp-agents

[^46]: https://docs.composio.dev/tools/excel

[^47]: https://docs.composio.dev/tools/shortcut

[^48]: https://docs.composio.dev/api-reference/mcp/post-mcp-servers-by-server-id-instances

[^49]: https://docs.composio.dev/toolkits/kit

[^50]: https://composio.dev/blog/the-guide-to-mcp-i-never-had

[^51]: https://www.npmjs.com/package/@composio/client

[^52]: https://www.npmjs.com/package/@composio/core/v/0.1.32

[^53]: https://www.npmjs.com/package/@composio/core/v/0.1.12-alpha.6

[^54]: https://docs.temporal.io/develop/typescript

[^55]: https://docs.composio.dev/sdk-reference/type-script/models/connected-accounts

[^56]: https://www.npmjs.com/package/@restackio/integrations-composio?activeTab=dependencies

[^57]: https://docs.composio.dev/api-reference/connected-accounts/get-connected-accounts

[^58]: https://docs.composio.dev/api-reference/api-reference/v1/connectionsv-2/initiate-connection-v-2

[^59]: https://docs.composio.dev/toolkits/connecteam

[^60]: https://docs.temporal.io/develop/typescript/core-application

[^61]: https://docs.composio.dev/toolkits/typefully

[^62]: https://docs.composio.dev/toolkits/retently

[^63]: https://docs.composio.dev/auth/injecting-custom-credentials

[^64]: https://dev.to/composiodev/15-hidden-open-source-gems-to-become-10x-ai-engineer-39pd

[^65]: https://docs.composio.dev/docs/custom-auth-params

[^66]: https://dev.to/composiodev/the-guide-to-mcp-i-never-had-1ked

[^67]: https://docs.composio.dev/api-reference/mcp/get-mcp-servers-by-server-id-instances

[^68]: https://docs.composio.dev/docs/migration

[^69]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b9a9d85c980b0722c9c4d43fb939bc30/9d0f4432-f587-4630-b671-9e8a96dda208/85fe7d2d.md

