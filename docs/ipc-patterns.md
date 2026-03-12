---
title: "IPC Patterns"
summary: "Type-safe IPC wrapper abstraction for Tauri communication with validation, caching, and error handling"
read_when:
* Adding new IPC commands
* Debugging IPC issues
* Implementing cache invalidation
* Creating domain IPC wrappers
---

## Overview

All Tauri IPC calls must go through typed domain wrappers. **Never use `invoke` directly from components.** This provides type safety, caching, error handling, and testability.

**Related ADRs**: [ADR-011](./adr/011-type-safe-ipc-wrappers.md), [ADR-009](./adr/009-compressed-api-responses.md)

## Core Principle

```typescript
// Bad: Direct invoke from component
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('task_crud', { ... });

// Good: Use domain IPC wrapper
import { taskIpc } from '@/domains/tasks/ipc';
const result = await taskIpc.create(data);
```

## Core Utilities

Location: `frontend/src/lib/ipc/core/index.ts`

```typescript
export { safeInvoke } from '../utils';
export { cachedInvoke, invalidatePattern } from '../cache';
export { extractAndValidate, ResponseHandlers } from './response-handlers';
```

### safeInvoke

Wraps Tauri invoke with error handling, logging, metrics, and session injection.

Location: `frontend/src/lib/ipc/utils.ts`

```typescript
export async function safeInvoke<T>(
  command: string,
  args?: JsonObject,
  validator?: (data: JsonValue) => T,
  timeoutMs: number = 120000
): Promise<T>
```

Features:
- Automatic session token injection for protected commands
- Correlation ID generation and propagation
- Timeout handling
- Error mapping to user-friendly messages
- Metrics recording
- Structured logging

### cachedInvoke

Caches IPC responses with pattern-based invalidation.

Location: `frontend/src/lib/ipc/cache.ts`

```typescript
export function cachedInvoke<T>(
  key: string,
  command: string,
  args: object,
  validator: (data: unknown) => T
): Promise<T>

export function invalidatePattern(pattern: string): void
```

### extractAndValidate

Extracts and validates response data.

```typescript
export function extractAndValidate<T>(
  data: unknown,
  validator: (data: unknown) => T,
  options?: { handleNotFound?: boolean }
): T
```

## Domain IPC Wrapper Pattern

Each domain has an `ipc/` folder with typed wrappers.

### Example: Task IPC

Location: `frontend/src/domains/tasks/ipc/task.ipc.ts`

```typescript
import { safeInvoke, extractAndValidate, cachedInvoke, invalidatePattern } from '@/lib/ipc/core';
import { signalMutation } from '@/lib/data-freshness';
import { IPC_COMMANDS } from '@/lib/ipc/commands';
import { validateTask, validateTaskListResponse } from '@/lib/validation/backend-type-guards';

export const taskIpc = {
  create: async (data: CreateTaskRequest): Promise<Task> => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.TASK_CRUD, {
      request: { action: { action: 'Create', data } }
    });
    invalidatePattern('task:');
    signalMutation('tasks');
    return extractAndValidate(result, validateTask) as Task;
  },

  get: async (id: string): Promise<Task | null> => {
    return cachedInvoke(`task:${id}`, IPC_COMMANDS.TASK_CRUD, {
      request: { action: { action: 'Get', id } }
    }, (data) => extractAndValidate(data, validateTask, { handleNotFound: true }));
  },

  list: async (filters: Partial<TaskQuery>): Promise<TaskListResponse> => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.TASK_CRUD, {
      request: { action: { action: 'List', filters: { /* defaults */ } } }
    });
    if (!validateTaskListResponse(result)) {
      throw new Error('Invalid response format');
    }
    return result;
  },

  update: async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.TASK_CRUD, {
      request: { action: { action: 'Update', id, data } }
    });
    invalidatePattern('task:');
    return extractAndValidate(result, validateTask) as Task;
  },

  delete: async (id: string): Promise<void> => {
    await safeInvoke<void>(IPC_COMMANDS.TASK_CRUD, {
      request: { action: { action: 'Delete', id } }
    });
    invalidatePattern('task:');
  },
};
```

## Type Guards

Runtime validation for backend responses.

Location: `frontend/src/lib/validation/backend-type-guards.ts`

```typescript
export function validateTask(data: unknown): data is Task {
  if (typeof data !== 'object' || data === null) return false;
  const task = data as Record<string, unknown>;
  return typeof task.id === 'string' &&
         typeof task.title === 'string' &&
         isValidTaskStatus(task.status);
}

export function validateTaskListResponse(data: unknown): data is TaskListResponse {
  // ... validation logic
}
```

## Command Constants

All IPC commands are centralized.

Location: `frontend/src/lib/ipc/commands.ts`

```typescript
export const IPC_COMMANDS = {
  // Tasks
  TASK_CRUD: 'task_crud',
  CHECK_TASK_ASSIGNMENT: 'check_task_assignment',
  EDIT_TASK: 'edit_task',
  GET_TASK_HISTORY: 'get_task_history',
  DELAY_TASK: 'delay_task',
  EXPORT_TASKS_CSV: 'export_tasks_csv',
  IMPORT_TASKS_BULK: 'import_tasks_bulk',
  
  // Auth
  AUTH_LOGIN: 'auth_login',
  AUTH_LOGOUT: 'auth_logout',
  
  // ... more commands
};
```

## Public vs Protected Commands

Some commands don't require authentication:

```typescript
// frontend/src/lib/ipc/utils.ts
export const PUBLIC_COMMANDS = new Set([
  'auth_login',
  'auth_create_account',
  'has_admins',
  'bootstrap_first_admin',
  'get_app_info',
  // ...
]);
```

All other commands require an active session.

## Cache Invalidation Pattern

```typescript
// Invalidate all task-related cache entries
invalidatePattern('task:');

// Signal mutation for data freshness tracking
signalMutation('tasks');

// Invalidate specific entry
queryClient.invalidateQueries({ queryKey: ['task', id] });
```

## Key Files

| Purpose | Location |
|---------|----------|
| Core IPC utilities | `frontend/src/lib/ipc/core/index.ts` |
| safeInvoke | `frontend/src/lib/ipc/utils.ts` |
| Cache utilities | `frontend/src/lib/ipc/cache.ts` |
| Command constants | `frontend/src/lib/ipc/commands.ts` |
| Type guards | `frontend/src/lib/validation/backend-type-guards.ts` |
| Domain IPC wrappers | `frontend/src/domains/*/ipc/` |
