# Frontend Development Standards for Vibe Kanban

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: React hooks and Context API

## TypeScript Standards

### Strict Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Definitions

#### Prefer Interfaces for Object Types
```typescript
// Good
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

// Avoid type aliases for objects
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
};
```

#### Use Type Aliases for Unions and Primitives
```typescript
type TaskStatus = 'todo' | 'inprogress' | 'inreview' | 'done';
type UserId = string;
```

#### Always Type Function Parameters
```typescript
// Good
const updateTask = (taskId: string, updates: Partial<Task>): Promise<Task> => {
  // implementation
};

// Bad
const updateTask = (taskId, updates) => {
  // implementation
};
```

## React Component Standards

### Functional Components Only
```typescript
// Good
export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  return <div>...</div>;
};

// Don't use class components
```

### Component File Structure
```typescript
// TaskCard.tsx
import React from 'react';
import { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  // hooks first
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  
  // event handlers
  const handleSubmit = useCallback(() => {
    // logic
  }, [dependencies]);
  
  // render
  return (
    <Card>
      {/* JSX */}
    </Card>
  );
};
```

### Hook Rules

#### Custom Hooks
```typescript
// hooks/useTaskStream.ts
export const useTaskStream = (taskId: string) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // streaming logic
  }, [taskId]);
  
  return { task, loading };
};
```

#### Hook Dependencies
```typescript
// Always include all dependencies
useEffect(() => {
  fetchTask(taskId);
}, [taskId]); // Don't forget dependencies

// Use useCallback for stable references
const handleUpdate = useCallback((updates: Partial<Task>) => {
  updateTask(task.id, updates);
}, [task.id, updateTask]);
```

## State Management Patterns

### Local State for Component Data
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<TaskFormData>({});
```

### Context for Cross-Component State
```typescript
// contexts/TaskContext.tsx
const TaskContext = React.createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  return (
    <TaskContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
};
```

### URL State for Navigation
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const filter = searchParams.get('filter') || 'all';
```

## API Integration

### API Client Pattern
```typescript
// lib/api.ts
class ApiClient {
  private baseUrl = '/api';
  
  async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  }
  
  async getTasks(projectId: string): Promise<Task[]> {
    return this.request<Task[]>(`/projects/${projectId}/tasks`);
  }
}

export const api = new ApiClient();
```

### Error Handling
```typescript
const TaskList: React.FC = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const fetchTasks = async () => {
    try {
      const tasks = await api.getTasks(projectId);
      setTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Failed to fetch tasks:', err);
    }
  };
  
  if (error) {
    return <ErrorAlert error={error} />;
  }
  
  return <div>...</div>;
};
```

## Styling Standards

### Use Tailwind Classes
```typescript
// Good
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">

// Avoid inline styles unless dynamic
<div style={{ width: dynamicWidth }}>
```

### Component Styling with cn()
```typescript
import { cn } from '@/lib/utils';

<button
  className={cn(
    "px-4 py-2 rounded-md",
    "bg-blue-500 text-white",
    "hover:bg-blue-600",
    disabled && "opacity-50 cursor-not-allowed"
  )}
>
```

### Follow shadcn/ui Patterns
```typescript
// Use shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Extend with custom variants if needed
```

## Real-time Updates

### EventSource for SSE
```typescript
// hooks/useEventSourceManager.ts
export const useEventSourceManager = (url: string) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  
  useEffect(() => {
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // handle update
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      // reconnection logic
    };
    
    return () => {
      eventSource.close();
    };
  }, [url]);
  
  return eventSourceRef.current;
};
```

## Performance Optimization

### Memoization
```typescript
// Memoize expensive computations
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => a.createdAt - b.createdAt);
}, [tasks]);

// Memoize components
const TaskCard = React.memo(({ task }: TaskCardProps) => {
  return <div>...</div>;
});
```

### Code Splitting
```typescript
// Lazy load heavy components
const TaskDetails = lazy(() => import('./TaskDetails'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <TaskDetails taskId={taskId} />
</Suspense>
```

### Virtual Scrolling for Lists
```typescript
// Use react-window for large lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tasks.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  )}
</FixedSizeList>
```

## Testing Guidelines

### Type Checking
```bash
cd frontend && npx tsc --noEmit
```

### Linting
```bash
cd frontend && npm run lint
```

### Component Testing Pattern
```typescript
// __tests__/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../TaskCard';

describe('TaskCard', () => {
  it('displays task title', () => {
    const task = { id: '1', title: 'Test Task' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

## File Organization

```
frontend/src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── tasks/       # Task-related components
│   └── projects/    # Project-related components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
│   ├── api.ts       # API client
│   ├── types.ts     # TypeScript types
│   └── utils.ts     # Helper functions
├── pages/           # Route components
├── contexts/        # React contexts
└── styles/          # Global styles
```

## Common Pitfalls to Avoid

1. **Don't mutate state directly** - Always create new objects/arrays
2. **Don't forget useCallback dependencies** - Include all referenced values
3. **Don't overuse useEffect** - Consider if you really need it
4. **Don't ignore TypeScript errors** - Fix them properly
5. **Don't create inline functions in render** - Use useCallback
6. **Don't fetch in useEffect without cleanup** - Handle component unmounting