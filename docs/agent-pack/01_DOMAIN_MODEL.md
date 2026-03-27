---
title: "Domain Model"
summary: "Core entities, relationships, statuses, invariants, and storage locations."
read_when:
  - "Designing new features"
  - "Understanding entity relationships"
  - "Modifying database schema"
---

# 01. DOMAIN MODEL

The backend is organized by bounded context under `src-tauri/src/domains/*`. Most business concepts map directly to a Rust domain model plus a SQLite table in `src-tauri/src/db/schema.sql` and incremental migrations in `src-tauri/migrations/*`.

## Main Entities

| Entity | Core shape | Storage to inspect |
|---|---|---|
| Task | Task request, scheduling, workflow, assignment, checklist, history | `tasks`, `task_history`, `task_checklist_items`, `task_drafts` |
| Client | Customer/company profile and task history | `clients`, `client_statistics` view |
| Intervention | PPF execution record linked to a task | `interventions`, `intervention_steps`, `intervention_reports` |
| Material | Inventory item, stock, supplier, category, consumption | `materials`, `material_consumptions`, `inventory_transactions`, `material_categories`, `suppliers` |
| Quote | Estimate with items and attachments | `quotes`, `quote_items`, `quote_attachments` |
| User | Account, role, profile, settings, session links | `users`, `sessions`, `user_settings`, `login_attempts` |
| CalendarEvent | Scheduling entry for tasks and technicians | `calendar_events` |
| Notification / Message | User alerts and message inbox | `notifications`, `messages`, message template/preference tables |
| Photo / Report | Intervention media and generated reports | `photos`, `intervention_reports` |
| Trash entry | Soft-deleted entity metadata | Source tables with `deleted_at`, plus trash queries |

## Statuses

### Tasks

Defined in `src-tauri/src/domains/tasks/domain/models/status.rs` and validated by the task state machine in `src-tauri/src/domains/tasks/domain/services/task_state_machine.rs`.

- `Draft`
- `Scheduled`
- `InProgress`
- `Completed`
- `Cancelled`
- `OnHold`
- `Pending`
- `Invalid`
- `Archived`
- `Failed`
- `Overdue`
- `Assigned`
- `Paused`

### Interventions

Defined in `src-tauri/src/domains/interventions/domain/models/intervention.rs`.

- `pending`
- `in_progress`
- `paused`
- `completed`
- `cancelled`

### Intervention Steps

Defined in `src-tauri/src/domains/interventions/domain/models/step.rs`.

- `pending`
- `in_progress`
- `paused`
- `completed`
- `failed`
- `skipped`
- `rework`

### Quotes

Defined in `src-tauri/src/domains/quotes/domain/models/quote.rs`.

- `draft`
- `sent`
- `accepted`
- `rejected`
- `expired`
- `converted`
- `changes_requested`

### Roles

Defined in `src-tauri/src/domains/auth/domain/models/auth.rs` and re-exported through `src-tauri/src/shared/contracts/auth.rs`.

- `Admin`
- `Supervisor`
- `Technician`
- `Viewer`

## Relationships

- A `Task` belongs to one `Client` when `client_id` is set.
- A `Task` can be assigned to one technician at a time.
- An `Intervention` is the execution record for a task; the UI mostly treats the current active intervention as the working copy.
- An `Intervention` contains ordered `InterventionStep` records.
- A `Quote` can be converted into a `Task`.
- A `Quote` can have many `QuoteItem` and `QuoteAttachment` rows.
- `MaterialConsumption` links a material to an intervention and optionally to a step.
- `CalendarEvent` links schedule data to tasks and technicians.
- `UserSession` is a UUID-backed session record; the current runtime stores sessions in memory and validates them at the IPC boundary.

## Domain Invariants

- IDs are UUID strings.
- Timestamps are stored as Unix milliseconds unless a model explicitly uses a date string for a date-only field.
- Soft delete is the default delete pattern for business entities that support trash/recovery.
- Task status transitions must pass the task state machine.
- Intervention finalization can only happen from a valid in-progress state.
- Quote status changes are explicit and should not be faked in UI state.
- Domain validation belongs in the domain/application layer, not in IPC handlers.

## Storage Patterns

| Pattern | Where to look |
|---|---|
| Soft delete | `deleted_at` columns in schema and migrations, plus repository filters |
| Audit fields | `created_at`, `updated_at`, and `*_by` fields on most entities |
| Session records | `sessions` plus the auth session store in `src-tauri/src/domains/auth/*` for the in-memory cache |
| Event history | `task_history`, `audit_events`, and domain events in `src-tauri/src/shared/services/domain_event.rs` |
| Queue-like persistence | `sync_queue` exists in schema; verify current runtime usage before depending on it |

## Cross-Domain Rules

- Cross-domain reads should use `src-tauri/src/shared/repositories/*` or shared services, not direct imports into another domain's internals.
- Event-driven reactions should use `src-tauri/src/shared/event_bus/*`.
- The event contract is defined in `src-tauri/src/shared/services/domain_event.rs`.

## DOC vs CODE Mismatch

- Some older onboarding text simplifies task and intervention lifecycles too much. The current models have more statuses and more audit fields than the old summary implies. Prefer the enum definitions in the files above when implementing UI or validation.
- `sync_queue` exists in schema, but the current runtime does not expose a clearly wired sync worker in app state. Treat it as a schema artifact until you verify a live code path.
