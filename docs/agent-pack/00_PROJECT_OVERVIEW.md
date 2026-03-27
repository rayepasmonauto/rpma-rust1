---
title: "Project Overview"
summary: "RPMA v2 mission, stack, boundaries, and the fastest paths into the codebase."
read_when:
  - "Onboarding to the project"
  - "Understanding the high-level architecture"
  - "Finding the right module for a change"
---

# 00. PROJECT OVERVIEW

RPMA v2 is an offline-first desktop app for planning, executing, and auditing PPF field interventions. The app ships as a Tauri desktop client with a Rust backend and a Next.js frontend, and the local SQLite database is the source of truth on each machine.

## What Lives Where

| Layer | Main paths |
|---|---|
| Desktop shell | `src-tauri/src/main.rs`, `src-tauri/src/lib.rs` |
| Backend domains | `src-tauri/src/domains/*` |
| Shared backend kernel | `src-tauri/src/shared/*` |
| Database | `src-tauri/src/db/*`, `src-tauri/migrations/*`, `src-tauri/src/db/schema.sql` |
| Frontend routes | `frontend/src/app/*` |
| Frontend feature domains | `frontend/src/domains/*` |
| IPC wrappers | `frontend/src/lib/ipc/*`, `frontend/src/domains/*/ipc/*` |
| Generated TS contracts | `frontend/src/lib/backend.ts` |

## Tech Stack

| Area | Stack |
|---|---|
| Desktop shell | Tauri 2.1 |
| Backend | Rust 2021 |
| Frontend | Next.js 14, React 18, TypeScript 5 |
| Server state | TanStack Query 5 |
| Local UI state | Zustand |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Persistence | SQLite in WAL mode |
| Rust -> TS types | ts-rs |

## Boundaries

- The local SQLite database under the app data directory is the source of truth.
- `RequestContext` and `ApiResponse` define the IPC contract.
- Frontend components should use feature wrappers, not raw `invoke()`.
- Business logic belongs in Rust domain/application layers, not in IPC handlers.
- Generated frontend types now land in `frontend/src/lib/backend.ts` via `scripts/write-types.js`.

## Core Backend Modules

| Module | Purpose |
|---|---|
| `src-tauri/src/commands/` | Cross-domain commands such as system, navigation, and window actions |
| `src-tauri/src/domains/auth/` | Login, session, RBAC, and audit security |
| `src-tauri/src/domains/tasks/` | Task lifecycle, drafts, history, checklist, and status transitions |
| `src-tauri/src/domains/interventions/` | PPF workflow, steps, photos, and finalization |
| `src-tauri/src/domains/clients/` | Client CRUD and task lookup |
| `src-tauri/src/domains/inventory/` | Materials, stock, suppliers, and consumption |
| `src-tauri/src/domains/quotes/` | Quote lifecycle and quote -> task conversion |
| `src-tauri/src/domains/settings/` | App settings, onboarding, organization, and user preferences |
| `src-tauri/src/domains/documents/` | Photos and report generation |
| `src-tauri/src/domains/notifications/` | Notifications and messaging |
| `src-tauri/src/domains/trash/` | Soft-delete recovery and hard delete |
| `src-tauri/src/shared/event_bus/` | In-memory domain event bus |

## Frontend Shell

The root client layout is `frontend/src/app/RootClientLayout.tsx`. It wires:

- `frontend/src/app/providers.tsx`
- `AuthProvider`
- `NotificationInitializer` and `NotificationPanel`
- TanStack Query
- `ThemeProvider`
- `GlobalErrorBoundary`
- `AppNavigation`

The home route is `frontend/src/app/page.tsx`, which renders the calendar dashboard.

## Golden Paths

1. [Domain Model](./01_DOMAIN_MODEL.md)
2. [Architecture and Dataflows](./02_ARCHITECTURE_AND_DATAFLOWS.md)
3. [Frontend Guide](./03_FRONTEND_GUIDE.md)
4. [Backend Guide](./04_BACKEND_GUIDE.md)
5. [IPC API and Contracts](./05_IPC_API_AND_CONTRACTS.md)
6. [Security and RBAC](./06_SECURITY_AND_RBAC.md)
7. [Database and Migrations](./07_DATABASE_AND_MIGRATIONS.md)
8. [Development Workflows and Tooling](./08_DEV_WORKFLOWS_AND_TOOLING.md)
9. [User Flows and UX](./09_USER_FLOWS_AND_UX.md)

## DOC vs CODE Mismatch

- Legacy onboarding text may describe a live sync worker and 2FA as if they are part of the current runtime. The schema still contains some legacy sync and 2FA fields, but the current app wiring uses local SQLite, UUID sessions, and an in-memory event bus. Verify current behavior before building on those legacy fields.
- `frontend/src/lib/backend.ts` is the actual type-sync output target; `frontend/src/types/` is not the current generated contract destination.

## Repo Shape

```text
rpma-rust/
+-- docs/
|   +-- agent-pack/
+-- frontend/
|   +-- src/
|       +-- app/
|       +-- domains/
|       +-- lib/
|       +-- types/
+-- scripts/
+-- src-tauri/
    +-- migrations/
    +-- src/
        +-- commands/
        +-- db/
        +-- domains/
        +-- shared/
```
