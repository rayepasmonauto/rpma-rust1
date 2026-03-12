---
title: "Frontend Architecture"
summary: "Next.js 14 frontend with domain mirroring, TanStack Query for backend state, and Zustand for UI state"
read_when:
* Implementing frontend features
* Understanding state management
* Creating new components
* Adding domain functionality
---

## Overview

The frontend mirrors backend domain boundaries, using **TanStack Query** for backend state and **Zustand** for local UI state. Components are thin, with logic in hooks and services.

**Related ADRs**: [ADR-010](./adr/010-frontend-domain-mirroring.md), [ADR-012](./adr/012-tanstack-query-state.md), [ADR-013](./adr/013-zustand-ui-state.md)

## Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | App Router, routing, layouts |
| React 18 | UI components |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI component library |
| TanStack Query | Backend/server state management |
| Zustand | Local UI state management |

## Domain Structure

Frontend domains mirror backend bounded contexts.

Location: `frontend/src/domains/`

| Domain | Purpose |
|--------|---------|
| `auth` | Authentication, login, session |
| `users` | User management UI |
| `tasks` | Task CRUD, workflow, filtering |
| `interventions` | Intervention workflow UI |
| `clients` | Client management |
| `inventory` | Inventory tracking UI |
| `quotes` | Quote management |
| `calendar` | Calendar views |
| `reports` | Report generation |
| `settings` | Settings pages |
| `sync` | Sync indicator |
| `notifications` | Notification UI |
| `dashboard` | Dashboard views |
| `admin` | Admin panel |
| `audit` | Audit logs |
| `bootstrap` | Initial setup |
| `performance` | Performance monitoring |

## Domain Internal Structure

```
frontend/src/domains/tasks/
├── api/
│   ├── index.ts              # Public API exports
│   ├── types.ts              # Domain-specific types
│   ├── useTasks.ts           # Query hooks
│   ├── useTaskActions.ts     # Mutation hooks
│   ├── TaskProvider.tsx      # Context provider
│   └── taskGateway.ts        # Gateway abstraction
├── components/
│   ├── TaskManager.tsx       # Main component
│   ├── TaskListTable.tsx     # List view
│   ├── TaskForm/             # Form components
│   │   ├── TaskForm.tsx
│   │   ├── TaskFormWizard.tsx
│   │   └── steps/
│   ├── TaskOverview/         # Detail views
│   └── __tests__/            # Component tests
├── hooks/
│   ├── useTasks.ts           # Domain hooks
│   ├── useTaskActions.ts
│   ├── useTaskFiltering.ts
│   └── useTaskState.ts
├── ipc/
│   ├── index.ts              # IPC wrapper exports
│   └── task.ipc.ts           # Typed IPC calls
├── services/
│   ├── index.ts
│   ├── task.service.ts       # Business logic
│   └── task-csv.service.ts   # CSV export
├── utils/
│   ├── display.ts            # Display utilities
│   └── task-presentation.ts
├── __tests__/                # Integration tests
└── index.ts                  # Domain public API
```

## State Management

### TanStack Query (Backend State)

Used for all data that comes from or syncs with the backend.

Location: `frontend/src/app/providers.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const err = error as Error & { code?: string };
        if (err?.code === 'AUTH_FORBIDDEN' || err?.code === 'AUTHORIZATION') {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
```

#### Query Hooks Pattern

```typescript
// frontend/src/domains/tasks/api/useTasks.ts
export function useTasks(filters: TaskQuery) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskIpc.list(filters),
    staleTime: 30_000,
  });
}
```

#### Mutation with Cache Invalidation

```typescript
// frontend/src/domains/tasks/api/useTaskActions.ts
export function useTaskActions() {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: (data: CreateTaskRequest) => taskIpc.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return { createTask };
}
```

### Zustand (UI State)

Used for local component state that doesn't need backend sync.

Pattern: Create stores in `domains/*/stores/` when needed.

## Component Guidelines

### Thin Components

Components should delegate to hooks and services:

```typescript
// Good: Component delegates to hook
function TaskManager() {
  const { tasks, isLoading } = useTasks(filters);
  const { createTask } = useTaskActions();
  
  return <TaskList tasks={tasks} onCreate={createTask} />;
}

// Bad: Component contains business logic
function TaskManager() {
  const [tasks, setTasks] = useState([]);
  // ... business logic in component
}
```

### Provider Pattern

Domain providers wrap query hooks and provide context:

```typescript
// frontend/src/domains/tasks/api/TaskProvider.tsx
export function TaskProvider({ children }) {
  const tasksQuery = useTasks(defaultFilters);
  const taskActions = useTaskActions();

  return (
    <TaskContext.Provider value={{ tasksQuery, taskActions }}>
      {children}
    </TaskContext.Provider>
  );
}
```

## Import Rules

```typescript
// Good: Import from domain public API
import { useTasks, useTaskActions } from '@/domains/tasks';
import { taskIpc } from '@/domains/tasks/ipc';

// Good: Import from shared UI
import { Button } from '@/shared/ui';

// Bad: Import from another domain's internals
import { TaskForm } from '@/domains/tasks/components/TaskForm';
```

## Key Files

| Purpose | Location |
|---------|----------|
| App providers | `frontend/src/app/providers.tsx` |
| Shared UI | `frontend/src/shared/ui/` |
| Shared hooks | `frontend/src/shared/hooks/` |
| IPC commands | `frontend/src/lib/ipc/commands.ts` |
| Query keys | `frontend/src/lib/query-keys.ts` |
| Generated types | `frontend/src/types/` (DO NOT EDIT) |
