---
title: "Backend Guide"
summary: "Rust development standards, domain patterns, and system architecture."
read_when:
  - "Implementing new backend features"
  - "Writing Rust services or repositories"
  - "Adding new IPC commands"
---

# 04. BACKEND GUIDE

The backend is a **Rust** application managed by **Tauri**, located in `src-tauri/`.

## Architecture: The Four-Layer Rule

Every domain in `src-tauri/src/domains/` MUST follow (**ADR-001**):
`IPC → Application → Domain ← Infrastructure`

### Compliance Matrix

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
| settings | ✓ | — | — | — | Handler + repositories |

## Layer Details

### 1. IPC Layer (`ipc/`)
Entry points for Tauri commands (**ADR-018**).

```rust
#[tauri::command]
pub async fn material_create(
    state: AppState<'_>,
    request: CreateMaterialRequest,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Material>, AppError> {
    // 1. Resolve request context (auth + RBAC)
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Technician);

    // 2. Get service
    let service = state.material_service.clone();

    // 3. Call application service
    match service.create_material(request, Some(ctx.user_id().to_string())) {
        Ok(material) => Ok(ApiResponse::success(material)
            .with_correlation_id(Some(ctx.correlation_id.clone()))),
        Err(e) => Err(e.into_app_error()),
    }
}
```

### 2. Application Layer (`application/`)
- **Orchestration** and use cases.
- **RBAC enforcement** via `RequestContext`.
- **Coordinates** services and repositories.

### 3. Domain Layer (`domain/`)
- **Pure logic** — no SQL, no IPC, no frameworks.
- **Entities** and business rules only.
- **Zero external dependencies**.

### 4. Infrastructure Layer (`infrastructure/`)
- **Repository implementations** (**ADR-005**).
- **SQL queries** using SQLite via `rusqlite`.

## Intervention Sub-Services

The Interventions domain has specialized sub-services:

| Service | Location | Purpose |
|---------|----------|---------|
| `InterventionService` | `infrastructure/intervention.rs` | Main coordinator |
| `InterventionStepService` | `infrastructure/intervention_step_service.rs` | Step progression |
| `PhotoValidationService` | `infrastructure/photo_validation_service.rs` | Photo validation |
| `InterventionScoringService` | `infrastructure/intervention_scoring_service.rs` | Quality scoring |
| `MaterialConsumptionService` | `infrastructure/material_consumption_service.rs` | Material tracking |
| `InterventionWorkflowService` | `infrastructure/intervention_workflow.rs` | Workflow orchestration |

## Facade Pattern

Domains expose a simplified public API via a Facade:

```rust
// domains/tasks/facade.rs
pub struct TasksFacade {
    task_service: Arc<TaskService>,
    event_bus: Arc<dyn DomainEventBus>,
}

impl TasksFacade {
    pub async fn create_task(&self, request: CreateTaskRequest, ctx: &RequestContext) -> AppResult<Task> {
        // Simplified public API
    }
}
```

Facades are used for cross-domain access via `shared/services/`.

## Service Builder (**ADR-004**)

All services are wired in `src-tauri/src/service_builder.rs`:

```rust
pub struct ServiceBuilder {
    db: Arc<Database>,
    repositories: Arc<Repositories>,
    app_data_dir: PathBuf,
    #[cfg(not(test))]
    app_handle: Option<tauri::AppHandle>,
}

impl ServiceBuilder {
    pub fn build(self) -> Result<AppStateType, Box<dyn std::error::Error>> {
        // Initialize in dependency order (see ADR-004 for full graph):
        
        // Layer 1: Core services
        let task_service = Arc::new(TaskService::new(self.db.clone()));
        let event_bus = Arc::new(InMemoryEventBus::new());
        set_global_event_bus(event_bus.clone());
        
        // Layer 2: Domain services
        let client_service = Arc::new(ClientService::new(
            self.repositories.client.clone(),
            event_bus.clone(),
        ));
        
        // Intervention sub-services
        let intervention_step_service = Arc::new(InterventionStepService::new(self.db.clone()));
        // ... other sub-services
        
        let intervention_service = Arc::new(InterventionService::with_services(
            self.db.clone(),
            intervention_step_service,
            photo_validation_service,
            intervention_scoring_service,
            material_consumption_service,
        ));
        
        // Layer 3: Audit
        let audit_service = Arc::new(AuditService::new(self.db.clone()));
        
        // Layer 4: Event handlers
        let audit_log_handler = AuditLogHandler::new(audit_service.clone());
        event_bus.register_handler(audit_log_handler);
        register_handler(inventory_service.intervention_finalized_handler());
        register_handler(Arc::new(quote_accepted_handler));
        register_handler(Arc::new(quote_converted_handler));
        
        // Final services
        let global_search_service = Arc::new(GlobalSearchService::new(self.repositories.clone()));
        let trash_service = Arc::new(TrashService::new(self.db.clone()));
        
        Ok(AppStateType { /* ... */ })
    }
}
```

## App State (`AppStateType`)

```rust
pub struct AppStateType {
    pub db: Arc<Database>,
    pub async_db: Arc<AsyncDatabase>,
    pub repositories: Arc<Repositories>,
    pub task_service: Arc<TaskService>,
    pub client_service: Arc<ClientService>,
    pub task_import_service: Arc<TaskImportService>,
    pub calendar_service: Arc<CalendarService>,
    pub intervention_service: Arc<InterventionService>,
    pub intervention_creator: Arc<dyn InterventionCreator>,
    pub material_service: Arc<MaterialService>,
    pub inventory_service: Arc<InventoryFacade>,
    pub message_service: Arc<MessageService>,
    pub photo_service: Arc<PhotoService>,
    pub quote_service: Arc<QuoteService>,
    pub auth_service: Arc<AuthService>,
    pub session_service: Arc<SessionService>,
    pub session_store: Arc<SessionStore>,
    pub settings_repository: Arc<SettingsRepository>,
    pub user_settings_repository: Arc<UserSettingsRepository>,
    pub settings_service: Arc<SettingsService>,
    pub user_service: Arc<UserService>,
    pub cache_service: Arc<CacheService>,
    pub event_bus: Arc<InMemoryEventBus>,
    pub app_config: Arc<AppConfig>,
    pub trash_service: Arc<TrashService>,
    pub global_search_service: Arc<GlobalSearchService>,
    pub audit_service: Arc<AuditService>,
}
```

## Error Handling (**ADR-019**)

```rust
// Use AppError for all expected failures
pub enum AppError {
    Authentication(String),
    Authorization(String),
    Validation(String),
    NotFound(String),
    Database(String),    // Sanitized for frontend
    Internal(String),    // Sanitized for frontend
    // Domain-specific...
}

// At IPC boundary
impl From<AppError> for ApiResponse<Value> {
    fn from(error: AppError) -> Self {
        ApiResponse::error(error)  // Sanitizes internals
    }
}
```

## Security & Auth

- **Centralized Auth**: `resolve_context!` macro handles session validation and RBAC.
- **RequestContext**: Flows through the system; raw tokens never leave the IPC layer.
- **Location**: `src-tauri/src/shared/context/request_context.rs`

```rust
pub struct RequestContext {
    pub auth: AuthContext,
    pub correlation_id: String,
}

impl RequestContext {
    pub fn user_id(&self) -> &str { &self.auth.user_id }
    pub fn role(&self) -> &UserRole { &self.auth.role }
    
    /// Create a minimal context for pre-authentication (bootstrap)
    pub fn unauthenticated(correlation_id: String) -> Self { /* ... */ }
}
```

### AuthContext Structure

```rust
pub struct AuthContext {
    pub user_id: String,
    pub role: UserRole,
    pub session_id: String,
    pub username: String,
    pub email: String,
}
```

## Database & Persistence

| Aspect | Details |
|--------|---------|
| Migrations | Numbered SQL files in `src-tauri/migrations/` (**ADR-010**) |
| Migration Range | `002` through `063` |
| WAL Mode | Enabled by default for performance (**ADR-009**) |
| Async DB | `AsyncDatabase` wrapper for non-blocking operations |
| Repository Pattern | Abstract data access (**ADR-005**) |
| Soft Delete | `deleted_at` timestamp (**ADR-011**) |
| Timestamps | i64 Unix milliseconds (**ADR-012**) |
| Streaming | `ChunkedQuery` for large result sets |
| Cache | `PreparedStatementCache`, `QueryPerformanceMonitor` |

## Cross-Domain Coordination

| Mechanism | Location | Use Case |
|-----------|----------|----------|
| Event Bus | `shared/event_bus/` | Async cross-domain reactions |
| QuoteEventBus | `service_builder.rs` | Quote-specific events |
| Facade Pattern | `domains/*/facade.rs` | Controlled cross-domain access |
| Service Builder | `service_builder.rs` | Centralized DI |
| Global Search | `shared/services/global_search.rs` | Cross-domain search |

## Command Registration

Commands are registered in `src-tauri/src/main.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    // Auth (4 commands)
    domains::auth::ipc::auth::auth_login,
    domains::auth::ipc::auth::auth_create_account,
    domains::auth::ipc::auth::auth_logout,
    domains::auth::ipc::auth::auth_validate_session,
    
    // Security audit (4 commands)
    domains::auth::ipc::audit_security_ipc::get_security_metrics,
    domains::auth::ipc::audit_security_ipc::get_security_events,
    domains::auth::ipc::audit_security_ipc::get_security_alerts,
    domains::auth::ipc::audit_security_ipc::acknowledge_security_alert,
    
    // Users (8 commands)
    domains::users::ipc::user::user_crud,
    domains::users::ipc::user::bootstrap_first_admin,
    domains::users::ipc::user::has_admins,
    // ... ~240+ commands total
    
    // System
    commands::system::health_check,
    commands::ui::ui_window_minimize,
    // ...
])
```

## Coding Standards

- Use **Newtypes** (e.g., `TaskId(String)`) for type safety.
- All IPC request/response types must derive `#[derive(TS)]` and `#[ts(export)]`.
- Run `npm run types:sync` after changing `#[derive(TS)]` types.
- Follow `clippy` and `rustfmt` rules.
- No `unwrap()` or `expect()` in production code.