---
title: "Frontend Guide"
summary: "Architecture, patterns, and standards for the Next.js frontend."
read_when:
  - "Adding new frontend features"
  - "Modifying UI components"
  - "Working with TanStack Query or Zustand"
---

# 03. FRONTEND GUIDE

The frontend is a Next.js 14 App Router app in `frontend/` with strict TypeScript, TanStack Query, and shadcn/ui.

## App Structure

| Path | Purpose |
|---|---|
| `frontend/src/app/layout.tsx` | Root HTML shell |
| `frontend/src/app/RootClientLayout.tsx` | Client-side app wiring |
| `frontend/src/app/providers.tsx` | Query, auth, theme, and error providers |
| `frontend/src/app/page.tsx` | Home route, currently the calendar dashboard |
| `frontend/src/app/*` | Route segments and pages |
| `frontend/src/domains/*` | Feature modules mirrored from backend domains |
| `frontend/src/components/*` | Shared UI components |
| `frontend/src/lib/ipc/*` | Typed IPC helpers and command registry |
| `frontend/src/lib/query-keys.ts` | Query key factories |
| `frontend/src/lib/backend.ts` | Generated Rust -> TS types |

Common routes in the current app include `login`, `signup`, `bootstrap-admin`, `clients`, `dashboard`, `inventory`, `quotes`, `schedule`, `settings`, `staff`, `tasks`, `trash`, `unauthorized`, and `users`.

## Feature Module Pattern

Most domains follow this shape:

| Folder | Purpose |
|---|---|
| `api/` | TanStack Query hooks and query key usage |
| `components/` | Domain UI |
| `hooks/` | Domain React hooks |
| `ipc/` | Typed IPC wrappers |
| `stores/` | Zustand stores when needed |

## State Management

- Use TanStack Query for all backend/server state.
- Use Zustand only for shared UI state such as notifications or calendar view state.
- Use local React state for small component-only toggles.
- Use `react-hook-form` plus Zod for forms.

## IPC Pattern

- Never call `invoke()` directly from UI code.
- Call `safeInvoke()` in `frontend/src/lib/ipc/utils.ts` or a domain IPC wrapper.
- Command strings come from `frontend/src/lib/ipc/commands.ts`.
- `safeInvoke()` injects the current session for protected commands, adds `correlation_id`, and normalizes IPC errors.
- Public commands are listed in `PUBLIC_COMMANDS` in `frontend/src/lib/ipc/utils.ts`.

```ts
// Good
import { taskIpc } from "@/domains/tasks/ipc/task.ipc";
const task = await taskIpc.get(id);

// Avoid
import { invoke } from "@tauri-apps/api/core";
```

## Query Key Pattern

Query keys live in `frontend/src/lib/query-keys.ts` and should be reused across hooks and mutation invalidation.

```ts
export const taskKeys = {
  all: ["tasks"],
  lists: () => [...taskKeys.all, "list"],
  byId: (taskId: string) => [...taskKeys.all, taskId],
};
```

## Root Providers

`frontend/src/app/providers.tsx` and `frontend/src/app/RootClientLayout.tsx` wire the app together:

- TanStack Query
- auth state and redirects
- theme handling
- global error handling
- notification bootstrap and panel UI
- navigation and Tauri event hooks

## Validation and Forms

- Form validation belongs in Zod schemas.
- Keep validation close to the feature module, not inside IPC handlers.
- Prefer explicit client-side validation before invoking backend commands.

## Pitfalls

- `frontend/src/lib/backend.ts` is generated; do not edit it by hand.
- Keep IPC command names in sync with Rust handlers.
- If you change a `#[derive(TS)]` type or an IPC-facing model, run `npm run types:sync`.
- Large payloads should stay out of IPC when possible; prefer IDs, metadata, and dedicated photo/document commands.
- If a command is public in `safeInvoke()` but private in Rust, fix the mismatch instead of working around it.

## Where To Add A Feature

| Change | Start here |
|---|---|
| New page or route | `frontend/src/app/*` |
| New feature UI | `frontend/src/domains/<domain>/*` |
| New query hook | `frontend/src/domains/<domain>/api/*` |
| New IPC wrapper | `frontend/src/domains/<domain>/ipc/*` |
| New shared UI primitive | `frontend/src/components/*` |
| Shared query key | `frontend/src/lib/query-keys.ts` |

## Key References

| File | Why it matters |
|---|---|
| `frontend/src/lib/ipc/utils.ts` | `safeInvoke()` and public command list |
| `frontend/src/lib/ipc/commands.ts` | Central command strings |
| `frontend/src/lib/ipc/client.ts` | Aggregated IPC client |
| `frontend/src/lib/query-keys.ts` | Query key factories |
| `frontend/src/app/providers.tsx` | App-wide providers |
| `frontend/src/app/RootClientLayout.tsx` | App shell and auth gating |
