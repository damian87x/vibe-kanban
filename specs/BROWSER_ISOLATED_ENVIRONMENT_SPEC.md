# Browser-Based Isolated Environment Specification

**Version:** 1.0.0  
**Date:** 2025-01-24  
**Purpose:** Enable browser-based frontend preview with isolated environments  

## Overview

This specification enhances the real-time updates system to support browser-based isolated environments for frontend preview and testing. Instead of just streaming updates, we'll enable full interactive preview environments that run in the browser and connect to isolated backend instances.

## Current State vs. Desired State

### Current State
- SSE/WebSocket connections for real-time updates
- Updates stream from backend to frontend
- No isolated preview environments
- Testing requires local setup

### Desired State
- Browser-based isolated environments for each agent/task
- Live preview of changes in browser
- Isolated backend connections per environment
- Zero-setup testing and preview

## Architecture

### 1. Browser-Based Isolation Technologies

#### Option 1: WebContainers (StackBlitz)
```typescript
interface WebContainerEnvironment {
  id: string;
  taskId: string;
  agentId: string;
  container: WebContainer;
  backendUrl: string;
  status: 'initializing' | 'running' | 'stopped';
  ports: {
    frontend: number;
    backend: number;
  };
}

class WebContainerManager {
  async createIsolatedEnvironment(
    taskId: string,
    agentId: string
  ): Promise<WebContainerEnvironment> {
    // Initialize WebContainer
    const container = await WebContainer.boot();
    
    // Mount project files
    await container.mount(this.getProjectFiles());
    
    // Install dependencies
    const installProcess = await container.spawn('npm', ['install']);
    await installProcess.exit;
    
    // Start development server
    const devProcess = await container.spawn('npm', ['run', 'dev']);
    
    // Get isolated backend URL
    const backendUrl = await this.allocateBackendInstance(taskId);
    
    return {
      id: generateId(),
      taskId,
      agentId,
      container,
      backendUrl,
      status: 'running',
      ports: {
        frontend: 3000,
        backend: await this.getBackendPort(backendUrl)
      }
    };
  }
}
```

#### Option 2: CodeSandbox Runtime
```typescript
interface CodeSandboxEnvironment {
  id: string;
  sandboxId: string;
  taskId: string;
  agentId: string;
  previewUrl: string;
  editorUrl: string;
  backendConnection: BackendConnection;
}

class CodeSandboxManager {
  async createSandbox(
    taskId: string,
    template: SandboxTemplate
  ): Promise<CodeSandboxEnvironment> {
    const sandbox = await createSandbox({
      template,
      files: await this.getTaskFiles(taskId),
      environmentVariables: {
        VITE_API_URL: await this.getIsolatedBackendUrl(taskId),
        VITE_WS_URL: await this.getIsolatedWebSocketUrl(taskId)
      }
    });
    
    return {
      id: generateId(),
      sandboxId: sandbox.id,
      taskId,
      agentId: this.getAgentId(taskId),
      previewUrl: sandbox.previewUrl,
      editorUrl: sandbox.editorUrl,
      backendConnection: await this.establishBackendConnection(sandbox)
    };
  }
}
```

#### Option 3: Sandpack (CodeSandbox SDK)
```typescript
interface SandpackEnvironment {
  id: string;
  taskId: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  backendProxy: BackendProxy;
  previewRef: React.RefObject<HTMLIFrameElement>;
}

// React component for embedded preview
const IsolatedPreview: React.FC<{ taskId: string }> = ({ taskId }) => {
  const environment = useIsolatedEnvironment(taskId);
  
  return (
    <SandpackProvider
      template="react-ts"
      files={environment.files}
      customSetup={{
        dependencies: environment.dependencies,
        environment: {
          VITE_API_URL: environment.backendProxy.url
        }
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor />
        <SandpackPreview 
          ref={environment.previewRef}
          showNavigator
          showRefreshButton
        />
      </SandpackLayout>
    </SandpackProvider>
  );
};
```

### 2. Isolated Backend Architecture

#### 2.1 Backend Instance Management
```rust
pub struct IsolatedBackendManager {
    instance_pool: Arc<InstancePool>,
    proxy_manager: Arc<ProxyManager>,
    database_manager: Arc<DatabaseManager>,
}

impl IsolatedBackendManager {
    pub async fn create_isolated_instance(
        &self,
        task_id: Uuid,
        agent_id: Uuid,
    ) -> Result<IsolatedInstance> {
        // 1. Allocate isolated database
        let db_url = self.database_manager
            .create_isolated_db(task_id)
            .await?;
        
        // 2. Spawn backend instance
        let instance = self.instance_pool
            .spawn_instance(InstanceConfig {
                task_id,
                agent_id,
                database_url: db_url,
                port: 0, // Dynamic port allocation
                resource_limits: ResourceLimits {
                    memory_mb: 512,
                    cpu_shares: 256,
                },
            })
            .await?;
        
        // 3. Setup proxy routing
        let proxy_endpoint = self.proxy_manager
            .register_instance(task_id, instance.port)
            .await?;
        
        Ok(IsolatedInstance {
            id: instance.id,
            task_id,
            agent_id,
            url: proxy_endpoint.public_url,
            websocket_url: proxy_endpoint.ws_url,
            database_url: db_url,
            status: InstanceStatus::Running,
        })
    }
}
```

#### 2.2 Dynamic Proxy Routing
```rust
pub struct ProxyManager {
    routes: Arc<RwLock<HashMap<String, ProxyRoute>>>,
    load_balancer: Arc<LoadBalancer>,
}

#[derive(Clone)]
pub struct ProxyRoute {
    pub path_prefix: String,  // /preview/:task_id
    pub backend_url: String,  // http://localhost:dynamic_port
    pub websocket_url: String, // ws://localhost:dynamic_port
    pub auth_token: String,   // Isolated instance auth
}

impl ProxyManager {
    pub async fn route_request(
        &self,
        request: Request<Body>,
    ) -> Result<Response<Body>> {
        let task_id = extract_task_id(&request)?;
        let route = self.routes.read().await
            .get(&task_id)
            .ok_or(ProxyError::RouteNotFound)?
            .clone();
        
        // Add authentication header
        let mut proxied_request = request;
        proxied_request.headers_mut().insert(
            "X-Isolated-Auth",
            HeaderValue::from_str(&route.auth_token)?
        );
        
        // Forward to backend instance
        self.forward_to_backend(proxied_request, &route).await
    }
}
```

### 3. Enhanced Real-Time Updates

#### 3.1 Environment-Aware SSE/WebSocket
```typescript
interface EnvironmentAwareConnection {
  taskId: string;
  environmentId: string;
  connection: WebSocket | EventSource;
  channels: {
    logs: MessageChannel;
    state: MessageChannel;
    preview: MessageChannel;
    collaboration: MessageChannel;
  };
}

class EnvironmentConnectionManager {
  private connections: Map<string, EnvironmentAwareConnection> = new Map();
  
  async connectToEnvironment(
    taskId: string,
    environmentId: string
  ): Promise<EnvironmentAwareConnection> {
    const backendUrl = await this.getEnvironmentBackendUrl(taskId);
    
    // Establish WebSocket connection
    const ws = new WebSocket(`${backendUrl}/ws/${environmentId}`);
    
    // Setup message channels
    const channels = {
      logs: new MessageChannel(),
      state: new MessageChannel(),
      preview: new MessageChannel(),
      collaboration: new MessageChannel(),
    };
    
    // Route messages to appropriate channels
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const channel = channels[message.channel];
      if (channel) {
        channel.port1.postMessage(message.data);
      }
    };
    
    const connection = {
      taskId,
      environmentId,
      connection: ws,
      channels,
    };
    
    this.connections.set(environmentId, connection);
    return connection;
  }
}
```

#### 3.2 Preview State Synchronization
```typescript
interface PreviewState {
  environmentId: string;
  taskId: string;
  files: Map<string, FileState>;
  routes: Route[];
  currentRoute: string;
  consoleOutput: ConsoleEntry[];
  networkRequests: NetworkRequest[];
  performance: PerformanceMetrics;
}

class PreviewSynchronizer {
  private state: PreviewState;
  private connection: EnvironmentAwareConnection;
  
  async syncWithBackend(): Promise<void> {
    // Listen for file changes
    this.connection.channels.state.port2.onmessage = (event) => {
      if (event.data.type === 'file_change') {
        this.updateFile(event.data.file);
        this.triggerHotReload();
      }
    };
    
    // Listen for console output
    this.connection.channels.logs.port2.onmessage = (event) => {
      this.state.consoleOutput.push(event.data);
      this.notifyConsoleUpdate();
    };
    
    // Listen for preview updates
    this.connection.channels.preview.port2.onmessage = (event) => {
      if (event.data.type === 'route_change') {
        this.state.currentRoute = event.data.route;
        this.updatePreviewFrame();
      }
    };
  }
  
  private triggerHotReload(): void {
    // Send HMR update to preview iframe
    const iframe = document.querySelector<HTMLIFrameElement>('#preview-frame');
    iframe?.contentWindow?.postMessage({
      type: 'vite:hmr',
      updates: this.getFileUpdates(),
    }, '*');
  }
}
```

### 4. Frontend Integration

#### 4.1 Preview Component
```tsx
interface IsolatedPreviewProps {
  taskId: string;
  agentId: string;
  showEditor?: boolean;
  showConsole?: boolean;
  showNetwork?: boolean;
}

const IsolatedPreview: React.FC<IsolatedPreviewProps> = ({
  taskId,
  agentId,
  showEditor = true,
  showConsole = true,
  showNetwork = false,
}) => {
  const [environment, setEnvironment] = useState<WebContainerEnvironment | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const initEnvironment = async () => {
      const manager = new WebContainerManager();
      const env = await manager.createIsolatedEnvironment(taskId, agentId);
      
      // Connect to isolated backend
      const connection = await new EnvironmentConnectionManager()
        .connectToEnvironment(taskId, env.id);
      
      // Setup log streaming
      connection.channels.logs.port2.onmessage = (event) => {
        setLogs(prev => [...prev, event.data]);
      };
      
      setEnvironment(env);
      setLoading(false);
    };
    
    initEnvironment();
    
    return () => {
      environment?.container.teardown();
    };
  }, [taskId, agentId]);
  
  if (loading) {
    return <div>Initializing isolated environment...</div>;
  }
  
  return (
    <div className="isolated-preview">
      <div className="preview-header">
        <span>Task: {taskId}</span>
        <span>Agent: {agentId}</span>
        <span>Backend: {environment?.backendUrl}</span>
        <button onClick={() => environment?.container.reload()}>
          Reload
        </button>
      </div>
      
      <div className="preview-layout">
        {showEditor && (
          <div className="editor-panel">
            <MonacoEditor
              files={environment?.files}
              onChange={(file, content) => {
                environment?.container.fs.writeFile(file, content);
              }}
            />
          </div>
        )}
        
        <div className="preview-panel">
          <iframe
            src={`http://localhost:${environment?.ports.frontend}`}
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        
        {showConsole && (
          <div className="console-panel">
            <Console logs={logs} />
          </div>
        )}
        
        {showNetwork && (
          <div className="network-panel">
            <NetworkMonitor taskId={taskId} />
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 4.2 Environment Manager UI
```tsx
const EnvironmentManager: React.FC = () => {
  const [environments, setEnvironments] = useState<IsolatedEnvironment[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  
  return (
    <div className="environment-manager">
      <div className="env-list">
        <h3>Active Environments</h3>
        {environments.map(env => (
          <div
            key={env.id}
            className={`env-item ${selectedEnv === env.id ? 'selected' : ''}`}
            onClick={() => setSelectedEnv(env.id)}
          >
            <div className="env-info">
              <span className="task-id">{env.taskId}</span>
              <span className="agent-type">{env.agentType}</span>
              <span className="status">{env.status}</span>
            </div>
            <div className="env-actions">
              <button onClick={() => openInNewTab(env)}>
                Open in Tab
              </button>
              <button onClick={() => terminateEnvironment(env.id)}>
                Terminate
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="env-preview">
        {selectedEnv && (
          <IsolatedPreview
            taskId={environments.find(e => e.id === selectedEnv)?.taskId}
            agentId={environments.find(e => e.id === selectedEnv)?.agentId}
          />
        )}
      </div>
    </div>
  );
};
```

### 5. Implementation Plan

#### Phase 1: Backend Isolation (Week 1)
- [ ] Implement `IsolatedBackendManager`
- [ ] Create dynamic proxy routing
- [ ] Setup isolated database provisioning
- [ ] Implement resource limits

#### Phase 2: Browser Environment (Week 2)
- [ ] Integrate WebContainers/Sandpack
- [ ] Implement file synchronization
- [ ] Setup hot module replacement
- [ ] Create preview iframe management

#### Phase 3: Real-Time Sync (Week 3)
- [ ] Enhance SSE/WebSocket for environments
- [ ] Implement preview state synchronization
- [ ] Add console/network monitoring
- [ ] Setup collaborative features

#### Phase 4: UI Integration (Week 4)
- [ ] Build IsolatedPreview component
- [ ] Create EnvironmentManager UI
- [ ] Add split-pane layouts
- [ ] Implement environment controls

### 6. Configuration

#### Environment Configuration
```yaml
# .vibe-kanban/environment.yaml
isolation:
  provider: webcontainer  # webcontainer | codesandbox | sandpack
  
  backend:
    max_instances: 10
    instance_timeout: 30m
    resource_limits:
      memory_mb: 512
      cpu_shares: 256
      disk_mb: 1024
  
  frontend:
    hot_reload: true
    auto_save: true
    sync_delay_ms: 500
  
  preview:
    default_port: 3000
    allowed_origins:
      - http://localhost:3000
      - https://*.stackblitz.io
    
  security:
    sandbox_attributes:
      - allow-scripts
      - allow-same-origin
      - allow-forms
    csp_policy: "default-src 'self'; script-src 'self' 'unsafe-inline'"
```

### 7. API Endpoints

#### Environment Management API
```yaml
/api/environments:
  post:
    summary: Create isolated environment
    requestBody:
      taskId: string
      agentId: string
      template: string
    response:
      environmentId: string
      previewUrl: string
      backendUrl: string
      
/api/environments/{id}:
  get:
    summary: Get environment status
  delete:
    summary: Terminate environment
    
/api/environments/{id}/files:
  get:
    summary: List environment files
  put:
    summary: Update file in environment
    
/api/environments/{id}/console:
  get:
    summary: Stream console output (SSE)
    
/api/environments/{id}/network:
  get:
    summary: Get network requests
```

### 8. Security Considerations

#### Isolation Security
- Each environment runs in isolated context
- Backend instances have separate databases
- Network isolation between environments
- Resource limits prevent DoS
- Authentication per environment

#### Browser Security
- Content Security Policy enforcement
- Iframe sandboxing
- Origin validation
- XSS prevention
- CORS configuration per environment

### 9. Performance Optimization

#### Resource Management
```typescript
class EnvironmentResourceManager {
  private readonly MAX_ENVIRONMENTS = 10;
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  async enforceResourceLimits(): Promise<void> {
    // Terminate idle environments
    const idleEnvironments = await this.getIdleEnvironments();
    for (const env of idleEnvironments) {
      await this.terminateEnvironment(env.id);
    }
    
    // Limit concurrent environments
    if (this.activeEnvironments.size >= this.MAX_ENVIRONMENTS) {
      const lru = this.getLeastRecentlyUsed();
      await this.suspendEnvironment(lru.id);
    }
  }
}
```

### 10. Monitoring & Analytics

#### Environment Metrics
- Environment creation time
- Resource usage per environment
- Preview load times
- Hot reload performance
- Error rates
- User interactions

#### Dashboard
```typescript
interface EnvironmentMetrics {
  totalEnvironments: number;
  activeEnvironments: number;
  averageLifetime: Duration;
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
  errorRate: number;
  userSatisfaction: number;
}
```

## Benefits

1. **Zero Setup**: No local environment needed
2. **Instant Preview**: See changes immediately
3. **Isolated Testing**: Each task/agent has its own environment
4. **Collaboration**: Share preview URLs
5. **Resource Efficiency**: Automatic cleanup and limits
6. **Security**: Sandboxed execution
7. **Debugging**: Integrated console and network tools

## Success Criteria

- [ ] Environment creation < 5 seconds
- [ ] Hot reload < 500ms
- [ ] Support 10+ concurrent environments
- [ ] 99.9% preview availability
- [ ] Zero cross-environment interference
- [ ] Full browser compatibility (Chrome, Firefox, Safari, Edge)

---

This specification transforms the real-time updates system into a comprehensive browser-based development environment with full isolation and preview capabilities.