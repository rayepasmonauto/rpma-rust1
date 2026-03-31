# 02. ARCHITECTURE AND DATAFLOWS

## 4-Layer Architecture Pattern
The backend is structured strictly following a four-layer architecture per bounded context (Domain-Driven Design).
See [ADR-001](../adr/001-four-layer-architecture.md) and `GEMINI.md`.

1. **Frontend (Next.js)**: Responsible for UI, state (Zustand), and server-caching (TanStack Query).
2. **IPC Boundary (Tauri)**: Thin wrappers (`src-tauri/src/domains/*/ipc/`) passing data via `#[tauri::command]`.
3. **Application Layer**: Use cases and orchestration logic (`src-tauri/src/domains/*/application/`). Enforces Auth via `RequestContext`.
4. **Domain Layer**: Core business models, rules, and invariants.
5. **Infrastructure Layer**: Repositories for data access (`SQLite WAL mode`) and external integrations.

## Data Flows

### 1. Task Creation Flow
```text
Frontend Component -> TanStack Mutation -> IPC Wrapper (frontend/src/lib/ipc/)
  -> Tauri Command (src-tauri/src/domains/tasks/ipc/)
    -> Auth Check (RequestContext)
      -> TaskApplicationService (src-tauri/src/domains/tasks/application/)
        -> TaskDomainModel Creation (src-tauri/src/domains/tasks/domain/)
          -> TaskRepository (src-tauri/src/domains/tasks/infrastructure/)
            -> SQLite Insert
  -> Returns ApiResponse<Task> to Frontend -> Cache Invalidation
```

### 2. Intervention Workflow
```text
Technician UI (Advance Step) -> IPC (advance_intervention_step)
  -> Application Service validates step logic
    -> Domain Model updates step status / timestamps
      -> EventBus emits "InterventionStepAdvanced" (ADR-016)
        -> Repository persists status
          -> UI Polls or receives Event via WebSockets/Tauri Events to update view
```

### 3. Calendar Scheduling
```text
Calendar UI -> IPC (reschedule_task)
  -> Task Application Service
    -> Domain Logic (Check overlapping / Supervisor Role check)
      -> Transaction boundary -> Update SQLite DB
```

## Offline-First & Sync
- **Database**: `SQLite` in WAL mode (ADR-009) ensures atomic local writes without relying on a remote server.
- **Event Bus**: In-Memory Event Bus (ADR-016) at `src-tauri/src/shared/event_bus/` decouples logic (e.g., triggering audit logs when a task completes).
- **Sync Queue**: TODO (verify in code - sync queue mechanism to remote server, if implemented).