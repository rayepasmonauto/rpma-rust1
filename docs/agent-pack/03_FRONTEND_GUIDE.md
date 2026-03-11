# RPMA v2 - Frontend Guide

> Patterns, conventions, and best practices for frontend development.

---

## Frontend Structure

### Directory Layout

```
frontend/src/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout (Server Component)
│   ├── RootClientLayout         # Client providers wrapper
│   ├── page.tsx                 # Dashboard / landing
│   ├── globals.css              # Global styles, Tailwind
│   └── (routes)/                # Route groups
│
├── components/ui/               # shadcn/ui primitives
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   └── ... (40+ components)
│
├── domains/                     # Feature domains (mirror backend)
│   ├── auth/
│   ├── tasks/
│   ├── interventions/
│   ├── clients/
│   └── ... (20 domains)
│
├── lib/                         # Shared utilities
│   ├── ipc/                     # IPC client foundation
│   │   ├── client.ts           # Typed command wrappers
│   │   ├── utils.ts            # safeInvoke()
│   │   ├── cache.ts            # IPC response caching
│   │   └── __tests__/          # Contract tests
│   ├── query-keys.ts           # React Query key factory
│   ├── secureStorage.ts        # Encrypted session storage
│   └── utils.ts                # General utilities
│
├── types/                       # AUTO-GENERATED (Rust → TS)
│   ├── index.ts
│   ├── models.ts
│   └── ... (DO NOT EDIT)
│
└── hooks/                       # Shared custom hooks
    └── use-mobile.tsx
```

---

## Domain Structure Convention

Each domain follows this structure:

```
frontend/src/domains/<domain>/
├── api/                         # React Query hooks (public interface)
│   ├── useGetTasks.ts
│   ├── useCreateTask.ts
│   └── useTaskMutations.ts
│
├── components/                  # Domain-specific UI
│   ├── TaskList.tsx
│   ├── TaskCard.tsx
│   └── TaskForm.tsx
│
├── hooks/                       # Domain hooks & Zustand stores
│   ├── useTaskStore.ts
│   └── useTaskFilters.ts
│
├── ipc/                         # Type-safe IPC wrappers
│   └── tasks.ipc.ts
│
└── services/                    # Frontend business logic
    └── taskTransformers.ts
```

---

## State Management

### 1. Server State (TanStack Query)

**Rule**: All backend data goes through React Query.

```typescript
// frontend/src/domains/tasks/api/useGetTasks.ts
import { useQuery } from '@tanstack/react-query';
import { tasksIpc } from '../ipc/tasks.ipc';
import { queryKeys } from '@/lib/query-keys';

export function useGetTasks(query: TaskQuery) {
  return useQuery({
    queryKey: queryKeys.tasks.list(query),
    queryFn: () => tasksIpc.list(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Query Keys**: Centralized in `frontend/src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    list: (query: TaskQuery) => [...queryKeys.tasks.all, 'list', query] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
  clients: {
    all: ['clients'] as const,
    // ...
  },
  // ...
};
```

**Mutations with Cache Invalidation**:

```typescript
// frontend/src/domains/tasks/api/useCreateTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksIpc.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.all 
      });
    },
  });
}
```

### 2. Global UI State (Zustand)

**Rule**: Client-only state that survives unmounts.

```typescript
// frontend/src/domains/settings/hooks/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
```

**Store Rules**:
- ✅ Store UI flags, filters, preferences
- ❌ Never store server-fetched data
- ❌ Never import from `lib/ipc/` in stores

### 3. Auth State (React Context)

**Single Source**: `AuthProvider` in `frontend/src/domains/auth/api/AuthProvider.tsx`

```typescript
// Usage in components
import { useAuth } from '@/domains/auth/api/AuthProvider';

function MyComponent() {
  const { user, session, logout } = useAuth();
  // ...
}
```

### 4. Form State (React Hook Form + Zod)

```typescript
// frontend/src/domains/tasks/components/TaskForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  clientId: z.string().uuid(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function TaskForm() {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
    },
  });
  
  const onSubmit = (data: TaskFormData) => {
    // Submit via mutation
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

---

## IPC Communication

### Two-Layer Architecture

```
Component/Hook
      ↓
Domain IPC Wrapper (domains/<domain>/ipc/*.ts)
      ↓
Core IPC Client (lib/ipc/utils.ts: safeInvoke())
      ↓
Tauri invoke()
```

### Layer 1: Core IPC Client

```typescript
// frontend/src/lib/ipc/utils.ts
export async function safeInvoke<T>(
  command: string,
  payload?: unknown,
  options?: InvokeOptions
): Promise<T> {
  // 1. Get session token from secure storage
  const session = await AuthSecureStorage.getSession();
  
  // 2. Generate correlation ID
  const correlationId = generateCorrelationId();
  
  // 3. Add auth context
  const payloadWithAuth = {
    ...payload,
    session_token: session?.token,
    correlation_id: correlationId,
  };
  
  // 4. Invoke with timeout (default 120s)
  const timeout = options?.timeout ?? 120000;
  
  // 5. Call Tauri
  const response = await invoke<ApiResponse<T>>(command, payloadWithAuth);
  
  // 6. Validate and return
  if (!response.success) {
    throw new IpcError(response.error);
  }
  
  return response.data;
}
```

### Layer 2: Domain IPC Wrappers

```typescript
// frontend/src/domains/tasks/ipc/tasks.ipc.ts
import { safeInvoke } from '@/lib/ipc/utils';
import type { Task, CreateTaskRequest, TaskQuery } from '@/types';

export const tasksIpc = {
  async list(query: TaskQuery): Promise<Task[]> {
    return safeInvoke('task_crud', { operation: 'list', query });
  },
  
  async getById(id: string): Promise<Task> {
    return safeInvoke('task_crud', { operation: 'get', id });
  },
  
  async create(data: CreateTaskRequest): Promise<Task> {
    return safeInvoke('task_crud', { operation: 'create', data });
  },
  
  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    return safeInvoke('edit_task', { id, ...data });
  },
  
  async delete(id: string): Promise<void> {
    return safeInvoke('task_crud', { operation: 'delete', id });
  },
};
```

**Rule**: Always use domain wrappers; never call `safeInvoke()` directly from components.

---

## Adding New UI Features

### Step-by-Step Guide

#### 1. Define Types (Backend First)

Ensure Rust types derive `TS` and are exported:

```rust
// src-tauri/src/domains/<domain>/domain/models/
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MyNewEntity {
    pub id: String,
    pub name: String,
}
```

#### 2. Sync Types

```bash
npm run types:sync
```

#### 3. Create IPC Wrapper

```typescript
// frontend/src/domains/<domain>/ipc/<domain>.ipc.ts
import { safeInvoke } from '@/lib/ipc/utils';
import type { MyNewEntity } from '@/types';

export const myDomainIpc = {
  async getAll(): Promise<MyNewEntity[]> {
    return safeInvoke('my_command', { operation: 'list' });
  },
  // ...
};
```

#### 4. Create React Query Hooks

```typescript
// frontend/src/domains/<domain>/api/useGetEntities.ts
import { useQuery } from '@tanstack/react-query';
import { myDomainIpc } from '../ipc/<domain>.ipc';
import { queryKeys } from '@/lib/query-keys';

export function useGetEntities() {
  return useQuery({
    queryKey: queryKeys.<domain>.all,
    queryFn: () => myDomainIpc.getAll(),
  });
}
```

#### 5. Create Components

```typescript
// frontend/src/domains/<domain>/components/EntityList.tsx
'use client';

import { useGetEntities } from '../api/useGetEntities';

export function EntityList() {
  const { data, isLoading, error } = useGetEntities();
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {data?.map(entity => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
}
```

#### 6. Add Route (if needed)

```typescript
// frontend/src/app/<route>/page.tsx
import { EntityList } from '@/domains/<domain>/components/EntityList';

export default function EntityPage() {
  return <EntityList />;
}
```

---

## Component Conventions

### Use Client Directive

Always add `'use client'` for components using:
- React hooks (useState, useEffect, etc.)
- Browser APIs
- Tauri APIs

```typescript
'use client';

import { useState } from 'react';

export function MyClientComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

### Props Interface Naming

```typescript
// ✅ Good
interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  // ...
}
```

### Form Patterns

Use shadcn/ui `Form` component with React Hook Form:

```typescript
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Common Pitfalls

### 1. Type Drift

**Problem**: Frontend types don't match backend.

**Solution**: Always run `npm run types:sync` after Rust model changes.

**Detection**: `npm run types:drift-check` in CI.

### 2. IPC Naming Mismatches

**Problem**: Command name in frontend doesn't match backend.

**Solution**: 
- Check `src-tauri/src/main.rs` for exact command names
- Use the `ipc-consistency-check.js` script

### 3. Large Payload Handling

**Problem**: Sending too much data over IPC causes performance issues.

**Solution**:
- Use pagination for lists
- Compress large payloads (backend supports `CompressedApiResponse`)
- Stream large files via dedicated commands

### 4. Missing Cache Invalidation

**Problem**: Mutations don't refresh the UI.

**Solution**: Always invalidate related query keys:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
}
```

### 5. Cross-Domain Component Imports

**Problem**: Importing internal components from other domains.

**Solution**: 
- ✅ Import from `components/ui/` (shared primitives)
- ✅ Use domain `api/` (React Query hooks) for data
- ❌ Don't import from `domains/X/components/` in domain Y

---

## Debugging Tips

### IPC Debugging

Enable verbose logging in dev:

```typescript
// In browser console
localStorage.setItem('IPC_DEBUG', 'true');
```

### React Query DevTools

Installed by default. Open browser devtools → "React Query" tab.

### Type Checking

```bash
# Frontend only
cd frontend && npm run type-check

# Full project
npm run frontend:type-check
```

### Linting

```bash
npm run frontend:lint
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/lib/ipc/client.ts` | 1475+ lines of typed IPC wrappers |
| `frontend/src/lib/ipc/utils.ts` | `safeInvoke()` core function |
| `frontend/src/lib/query-keys.ts` | React Query key factory |
| `frontend/src/lib/secureStorage.ts` | Session token encryption |
| `frontend/src/types/` | Auto-generated from Rust (READ-ONLY) |
| `frontend/src/components/ui/` | shadcn/ui base components |

---

## Next Steps

- **Backend Guide**: See [04_BACKEND_GUIDE.md](./04_BACKEND_GUIDE.md)
- **IPC Reference**: See [05_IPC_API_AND_CONTRACTS.md](./05_IPC_API_AND_CONTRACTS.md)
- **Security**: See [06_SECURITY_AND_RBAC.md](./06_SECURITY_AND_RBAC.md)

---

*Frontend architecture: See docs/adr/016-frontend-architecture.md*
