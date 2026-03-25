---
title: "Frontend Guide"
summary: "Architecture, patterns, and standards for the Next.js frontend."
read_when:
  - "Adding new frontend features"
  - "Modifying UI components"
  - "Working with TanStack Query or Zustand"
---

# 03. FRONTEND GUIDE

The frontend is a **Next.js 14** application in `frontend/` using the App Router and strict TypeScript.

## Directory Structure (`frontend/src/`)

| Directory | Purpose |
|-----------|---------|
| `app/` | Routing, layouts, pages (Next.js App Router) |
| `domains/` | Feature modules mirrored from backend |
| `components/` | Shared UI components (shadcn/ui) |
| `lib/` | IPC client, utilities, core logic |
| `hooks/` | Shared custom React hooks |
| `types/` | **AUTO-GENERATED** from Rust via `ts-rs` (**ADR-015**) — DO NOT EDIT |
| `shared/` | Shared contracts (session, validation) |
| `logging/` | Frontend logging system |

### Domain Structure (`domains/[domain]/`)

| Subfolder | Purpose | Present In |
|-----------|---------|------------|
| `api/` | TanStack Query hooks and query keys | All domains |
| `components/` | Domain-specific UI components | All domains |
| `hooks/` | Domain-specific React hooks | Most domains |
| `ipc/` | Typed wrappers for Tauri `invoke` | All domains |
| `services/` | Frontend business logic | Most domains |
| `stores/` | Zustand stores | `notifications`, `calendar` |
| `server/` | Server-side logic | tasks, clients, auth, admin, interventions, inventory, notifications, users, bootstrap |
| `utils/` | Utility functions | tasks, clients, dashboard, interventions, quotes, users |
| `__tests__/` | Test files | Most domains |

### IPC Lib Structure (`lib/ipc/`)

| Path | Purpose |
|------|---------|
| `client.ts` | `ipcClient` object aggregating all domain IPC modules |
| `commands.ts` | `IPC_COMMANDS` constant (~275 commands) |
| `utils.ts` | `safeInvoke<T>()` with session injection, timeout (15s), error mapping |
| `core/` | `extractAndValidate`, `ResponseHandlers`, types |
| `domains/` | Domain-specific typed IPC wrappers (e.g., `tasks.ts`, `settings.ts`) |
| `mock/` | Test adapters and fixtures |
| `types/` | IPC-specific type definitions |

## State Management

### 1. Server State — TanStack Query (v5)
**Mandatory for all backend data.**

```typescript
// Query Keys (frontend/src/lib/query-keys.ts)
export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  byId: (taskId: string) => [...taskKeys.all, taskId],
  history: (taskId: string) => [...taskKeys.all, taskId, 'history'],
  checklist: (taskId: string) => [...taskKeys.all, taskId, 'checklist'],
};

export const interventionKeys = {
  all: ['interventions'],
  byTask: (taskId: string) => [...interventionKeys.all, 'task', taskId],
  activeForTask: (taskId: string) => [...interventionKeys.all, 'active', taskId],
  ppfWorkflow: (taskId: string) => [...interventionKeys.all, 'ppf-workflow', taskId],
  photos: (interventionId: string) => [...interventionKeys.all, 'photos', interventionId],
};

// Query with mutation counter for cache invalidation
const tasksQuery = useQuery({
  queryKey: [...taskKeys.lists(), filters, mutationCounter],
  queryFn: async () => taskIpc.list(filters),
  enabled: !!user?.token,
});
```

### 2. UI State — Zustand
**For complex/global UI state only.**

Domains with Zustand stores: `notifications`, `calendar`.

### 3. Local State — `useState`
**For simple, component-local toggles.**

## IPC Communication

### Command Registry

All IPC command strings are centralized in `frontend/src/lib/ipc/commands.ts`:

```typescript
export const IPC_COMMANDS = {
  // Auth commands
  AUTH_LOGIN: 'auth_login',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_VALIDATE_SESSION: 'auth_validate_session',
  
  // Task commands (~40 commands)
  TASK_CREATE: 'task_create',
  TASK_GET: 'task_get',
  TASK_UPDATE: 'task_update',
  TASK_DELETE: 'task_delete',
  TASK_LIST: 'task_list',
  TASK_TRANSITION_STATUS: 'task_transition_status',
  // ... ~275 total commands
} as const;
```

### IPC Client Pattern (**ADR-013**)

**Never call `invoke` directly.** Use domain wrappers:

```typescript
// ✅ Correct
import { taskIpc } from '@/domains/tasks/ipc';
const result = await taskIpc.create(data);

// ❌ Incorrect
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('task_create', { ... });
```

### `ipcClient` Aggregation

```typescript
// frontend/src/lib/ipc/client.ts
export const ipcClient = {
  auth: authIpc,
  tasks: taskIpc,
  clients: clientIpc,
  interventions: interventionsIpc,
  photos: photosIpc,
  ppfWorkflow: ppfWorkflowIpc,
  material: materialIpc,
  inventory: inventoryIpc,
  quotes: quotesIpc,
  users: userIpc,
  settings: settingsIpc,
  notifications: notificationsIpc,
  bootstrap: bootstrapIpc,
  admin: adminIpc,
  audit: auditIpc,
  organization: organizationIpc,
  security: securityIpc,
  reports: reportsIpc,
  dashboard: dashboardIpc,
  entityCounts: entityCountsIpc,
  system: systemOperations,
  trash: trashIpc,
} as const;
```

### Core IPC Utilities

| File | Purpose |
|------|---------|
| `utils.ts` | `safeInvoke<T>()` with session injection, timeout (15s), error mapping |
| `core/response-handlers.ts` | `extractAndValidate`, response type guards |
| `cache.ts` | `cachedInvoke`, `invalidatePattern` for cache management |

### Public Commands (No Auth Required)

```typescript
// frontend/src/lib/ipc/utils.ts
export const PUBLIC_COMMANDS = new Set([
  'auth_login', 'auth_create_account', 'auth_validate_session', 'auth_logout',
  'has_admins', 'bootstrap_first_admin',
  'ui_window_minimize', 'ui_window_maximize', 'ui_window_close',
  'navigation_update', 'navigation_go_back', 'navigation_go_forward',
  'navigation_get_current', 'navigation_add_to_history',
  'shortcuts_register', 'ui_shell_open_url', 'ui_gps_get_current_position',
  'get_app_info',
]);
```

## Styling & UI

- **Tailwind CSS** for all styling.
- **shadcn/ui** for accessible, consistent components.
- Follow theme tokens in `tailwind.config.ts`.

## Routes (`frontend/src/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Calendar Dashboard (home) |
| `/login` | Authentication |
| `/signup` | Account creation |
| `/onboarding` | First-time setup |
| `/bootstrap-admin` | Initial admin setup |
| `/admin` | Admin panel (Admin only) |
| `/unauthorized` | Access denied |
| `/clients/`, `/clients/[id]/`, `/clients/new/`, `/clients/[id]/edit/` | Client management |
| `/dashboard/` | Dashboard |
| `/interventions/` | Interventions |
| `/inventory/` | Inventory |
| `/quotes/`, `/quotes/new/`, `/quotes/[id]/` | Quotes |
| `/schedule/` | Schedule |
| `/settings/` | Settings root |
| `/settings/profile/` | User profile |
| `/settings/preferences/` | User preferences |
| `/settings/security/` | Security settings |
| `/settings/organization/` | Organization settings |
| `/settings/system/` | System settings |
| `/settings/business/` | Business rules |
| `/settings/monitoring/` | Monitoring |
| `/settings/performance/` | Performance configs |
| `/settings/integrations/` | Integrations |
| `/settings/security-policies/` | Security policies |
| `/settings/observability/` | Observability |
| `/tasks/`, `/tasks/[id]/`, `/tasks/new/` | Tasks |
| `/tasks/[id]/workflow/ppf/` | PPF workflow |
| `/tasks/[id]/workflow/ppf/steps/[step]/` | PPF steps |
| `/tasks/[id]/workflow/ppf/steps/preparation/` | Preparation step |
| `/tasks/[id]/workflow/ppf/steps/installation/` | Installation step |
| `/tasks/[id]/workflow/ppf/steps/inspection/` | Inspection step |
| `/tasks/[id]/workflow/ppf/steps/finalization/` | Finalization step |
| `/tasks/[id]/completed/` | Completed task |
| `/trash/` | Trash (soft-deleted items) |
| `/users/` | User management |
| `/configuration/` | Configuration |
| `/staff/` | Staff management |

## Development Workflow

| When | Command |
|------|---------|
| Rust type change | `npm run types:sync` |
| New feature | Create folder in `domains/`, export via `index.ts` |
| Form validation | Use **Zod** schemas |
| Testing | Jest in `frontend/`, Playwright E2E |
| Pre-commit | `npm run frontend:guard` (lint + type-check + tests) |

## Constraints

- `"strict": true` and `"noUncheckedIndexedAccess": true` in `tsconfig.json`.
- Components must receive data as **props** (no fetching inside components).
- `useEffect` is for external sync only, not business logic.
- Generated types in `frontend/src/types/` — **never edit manually**.
- All IPC calls must go through `safeInvoke` or domain IPC wrappers.