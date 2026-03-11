# RPMA v2 - Project Overview

> **RPMA** (Repair Management Application) — Desktop application for PPF (Paint Protection Film) intervention management by Raye Pas Mon Auto.
> 
> **Repository**: `D:\rpma-rust`  
> **Version**: 0.1.0  
> **License**: Proprietary

---

## What is RPMA v2?

RPMA v2 is an **offline-first desktop application** for automotive workshops specializing in PPF (Paint Protection Film) installation. It manages the full lifecycle of interventions from quote to completion.

### Primary Users
- **Admin**: Full system access, user management, settings
- **Supervisor**: Task assignment, oversight, reporting
- **Technician**: Task execution, intervention workflows
- **Viewer**: Read-only access to tasks and reports

### Offline-First Goals
- **Local SQLite** is the system of record
- Full functionality without internet connectivity
- Optional background sync when online
- Session management entirely local (no external auth providers)

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Desktop Runtime** | Tauri | 2.1.0 | Rust-based desktop framework |
| **Backend** | Rust | 1.85.0 | Business logic, IPC handlers |
| **Database** | SQLite | 3.x | WAL mode, local persistence |
| **Frontend** | Next.js | 14.2 | React framework (App Router) |
| **UI Library** | React | 18 | Component framework |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Components** | shadcn/ui | — | Base UI primitives |
| **State (Server)** | TanStack Query | — | Server state management |
| **State (Client)** | Zustand | — | UI state management |
| **Forms** | React Hook Form + Zod | — | Form handling & validation |
| **Types** | ts-rs | — | Rust → TypeScript type generation |

---

## Top-Level Modules (Domains)

### Backend Domains (`src-tauri/src/domains/`)

| Domain | Purpose | Key Tables |
|--------|---------|------------|
| `auth` | Authentication, sessions, password hashing | `sessions`, `users` |
| `users` | User CRUD, RBAC | `users` |
| `clients` | Customer management | `clients` |
| `tasks` | Task lifecycle, assignment | `tasks`, `task_history` |
| `interventions` | PPF workflow execution | `interventions`, `intervention_steps` |
| `calendar` | Scheduling, events | `calendar_events` |
| `inventory` | Material tracking, stock | `materials`, `inventory_transactions` |
| `quotes` | Quote generation, PDF export | `quotes`, `quote_items` |
| `documents` | Photo storage, reports | `photos` |
| `reports` | Report generation | `reports` |
| `settings` | App & user settings | `app_settings`, `user_settings` |
| `organizations` | Multi-tenant org support | `organizations` |
| `notifications` | In-app & external notifications | `notifications`, `messages` |
| `sync` | Background sync queue | `sync_queue` |
| `audit` | Security auditing | `audit_logs` |

### Frontend Domains (`frontend/src/domains/`)

| Domain | Mirrors Backend | Key Components |
|--------|----------------|----------------|
| `auth` | ✅ | Login forms, session management |
| `users` | ✅ | User management UI |
| `clients` | ✅ | Client lists, detail views |
| `tasks` | ✅ | Task boards, forms, assignment |
| `interventions` | ✅ | Workflow UI, step progression |
| `calendar` | ✅ | Calendar views, scheduling |
| `inventory` | ✅ | Stock management, transactions |
| `quotes` | ✅ | Quote builder, PDF preview |
| `documents` | ✅ | Photo gallery, upload |
| `reports` | ✅ | Report dashboards |
| `settings` | ✅ | Settings forms |
| `organizations` | ✅ | Org setup, onboarding |
| `notifications` | ✅ | Notification center |
| `sync` | ✅ | Sync status UI |
| `dashboard` | — | Analytics, overview |
| `bootstrap` | — | First-time setup wizard |
| `admin` | — | System admin tools |
| `audit` | — | Security monitoring UI |

---

## Entry Points

### Backend

| File | Line | Purpose |
|------|------|---------|
| `src-tauri/src/main.rs` | 56-453 | Tauri bootstrap, command registration |
| `src-tauri/src/lib.rs` | — | Library exports |
| `src-tauri/src/bin/export-types.rs` | — | TypeScript type generation binary |
| `src-tauri/src/db/mod.rs` | — | Database pool, transactions |
| `src-tauri/src/service_builder.rs` | — | Dependency injection container |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/app/layout.tsx` | Next.js root layout (Server Component) |
| `frontend/src/app/RootClientLayout` | Client providers wrapper |
| `frontend/src/app/page.tsx` | Main landing/dashboard page |
| `frontend/src/lib/ipc/client.ts` | Central IPC client (1475+ lines) |
| `frontend/src/lib/ipc/utils.ts` | `safeInvoke()` foundation |

---

## Golden Paths (Read These First)

For new features or debugging, follow these paths:

### 1. Adding a New Domain Feature
1. **Backend**: `src-tauri/src/domains/<domain>/`
   - `domain/models/` — Define entities, enums
   - `application/` — Use case orchestration
   - `infrastructure/` — Repository, SQL
   - `ipc/` — Command handlers
2. **Types**: Run `npm run types:sync`
3. **Frontend**: `frontend/src/domains/<domain>/`
   - `ipc/` — Type-safe wrappers
   - `api/` — React Query hooks
   - `components/` — Domain UI

### 2. Understanding Data Flow
See: [02_ARCHITECTURE_AND_DATAFLOWS.md](./02_ARCHITECTURE_AND_DATAFLOWS.md)

### 3. IPC Command Reference
See: [05_IPC_API_AND_CONTRACTS.md](./05_IPC_API_AND_CONTRACTS.md)

### 4. Security & Permissions
See: [06_SECURITY_AND_RBAC.md](./06_SECURITY_AND_RBAC.md)

### 5. Database Schema
See: [07_DATABASE_AND_MIGRATIONS.md](./07_DATABASE_AND_MIGRATIONS.md)

---

## Repository Structure (High-Level)

```
rpma-rust/
├── docs/
│   ├── agent-pack/          ← You are here (10 files)
│   └── adr/                 ← 25 Architecture Decision Records
├── frontend/                ← Next.js 14 app
│   ├── src/
│   │   ├── app/             ← Routes, pages
│   │   ├── components/ui/   ← shadcn/ui primitives
│   │   ├── domains/         ← Feature domains (mirror backend)
│   │   ├── lib/ipc/         ← IPC client, utilities
│   │   └── types/           ← AUTO-GENERATED (Rust → TS)
│   ├── package.json
│   └── ...
├── src-tauri/               ← Rust backend
│   ├── src/
│   │   ├── commands/        ← System-level commands
│   │   ├── db/              ← DB connection, migrations
│   │   ├── domains/         ← Business domains (DDD)
│   │   ├── infrastructure/  ← Cross-cutting infra
│   │   ├── shared/          ← Errors, auth, events
│   │   ├── main.rs          ← Entry point
│   │   └── bin/             ← Type export binary
│   ├── migrations/          ← 56 SQL migration files
│   └── Cargo.toml
├── scripts/                 ← Build, validation, audit scripts
└── package.json             ← Root npm scripts
```

---

## Next Steps

1. **New to the codebase?** Start with [01_DOMAIN_MODEL.md](./01_DOMAIN_MODEL.md) to understand entities.
2. **Implementing a feature?** See [04_BACKEND_GUIDE.md](./04_BACKEND_GUIDE.md) for patterns.
3. **Frontend work?** See [03_FRONTEND_GUIDE.md](./03_FRONTEND_GUIDE.md) for IPC patterns.
4. **Debugging?** Check [08_DEV_WORKFLOWS_AND_TOOLING.md](./08_DEV_WORKFLOWS_AND_TOOLING.md) for commands.

---

## Key Constraints (Non-Negotiable)

1. **Offline-first**: All features must work without internet
2. **Domain isolation**: No cross-domain imports
3. **Layer boundaries**: IPC → Application → Domain → Infrastructure
4. **Type safety**: Rust owns the contract; TS types auto-generated
5. **RBAC**: Every protected command must check permissions
6. **Testing**: Success, validation failure, and auth failure coverage required

---

## Documentation Cross-Reference

| Doc | Purpose |
|-----|---------|
| [01_DOMAIN_MODEL.md](./01_DOMAIN_MODEL.md) | Entities, relationships, enums |
| [02_ARCHITECTURE_AND_DATAFLOWS.md](./02_ARCHITECTURE_AND_DATAFLOWS.md) | Layer diagram, data flows |
| [03_FRONTEND_GUIDE.md](./03_FRONTEND_GUIDE.md) | Frontend patterns, IPC usage |
| [04_BACKEND_GUIDE.md](./04_BACKEND_GUIDE.md) | Backend patterns, DDD layers |
| [05_IPC_API_AND_CONTRACTS.md](./05_IPC_API_AND_CONTRACTS.md) | Top 30 commands, type sync |
| [06_SECURITY_AND_RBAC.md](./06_SECURITY_AND_RBAC.md) | Auth flow, role matrix |
| [07_DATABASE_AND_MIGRATIONS.md](./07_DATABASE_AND_MIGRATIONS.md) | SQLite setup, migrations |
| [08_DEV_WORKFLOWS_AND_TOOLING.md](./08_DEV_WORKFLOWS_AND_TOOLING.md) | Scripts, quality gates |
| [09_USER_FLOWS_AND_UX.md](./09_USER_FLOWS_AND_UX.md) | User flows, UI patterns |

---

*Generated from repository scan on 2025-01-XX. See docs/adr/ for detailed architectural decisions.*
