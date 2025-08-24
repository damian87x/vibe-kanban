# Event Streaming Architecture

## Overview
Vibe Kanban uses Server-Sent Events (SSE) for real-time updates instead of WebSockets.

## Why SSE?
- Simpler client implementation
- Automatic reconnection
- HTTP/2 multiplexing support
- Better proxy compatibility
- Unidirectional (server → client) fits our use case

## Core Components

### Message Store
Each event stream maintains a `MsgStore` for buffering messages:

```rust
pub struct MsgStore {
    messages: Arc<RwLock<Vec<Message>>>,
    subscribers: Arc<RwLock<Vec<Sender<Message>>>>,
}
```

### Event Service
Coordinates event broadcasting:

```rust
pub struct EventService {
    stores: Arc<RwLock<HashMap<Uuid, Arc<MsgStore>>>>,
}
```

## Event Streams

### 1. Global Database Events
**Endpoint**: `/api/events/`

Streams all database changes as JSON patches:
```javascript
data: {"op":"add","path":"/tasks/123","value":{...}}
data: {"op":"replace","path":"/tasks/123/status","value":"inprogress"}
data: {"op":"remove","path":"/tasks/123"}
```

### 2. Process Log Stream
**Endpoint**: `/api/events/processes/:id/logs`

Streams process output:
```javascript
data: {"type":"stdout","content":"Building project...","timestamp":"2024-01-01T00:00:00Z"}
data: {"type":"stderr","content":"Warning: ...","timestamp":"2024-01-01T00:00:01Z"}
```

### 3. Task Diff Stream
**Endpoint**: `/api/events/task-attempts/:id/diff`

Streams git diff updates:
```javascript
data: {"file":"src/main.rs","diff":"@@ -1,3 +1,4 @@\n+use std::io;\n fn main() {"}
```

## Frontend Integration

### EventSource Manager Hook
```typescript
export const useEventSourceManager = (url: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  useEffect(() => {
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      // Automatic reconnection handled by browser
    };
    
    return () => {
      eventSource.close();
    };
  }, [url]);
  
  return { messages, eventSource: eventSourceRef.current };
};
```

### Log Streaming Hook
```typescript
export const useLogStream = (processId: string) => {
  const { messages } = useEventSourceManager(
    `/api/events/processes/${processId}/logs`
  );
  
  const logs = useMemo(() => {
    return messages.map(msg => ({
      type: msg.type as 'stdout' | 'stderr',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));
  }, [messages]);
  
  return logs;
};
```

### Diff Streaming Hook
```typescript
export const useDiffStream = (attemptId: string) => {
  const [diff, setDiff] = useState<string>('');
  const { messages } = useEventSourceManager(
    `/api/events/task-attempts/${attemptId}/diff`
  );
  
  useEffect(() => {
    // Accumulate diff updates
    const fullDiff = messages
      .map(msg => msg.diff)
      .join('\n');
    setDiff(fullDiff);
  }, [messages]);
  
  return diff;
};
```

## Backend Implementation

### Creating an Event Stream
```rust
pub async fn stream_logs(
    Path(process_id): Path<Uuid>,
    State(deployment): State<Arc<LocalDeployment>>,
) -> impl IntoResponse {
    let stream = deployment
        .events
        .subscribe_to_process(process_id)
        .await;
    
    Sse::new(stream)
        .keep_alive(Duration::from_secs(30))
}
```

### Publishing Events
```rust
pub async fn publish_log(&self, process_id: Uuid, log: LogEntry) {
    if let Some(store) = self.get_store(process_id).await {
        store.publish(Message::Log(log)).await;
    }
}
```

### Message Store Pattern
```rust
impl MsgStore {
    pub async fn publish(&self, message: Message) {
        // Add to buffer
        self.messages.write().await.push(message.clone());
        
        // Notify subscribers
        let subscribers = self.subscribers.read().await;
        for sender in subscribers.iter() {
            let _ = sender.send(message.clone()).await;
        }
    }
    
    pub async fn subscribe(&self) -> impl Stream<Item = Message> {
        let (tx, rx) = channel(100);
        self.subscribers.write().await.push(tx);
        
        // Send historical messages
        for msg in self.messages.read().await.iter() {
            let _ = tx.send(msg.clone()).await;
        }
        
        ReceiverStream::new(rx)
    }
}
```

## Event Types

### Normalized Log Entry
```rust
pub enum LogEntryType {
    Stdout(String),
    Stderr(String),
    System(String),
    Error(String),
}
```

### JSON Patch Operations
```rust
pub enum PatchOp {
    Add { path: String, value: Value },
    Replace { path: String, value: Value },
    Remove { path: String },
}
```

### Database Change Events
```rust
pub struct DatabaseChange {
    pub table: String,
    pub operation: Operation,
    pub id: Uuid,
    pub data: Option<Value>,
}
```

## Performance Considerations

### Buffering
- Messages buffered in memory
- Configurable buffer size
- Old messages pruned periodically

### Backpressure
- Slow clients don't block others
- Channel buffers prevent overflow
- Automatic disconnection on timeout

### Connection Management
- Keep-alive pings every 30 seconds
- Automatic reconnection on disconnect
- Exponential backoff for retries

## Error Handling

### Client-Side
```typescript
eventSource.onerror = (error) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    // Connection closed, will reconnect automatically
    console.log('SSE connection closed, reconnecting...');
  } else {
    // Connection error
    console.error('SSE error:', error);
  }
};
```

### Server-Side
```rust
// Graceful shutdown
impl Drop for MsgStore {
    fn drop(&mut self) {
        // Close all subscriber channels
        for sender in self.subscribers.write().iter() {
            sender.close();
        }
    }
}
```

## Best Practices

### 1. Use Unique Stream IDs
Each stream should have a unique identifier (process ID, attempt ID).

### 2. Clean Up Completed Streams
Remove message stores for completed processes to free memory.

### 3. Implement Heartbeat
Send periodic keep-alive messages to detect stale connections.

### 4. Handle Reconnection
Frontend should handle reconnection gracefully without losing state.

### 5. Limit Message Size
Keep individual messages small for better streaming performance.

## Debugging

### Monitor Active Streams
```rust
pub async fn get_active_streams(&self) -> Vec<Uuid> {
    self.stores.read().await.keys().cloned().collect()
}
```

### Log Stream Events
```rust
tracing::debug!("New subscriber for stream {}", stream_id);
tracing::debug!("Publishing message to {} subscribers", count);
```

### Frontend Debugging
```typescript
// Log all SSE events
eventSource.addEventListener('open', () => console.log('SSE connected'));
eventSource.addEventListener('error', (e) => console.error('SSE error', e));
eventSource.addEventListener('message', (e) => console.log('SSE message', e.data));
```