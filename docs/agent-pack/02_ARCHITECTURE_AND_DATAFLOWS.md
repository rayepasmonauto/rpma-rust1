---
title: "Architecture and Dataflows"
summary: "Detailed explanation of the four-layer architecture and how data moves through the system."
read_when:
  - "Implementing new IPC commands"
  - "Tracing data from frontend to backend"
  - "Understanding layer boundaries"
---

# 02. ARCHITECTURE AND DATAFLOWS

RPMA v2 follows a strict four-layer architecture (**ADR-001**) to ensure separation of concerns and testability.

## Layered Architecture (Backend)

Each domain in `src-tauri/src/domains/` follows this structure:

### 1. IPC Layer (`ipc/`)
- **Entry points** for Tauri commands with `#[tauri::command]`.
- **Thin handlers** — must call `resolve_context!` first (**ADR-006**, **ADR-018**).
- **Delegates** to Application layer; never contains business logic.
- **Location**: `domains/*/ipc/`

```rust
#[tauri::command]
pub async fn task_crud(
    state: AppState<'_>,
    request: TaskCrudRequest,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Task>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);  // Auth + RBAC
    let service = state.task_service.clone();
    service.handle_crud(request, ctx).await
}
```

### 2. Application Layer (`application/`)
- **Orchestration** and use cases.
- **RBAC enforcement** via `RequestContext`.
- **Coordinates** services and repositories.
- **Location**: `domains/*/application/`

### 3. Domain Layer (`domain/`)
- **Pure business logic**, entities, value objects.
- **Zero dependencies** on other layers or frameworks.
- **Implementation** of domain-specific validation.
- **Location**: `domains/*/domain/`

### 4. Infrastructure Layer (`infrastructure/`)
- **Repository implementations** (**ADR-005**).
- **SQL queries** using SQLite via `rusqlite`.
- **Location**: `domains/*/infrastructure/`

## Layer Compliance Matrix

| Domain | IPC | Application | Domain | Infrastructure | Notes |
|--------|:---:|:-----------:|:------:|:--------------:|-------|
| auth | ✓ | ✓ | ✓ | ✓ | Full compliance |
| tasks | ✓ | ✓ | ✓ | ✓ | Full compliance |
| clients | ✓ | ✓ | ✓ | ✓ | Full compliance |
| interventions | ✓ | ✓ | ✓ | ✓ | Full + sub-services |
| inventory | ✓ | ✓ | ✓ | ✓ | Full compliance |
| quotes | ✓ | ✓ | ✓ | ✓ | Full compliance |
| trash | ✓ | ✓ | ✓ | ✓ | Full compliance |
| users | ✓ | ✓ | ✓ | ✓ | Full compliance |
| calendar | ✓ | — | — | — | Handler-based |
| documents | ✓ | — | — | — | Flat structure |
| notifications | ✓ | — | — | — | Handler-based |
| settings | ✓ | — | — | — | Flat structure |

## Service Builder Pattern (**ADR-004**)

All services are wired centrally in `src-tauri/src/service_builder.rs`:

```rust
pub fn build(self) -> Result<AppStateType, Box<dyn std::error::Error>> {
    // 1. Core services (no dependencies or only DB)
    let task_service = Arc::new(TaskService::new(self.db.clone()));
    let event_bus = Arc::new(InMemoryEventBus::new());
    
    // 2. Domain services (in dependency order)
    let client_service = Arc::new(ClientService::new(
        self.repositories.client.clone(),
        event_bus.clone(),
    ));
    
    // 3. Intervention sub-services
    let intervention_step_service = Arc::new(InterventionStepService::new(db.clone()));
    let photo_validation_service = Arc::new(PhotoValidationService::new(db.clone()));
    let intervention_scoring_service = Arc::new(InterventionScoringService::new(db.clone()));
    let material_consumption_service = Arc::new(MaterialConsumptionService::new(db.clone()));
    
    // 4. Composite services
    let intervention_service = Arc::new(InterventionService::with_services(
        db.clone(),
        intervention_step_service,
        photo_validation_service,
        intervention_scoring_service,
        material_consumption_service,
    ));
    
    // 5. Register event handlers
    event_bus.register_handler(audit_log_handler);
    register_handler(inventory_service.intervention_finalized_handler());
    
    Ok(AppStateType { /* ... */ })
}
```

## Facade Pattern

Domains expose a simplified public API via a Facade:

```rust
// domains/tasks/facade.rs
pub struct TasksFacade {
    task_service: Arc<TaskService>,
    event_bus: Arc<dyn DomainEventBus>,
}
```

Facades are used for cross-domain access and simplify testing.

## Data Flow: Task Creation Example

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                                     │
│ TaskForm.tsx → taskIpc.create(data) → invoke('task_create', {...})          │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ IPC LAYER                                                                    │
│ resolve_context!() → validates session, checks RBAC → RequestContext       │
│ task_create() delegates to TaskService                                       │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER                                                            │
│ TaskService.create_task(request, ctx)                                        │
│   → validates business rules                                                │
│   → calls repository                                                        │
│   → publishes TaskCreated event                                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER                                                         │
│ SqliteTaskRepository.insert(task) → INSERT INTO tasks (...)                 │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT BUS                                                                    │
│ DomainEvent::TaskCreated → subscribers (audit, notifications)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Communication Patterns

| Pattern | Mechanism | Use Case |
|---------|-----------|----------|
| Synchronous | Direct IPC via `invoke()` | CRUD operations, queries |
| Asynchronous | In-memory `EventBus` | Cross-domain reactions (e.g., inventory deduction on intervention finalize) |
| Tracing | `correlation_id` per request | Debugging, audit trails (**ADR-020**) |

## Dependency Rules

1. **Inner layers cannot depend on outer layers.**
2. **Domain Layer has zero dependencies.**
3. **Cross-domain calls MUST go through**:
   - `shared/services/` (synchronous)
   - `shared/event_bus/` (asynchronous)
4. **Direct imports from another domain's internals are FORBIDDEN.**

## Key Files

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Command registration via `tauri::generate_handler![]` |
| `src-tauri/src/service_builder.rs` | Service wiring (**ADR-004**) |
| `src-tauri/src/shared/app_state.rs` | Application state container |
| `src-tauri/src/shared/event_bus/bus.rs` | EventBus implementation |
| `src-tauri/src/shared/services/domain_event.rs` | DomainEvent enum |
| `src-tauri/src/shared/context/request_context.rs` | RequestContext definition |
| `src-tauri/src/shared/repositories/factory.rs` | Repository factory |