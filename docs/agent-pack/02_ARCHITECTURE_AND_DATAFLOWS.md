# 02. ARCHITECTURE AND DATAFLOWS

RPMA v2 follows a strict four-layer architecture as defined in **ADR-001**.

## Layered Architecture (Backend)
1. **IPC Layer**: Thin command handlers in `src-tauri/src/domains/*/ipc/`. Handles request/response serialization and authentication.
2. **Application Layer**: Orchestration and use cases in `src-tauri/src/domains/*/application/`. Validates business rules and coordinates services.
3. **Domain Layer**: Pure business logic and entities in `src-tauri/src/domains/*/domain/`. No dependencies on other layers.
4. **Infrastructure Layer**: Data access (Repositories) and external integrations in `src-tauri/src/domains/*/infrastructure/`.

## Data Flow: Task Creation
1. **Frontend**: User fills out a form in `TaskForm.tsx`.
2. **Frontend IPC**: `taskIpc.create(data)` is called, which invokes the `task_crud` Tauri command.
3. **Backend IPC**: `domains::tasks::ipc::task::task_crud` receives the request and calls `resolve_context!`.
4. **Backend Application**: `TaskService::create_task` validates the request and calls the repository.
5. **Backend Infrastructure**: `TaskRepository::insert` executes SQL against SQLite.
6. **Backend Event Bus**: A `TaskCreated` event is published to the `EventBus` (ADR-016).
7. **Frontend Response**: The IPC response returns the new `Task` object; React Query invalidates the `tasks` cache.

## Intervention Workflow Data Flow
1. **Start**: `intervention_start` command creates an `Intervention` record linked to a `Task`.
2. **Progress**: Technician advances through steps via `intervention_advance_step`.
3. **Consumption**: Inventory levels are decremented via `material_record_consumption` as work is performed.
4. **Finalization**: `intervention_finalize` marks the task as completed and generates a PDF report.

## Offline-First & Event Bus
- **In-Memory Event Bus**: Used for cross-domain communication within the Rust backend (ADR-016).
- **Local SQLite**: The source of truth is always the local database. Sync mechanisms (if present) are handled as background services.
- **Correlation IDs**: Every request carries a `correlation_id` (ADR-020) for end-to-end tracing from frontend logs to backend database operations.
