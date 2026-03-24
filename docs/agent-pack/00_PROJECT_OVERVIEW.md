---
title: "Project Overview"
summary: "High-level introduction to RPMA v2, its mission, tech stack, and core domains."
read_when:
  - "Onboarding to the project"
  - "Understanding the high-level architecture"
  - "Identifying core business domains"
---

# 00. PROJECT OVERVIEW

RPMA v2 (Resource Planning & Management Application) is a high-performance desktop application built with **Tauri**, **Rust**, and **Next.js**. It is specifically designed for managing field service interventions, particularly in the **PPF (Paint Protection Film)** industry.

## Core Mission

To provide a reliable, offline-first (via local SQLite) platform for technicians to manage tasks, track inventory, and document interventions while giving administrators full visibility into operations.

## Tech Stack

| Layer | Technology | Version/Mode |
|-------|------------|---------------|
| Desktop shell | Tauri | `2.1` |
| Backend language | Rust | Edition `2021`, rust-version `1.85` |
| Frontend framework | Next.js | `^14.2.35` (App Router) |
| UI runtime | React | `^18.3.1` |
| Frontend language | TypeScript | `^5.3.0` (strict mode) |
| Database | SQLite | WAL mode (ADR-009) |
| Server state | TanStack Query | `^5.90.2` |
| UI local state | Zustand | `^5.0.8` |
| Styling | Tailwind CSS | `^3.4.0` + shadcn/ui |
| Type generation | ts-rs | `10.1` (Rust → TS) |

## Top-Level Modules (Domains)

### Backend Domains (`src-tauri/src/domains/`)

| Domain | Purpose | Layer Compliance |
|--------|---------|-------------------|
| **auth** | Authentication, login, session management | Full 4-layer |
| **tasks** | Job lifecycle from creation to completion | Full 4-layer |
| **clients** | Client profiles and history | Full 4-layer |
| **interventions** | Core workflow engine for PPF execution | Full 4-layer + sub-services |
| **inventory** | Material tracking and stock management | Full 4-layer |
| **quotes** | Estimating and converting to tasks | Full 4-layer |
| **users** | User management and profiles | Full 4-layer |
| **calendar** | Scheduling and resource visualization | Flat (handler-based) |
| **documents** | Photo storage and report generation | Flat |
| **notifications** | System and user alerts | Flat (handler-based) |
| **settings** | Application and user settings | Flat |
| **trash** | Soft-deleted entity recovery | Full 4-layer |

### Frontend Domains (`frontend/src/domains/`)

Mirrors backend domains plus: **admin**, **bootstrap**, **dashboard**, **performance**, **reports**, **staff**.

## AppState Services

The application state (`AppStateType`) includes:

| Service | Purpose |
|---------|---------|
| `db` / `async_db` | Synchronous and async database access |
| `repositories` | Cached repository instances |
| `task_service` | Task lifecycle management |
| `client_service` | Client CRUD and events |
| `intervention_service` | Intervention workflow coordination |
| `intervention_creator` | Intervention creation interface (trait) |
| `material_service` | Material/inventory management |
| `inventory_service` | Inventory facade |
| `quote_service` | Quote lifecycle |
| `auth_service` | Authentication and sessions |
| `session_service` | Session management backend |
| `session_store` | In-memory session cache |
| `user_service` | User management |
| `message_service` | Messaging system |
| `photo_service` | Photo storage |
| `settings_repository` | Settings persistence |
| `user_settings_repository` | User preferences |
| `settings_service` | Settings coordination |
| `calendar_service` | Calendar/scheduling |
| `task_import_service` | Bulk task import |
| `cache_service` | In-memory cache |
| `event_bus` | In-memory domain events |
| `trash_service` | Soft-delete recovery |
| `global_search_service` | Cross-domain search |
| `audit_service` | Security audit logging |
| `app_config` | Application configuration |

## Golden Paths (Start Here)

1. [Domain Model](./01_DOMAIN_MODEL.md) — Understand the entities and their relationships.
2. [Architecture](./02_ARCHITECTURE_AND_DATAFLOWS.md) — How data moves from React to Rust to SQLite.
3. [IPC API](./05_IPC_API_AND_CONTRACTS.md) — The contract between the two worlds.
4. [Backend Guide](./04_BACKEND_GUIDE.md) — Backend development patterns.

## Repository Layout

```
rpma-rust/
├── README.md                          # Project overview
├── Makefile                           # Canonical backend build/test/lint commands
├── package.json                       # Root task runner (frontend/backend/types scripts)
├── Cargo.toml                         # Workspace manifest
├── docs/                              # Architecture + ADR documentation
│   ├── README.md                      # Generated docs index
│   └── adr/                           # Formal Architecture Decision Records (001-020)
├── scripts/                           # Validation, type sync, scaffolding utilities
├── frontend/                          # Next.js 14 frontend app
│   ├── package.json                   # Frontend toolchain/test scripts
│   └── src/
│       ├── app/                       # App Router pages/layouts
│       ├── components/               # Shared UI components (shadcn/ui)
│       ├── domains/                   # Frontend bounded contexts/features
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── bootstrap/
│       │   ├── calendar/
│       │   ├── clients/
│       │   ├── dashboard/
│       │   ├── interventions/
│       │   ├── inventory/
│       │   ├── notifications/
│       │   ├── performance/
│       │   ├── quotes/
│       │   ├── reports/
│       │   ├── settings/
│       │   ├── staff/
│       │   ├── tasks/
│       │   ├── trash/
│       │   └── users/
│       ├── lib/
│       │   ├── ipc/                   # IPC client, adapters, utilities
│       │   │   ├── client.ts           # ipcClient aggregation object
│       │   │   ├── commands.ts          # IPC_COMMANDS constant (~275 commands)
│       │   │   ├── utils.ts             # safeInvoke with session injection
│       │   │   ├── core/                # Response handlers, types
│       │   │   ├── domains/             # Domain-specific IPC wrappers
│       │   │   ├── mock/                # Test adapters and fixtures
│       │   │   └── types/               # IPC-related type definitions
│       │   └── query-keys.ts           # Centralized TanStack query key factories
│       ├── shared/                     # Shared frontend contracts/utilities
│       └── types/                      # AUTO-GENERATED TS types (never hand edit)
└── src-tauri/                         # Rust backend + Tauri app host
    ├── Cargo.toml                      # Backend dependencies
    ├── migrations/                     # Numbered SQL migrations (002-063)
    └── src/
        ├── main.rs                     # Tauri app bootstrap, command registration
        ├── lib.rs                      # Library entry point
        ├── service_builder.rs           # Centralized service initialization (ADR-004)
        ├── commands/                    # Cross-domain/system command modules
        ├── db/                          # DB bootstrap, WAL, migrations
        ├── domains/                     # Backend bounded contexts
        │   ├── auth/
        │   ├── calendar/
        │   ├── clients/
        │   ├── documents/
        │   ├── interventions/
        │   ├── inventory/
        │   ├── notifications/
        │   ├── quotes/
        │   ├── settings/
        │   ├── tasks/
        │   ├── trash/
        │   └── users/
        ├── shared/                      # Cross-domain shared kernel
        │   ├── context/                  # RequestContext + AuthContext
        │   ├── contracts/                # Shared enums (UserRole, TaskStatus, etc.)
        │   ├── db/                       # Shared DB-level contracts/helpers
        │   ├── error/                     # Shared error types
        │   ├── event_bus/                 # In-memory event bus primitives
        │   ├── ipc/                       # IPC boundary result/error adapters
        │   ├── logging/                   # Tracing + correlation ID
        │   ├── policies/                  # Shared policy definitions
        │   ├── repositories/              # Repository abstractions + factory
        │   ├── services/                  # Cross-domain services (EventBus, Validation)
        │   └── utils/                    # Shared backend utilities
        └── infrastructure/               # Cross-cutting infrastructure (auth session store)
```

## Key ADRs

| ADR | Title |
|-----|-------|
| ADR-001 | Four-Layer Architecture Pattern |
| ADR-002 | Bounded Context Domains |
| ADR-003 | Cross-Domain Communication Channels |
| ADR-004 | Centralized Service Builder Pattern |
| ADR-005 | Repository Pattern for Data Access |
| ADR-006 | RequestContext Pattern for Authentication |
| ADR-007 | Role-Based Access Control Hierarchy |
| ADR-008 | Centralized Validation Service |
| ADR-009 | SQLite with WAL Mode for Persistence |
| ADR-010 | Numbered SQL Migrations with Rust Data Migrations |
| ADR-011 | Soft Delete Pattern |
| ADR-012 | Timestamp as Milliseconds |
| ADR-013 | IPC Wrapper Pattern for Frontend |
| ADR-014 | TanStack Query for Server State |
| ADR-015 | Type Generation via ts-rs |
| ADR-016 | In-Memory Event Bus for Decoupled Coordination |
| ADR-017 | Domain Event Types and Factory Pattern |
| ADR-018 | Tauri Command Handlers (Thin IPC Layer) |
| ADR-019 | Error Handling at Boundary with thiserror and anyhow |
| ADR-020 | Correlation IDs for Distributed Tracing |