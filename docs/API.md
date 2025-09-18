# Vitordo API Documentation

## Overview
Vitordo provides a comprehensive API for task management with AI-powered natural language processing. This document covers all available services, hooks, and components.

## Table of Contents
- [Services](#services)
  - [LLM Service](#llm-service)
  - [Task Service](#task-service)
  - [Storage Service](#storage-service)
  - [Cache Service](#cache-service)
- [Hooks](#hooks)
  - [Task Management Hooks](#task-management-hooks)
  - [Performance Hooks](#performance-hooks)
  - [UI Hooks](#ui-hooks)
- [Components](#components)
  - [Layout Components](#layout-components)
  - [Feature Components](#feature-components)
  - [UI Components](#ui-components)
- [Types](#types)

## Services

### LLM Service
The LLM Service handles natural language processing for task creation and status updates.

#### Methods

##### `parseTaskInput(input: string, context?: Task[], useCache?: boolean): Promise<LLMResponse>`
Parses natural language input into structured task data.

**Parameters:**
- `input` (string): Natural language description of tasks
- `context` (Task[], optional): Current tasks for context awareness
- `useCache` (boolean, optional): Whether to use caching (default: true)

**Returns:** Promise<LLMResponse>

**Example:**
```typescript
import { llmService } from '@/services/llmService';

const response = await llmService.parseTaskInput(
  'Schedule a meeting with John tomorrow at 2 PM',
  currentTasks,
  true
);

if (response.success) {
  console.log('Parsed tasks:', response.tasks);
}
```

##### `updateTaskStatus(input: string, context?: Task[]): Promise<LLMResponse>`
Updates task status based on natural language input.

**Parameters:**
- `input` (string): Natural language status update
- `context` (Task[], optional): Current tasks for context

**Returns:** Promise<LLMResponse>

**Example:**
```typescript
const response = await llmService.updateTaskStatus(
  'I finished the meeting with John',
  currentTasks
);
```

#### Configuration
```typescript
interface LLMServiceConfig {
  primaryProvider: 'openai' | 'anthropic';
  fallbackProvider?: 'openai' | 'anthropic';
  cacheEnabled: boolean;
  cacheTTL: number;
  maxRetries: number;
  timeout: number;
}
```

### Task Service
The Task Service manages CRUD operations for tasks.

#### Methods

##### `createTask(taskData: Partial<Task>): Promise<Task>`
Creates a new task.

**Parameters:**
- `taskData` (Partial<Task>): Task data

**Returns:** Promise<Task>

##### `updateTask(id: string, updates: Partial<Task>): Promise<Task>`
Updates an existing task.

**Parameters:**
- `id` (string): Task ID
- `updates` (Partial<Task>): Fields to update

**Returns:** Promise<Task>

##### `deleteTask(id: string): Promise<void>`
Deletes a task.

**Parameters:**
- `id` (string): Task ID

##### `getTasks(filters?: TaskFilters): Promise<Task[]>`
Retrieves tasks with optional filtering.

**Parameters:**
- `filters` (TaskFilters, optional): Filter criteria

**Returns:** Promise<Task[]>

### Storage Service
The Storage Service handles data persistence using IndexedDB.

#### Methods

##### `store(key: string, data: any): Promise<void>`
Stores data with the given key.

##### `retrieve(key: string): Promise<any>`
Retrieves data by key.

##### `remove(key: string): Promise<void>`
Removes data by key.

##### `clear(): Promise<void>`
Clears all stored data.

### Cache Service
The Cache Service provides intelligent caching with TTL and LRU eviction.

#### Methods

##### `set<T>(key: string, data: T, ttl?: number): Promise<void>`
Sets a cache entry.

##### `get<T>(key: string): T | null`
Gets a cache entry.

##### `has(key: string): boolean`
Checks if a key exists in cache.

##### `delete(key: string): Promise<void>`
Deletes a cache entry.

##### `clear(): Promise<void>`
Clears all cache entries.

## Hooks

### Task Management Hooks

#### `useTaskStatusUpdater()`
Provides task status update functionality.

**Returns:**
```typescript
{
  updateSingleTaskStatus: (id: string, status: TimelineStatus, reason?: string) => Promise<UpdateResponse>;
  updateTaskStatusViaInput: (input: string) => Promise<UpdateResponse>;
  batchUpdateTaskStatus: (updates: TaskStatusUpdate[]) => Promise<UpdateResponse>;
  markTaskCompleted: (id: string, reason?: string) => Promise<UpdateResponse>;
  markTaskUpcoming: (id: string, reason?: string) => Promise<UpdateResponse>;
  archiveTask: (id: string, reason?: string) => Promise<UpdateResponse>;
  autoTransitionTasks: () => Promise<UpdateResponse>;
}
```

**Example:**
```typescript
import { useTaskStatusUpdater } from '@/hooks/useTaskStatusUpdater';

function TaskComponent() {
  const { markTaskCompleted, updateTaskStatusViaInput } = useTaskStatusUpdater();
  
  const handleComplete = async (taskId: string) => {
    const result = await markTaskCompleted(taskId, 'Task finished');
    if (result.success) {
      console.log('Task completed successfully');
    }
  };

  const handleNaturalUpdate = async (input: string) => {
    const result = await updateTaskStatusViaInput(input);
    console.log('Updated tasks:', result.updatedTasks);
  };

  return (
    // Component JSX
  );
}
```

### Performance Hooks

#### `useDebounce<T>(value: T, delay: number): T`
Debounces a value with the specified delay.

**Parameters:**
- `value` (T): Value to debounce
- `delay` (number): Delay in milliseconds

**Returns:** Debounced value

#### `useVirtualScroll<T>(options: VirtualScrollOptions<T>)`
Provides virtual scrolling for large lists.

**Parameters:**
```typescript
interface VirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}
```

**Returns:**
```typescript
{
  visibleItems: Array<{ item: T; index: number }>;
  totalHeight: number;
  offsetY: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}
```

#### `useOptimizedSearch<T>(items: T[], searchFn: SearchFunction<T>, delay?: number)`
Provides optimized search with debouncing and caching.

### UI Hooks

#### `useTheme()`
Provides theme management functionality.

**Returns:**
```typescript
{
  theme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}
```

#### `useError()`
Provides error management functionality.

**Returns:**
```typescript
{
  errors: AppError[];
  addError: (error: Partial<AppError>) => string;
  removeError: (id: string) => void;
  retryError: (id: string) => Promise<void>;
  clearErrors: () => void;
  handleError: (error: Error, context?: string) => void;
}
```

## Components

### Layout Components

#### `MainContainer`
The main application container that orchestrates left and right panels.

**Props:**
```typescript
interface MainContainerProps {
  className?: string;
  animated?: boolean;
}
```

#### `LeftPanel`
The input panel for task creation and management.

**Props:**
```typescript
interface LeftPanelProps {
  onTaskSubmit: (input: string) => Promise<void>;
  isLoading: boolean;
  animated?: boolean;
  llmStatus: LLMStatus;
  onQuickAction: (action: QuickAction) => void;
  showStatusIndicator?: boolean;
  showQuickActions?: boolean;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  inputPlaceholder?: string;
}
```

#### `RightPanel`
The timeline panel for displaying and managing tasks.

**Props:**
```typescript
interface RightPanelProps {
  tasks: Task[];
  animated?: boolean;
  isLoading: boolean;
  onTaskClick: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onFilterClick: () => void;
  onOptionsClick: () => void;
  timelineTitle?: string;
  showFilters?: boolean;
  showOptions?: boolean;
  showQuickUpdate?: boolean;
  groupByStatus?: boolean;
}
```

### Feature Components

#### `StatusRing`
Displays task status with animated ring indicator.

**Props:**
```typescript
interface StatusRingProps {
  status: TimelineStatus;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCheckmark?: boolean;
}
```

**Example:**
```typescript
<StatusRing 
  status={TimelineStatus.RECENTLY_COMPLETED}
  size="lg"
  animated={true}
/>
```

#### `TaskStatusTransition`
Animated component for task status transitions.

**Props:**
```typescript
interface TaskStatusTransitionProps {
  task: Task;
  newStatus: TimelineStatus;
  onTransitionComplete?: (task: Task, newStatus: TimelineStatus) => void;
  className?: string;
  showAnimation?: boolean;
  duration?: number;
}
```

#### `TimelineEvent`
Individual timeline event component.

**Props:**
```typescript
interface TimelineEventProps {
  task: Task;
  index: number;
  animated?: boolean;
  onClick?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  showActions?: boolean;
}
```

### UI Components

#### `Button`
Customizable button component with variants and sizes.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

#### `Card`
Container component for content sections.

**Props:**
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
```

#### `LoadingSpinner`
Animated loading indicator.

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

## Types

### Core Types

#### `Task`
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: TimelineStatus;
  priority: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  category?: string;
}
```

#### `TimelineStatus`
```typescript
enum TimelineStatus {
  UPCOMING = 'upcoming',
  RECENTLY_COMPLETED = 'recently_completed',
  COMPLETED = 'completed'
}
```

#### `LLMResponse`
```typescript
interface LLMResponse {
  success: boolean;
  tasks?: Task[];
  updatedTasks?: Task[];
  error?: string;
  confidence?: number;
  reasoning?: string;
}
```

### Configuration Types

#### `Theme`
```typescript
interface Theme {
  name: string;
  colors: ThemeColors;
  timeline: TimelineColors;
  status: StatusColors;
  radius: string;
}
```

#### `AppError`
```typescript
interface AppError {
  id: string;
  type: 'network' | 'api' | 'validation' | 'unknown';
  message: string;
  details?: string;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}
```

## Error Handling
All services and hooks provide comprehensive error handling:

```typescript
try {
  const result = await llmService.parseTaskInput(input);
  if (result.success) {
    // Handle success
  } else {
    // Handle LLM-level errors
    console.error('LLM Error:', result.error);
  }
} catch (error) {
  // Handle network/system errors
  console.error('System Error:', error);
}
```

## Performance Considerations
- All LLM calls are cached by default with intelligent cache invalidation
- Virtual scrolling is used for large task lists
- Components are lazy-loaded where appropriate
- Debouncing is applied to user inputs
- State updates are batched to minimize re-renders

## Best Practices
1. **Always handle errors**: Use try-catch blocks and check response.success
2. **Use caching**: Enable caching for LLM calls to improve performance
3. **Debounce inputs**: Use useDebounce for search and input fields
4. **Optimize renders**: Use React.memo and useMemo for expensive computations
5. **Test thoroughly**: Write unit tests for all custom hooks and components

## Examples

### Complete Task Creation Flow
```typescript
import { llmService } from '@/services/llmService';
import { taskService } from '@/services/taskService';
import { useTaskStore } from '@/stores/taskStore';

async function createTaskFromInput(input: string) {
  try {
    // Parse natural language input
    const llmResponse = await llmService.parseTaskInput(input);
    if (!llmResponse.success) {
      throw new Error(llmResponse.error);
    }

    // Create tasks in database
    const createdTasks = [];
    for (const taskData of llmResponse.tasks) {
      const task = await taskService.createTask(taskData);
      createdTasks.push(task);
    }

    // Update store
    const { addTasks } = useTaskStore.getState();
    addTasks(createdTasks);

    return { success: true, tasks: createdTasks };
  } catch (error) {
    console.error('Task creation failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Custom Hook Example
```typescript
import { useState, useCallback } from 'react';
import { useTaskStatusUpdater } from '@/hooks/useTaskStatusUpdater';
import { useError } from '@/components/providers/error-provider';

function useTaskManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const { updateTaskStatusViaInput } = useTaskStatusUpdater();
  const { handleError } = useError();

  const processStatusUpdate = useCallback(async (input: string) => {
    setIsLoading(true);
    try {
      const result = await updateTaskStatusViaInput(input);
      if (result.success) {
        return result.updatedTasks;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      handleError(error, 'Task status update');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [updateTaskStatusViaInput, handleError]);

  return {
    processStatusUpdate,
    isLoading,
  };
}
```

This API documentation provides comprehensive coverage of all Vitordo services, hooks, and components with practical examples and best practices.