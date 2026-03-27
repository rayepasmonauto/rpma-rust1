---
title: "Backend Guide"
summary: "Rust development standards, domain patterns, and system architecture."
read_when:
  - "Implementing new backend features"
  - "Writing Rust services or repositories"
  - "Adding new IPC commands"
---

# 04. BACKEND GUIDE

The backend is a Rust application hosted by Tauri in `src-tauri/`.

## Domain Layout

Most business domains live under `src-tauri/src/domains/*` and should keep business logic out of IPC handlers.

| Domain shape | Examples |
|---|---|
| Full four-layer domains | `auth`, `tasks`, `clients`, `interventions`, `inventory`, `quotes`, `trash`, `users` |
| Hybrid handler-based domains | `calendar`, `documents`, `notifications`, `settings` |

## Layer Rule

`IPC -> Application -> Domain -> Infrastructure`

- IPC handlers are thin entrypoints.
- Application code orchestrates use cases and permissions.
- Domain code holds business rules and invariants.
- Infrastructure code owns SQLite access and adapter details.

## Core Backend Files

| File | Purpose |
|---|---|
| `src-tauri/src/main.rs` | App bootstrap and command registration |
| `src-tauri/src/lib.rs` | Library entry point |
| `src-tauri/src/service_builder.rs` | Service composition |
| `src-tauri/src/shared/app_state.rs` | Shared app state |
| `src-tauri/src/shared/context/request_context.rs` | Authenticated request context |
| `src-tauri/src/shared/error/app_error.rs` | Backend error type |
| `src-tauri/src/shared/ipc/response.rs` | IPC response envelope |
| `src-tauri/src/db/*` | Database startup, WAL, and migration plumbing |

## Command Implementation Pattern

To add a backend command end-to-end:

1. Add or update request and response types in the domain model or IPC module.
2. Put business logic in the application/domain layer, not in the handler.
3. Add a thin `#[tauri::command]` handler in `src-tauri/src/domains/<domain>/ipc/*` or `src-tauri/src/commands/*`.
4. Register the command in `src-tauri/src/main.rs`.
5. Export any `#[derive(TS)]` types with `npm run types:sync`.
6. Add or update the frontend wrapper in `frontend/src/domains/<domain>/ipc/*`.

Example paths:

- Task flow: `src-tauri/src/domains/tasks/ipc/task/facade.rs`
- Client flow: `src-tauri/src/domains/clients/ipc/handlers.rs`
- Calendar flow: `src-tauri/src/domains/calendar/calendar_handler/ipc.rs`
- System commands: `src-tauri/src/commands/system.rs`

## Service Wiring

`src-tauri/src/service_builder.rs` is where shared services, repositories, and the in-memory event bus are composed. `src-tauri/src/shared/app_state.rs` stores the resulting app state.

The current codebase uses:

- `src-tauri/src/shared/event_bus/*` for local cross-domain coordination
- `src-tauri/src/shared/services/domain_event.rs` for event payloads
- `src-tauri/src/shared/services/global_search.rs` for search across domains

## Error Model

Use `AppError` for expected failures and keep sensitive details out of frontend responses.

| Type | Use |
|---|---|
| `Authentication` | Login and session problems |
| `Authorization` | Role or permission failures |
| `Validation` | Invalid input or state transitions |
| `NotFound` | Missing entity |
| `Database` | Sanitized storage failures |
| `Internal` | Sanitized unexpected failures |

`src-tauri/src/shared/ipc/response.rs` converts backend results into `ApiResponse<T>`.

## Logging And Correlation

- `correlation_id` is carried through IPC and request context.
- Use the shared logging and request-context helpers under `src-tauri/src/shared/*`.
- Keep logs free of passwords, session tokens, and raw PII.

## Repository Rule

- Data access belongs in infrastructure repositories.
- Do not query SQLite directly from application code.
- Do not put business logic in repositories.

## Intervention Domain Notes

The interventions domain has dedicated sub-services for workflow progression, step state, photos, scoring, and material consumption. Relevant paths include:

- `src-tauri/src/domains/interventions/infrastructure/*`
- `src-tauri/src/domains/interventions/domain/models/*`
- `src-tauri/src/domains/interventions/ipc/intervention/workflow.rs`
- `src-tauri/src/domains/interventions/ipc/intervention/queries.rs`

## DOC vs CODE Mismatch

- `auth_refresh_token` exists as a command surface in `src-tauri/src/commands/mod.rs`, but it currently returns a validation error and token refresh is not supported in the runtime build.
- Legacy onboarding notes may mention a richer sync service than the current app wiring exposes. Verify the runtime path before depending on sync behavior.

## Key Files

| File | Why it matters |
|---|---|
| `src-tauri/src/domains/*/ipc/*` | Thin command handlers |
| `src-tauri/src/domains/*/application/*` | Use-case orchestration |
| `src-tauri/src/domains/*/domain/*` | Business rules and entities |
| `src-tauri/src/domains/*/infrastructure/*` | SQLite repositories and adapters |
| `src-tauri/src/shared/event_bus/*` | Cross-domain coordination |
| `src-tauri/src/db/migrations/mod.rs` | Migration runner |
