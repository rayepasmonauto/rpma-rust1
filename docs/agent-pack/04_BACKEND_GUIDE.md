# RPMA v2 - Backend Guide

> Rust backend patterns, DDD implementation, and command development guide.

---

## Backend Structure

### Directory Layout

```
src-tauri/src/
├── main.rs                      # Tauri bootstrap, command registration
├── lib.rs                       # Library exports
├── bin/
│   └── export-types.rs          # TypeScript type generation binary
│
├── commands/                    # System-level commands
│   ├── system.rs               # Health checks, diagnostics
│   └── navigation.rs           # Navigation helpers
│
├── db/                          # Database foundation
│   ├── mod.rs                  # Pool, transactions, pragmas
│   ├── connection.rs           # Pool initialization
│   └── migrations/             # Migration orchestration
│
├── domains/                     # Business domains (DDD)
│   ├── auth/
│   ├── tasks/
│   ├── interventions/
│   └── ... (15 domains)
│
├── infrastructure/              # Cross-cutting infrastructure
│   └── auth/
│       └── session_store.rs    # In-memory session cache
│
├── shared/                      # Shared concerns
│   ├── auth_middleware.rs      # Authentication macros
│   ├── ipc/
│   │   └── errors.rs           # AppError enum
│   └── event_bus/              # Cross-domain events
│
└── service_builder.rs          # Dependency injection container
```

---

## Domain Structure (DDD)

Each domain follows strict layering:

```
src-tauri/src/domains/<domain>/
├── mod.rs                       # Domain exports
├── facade.rs                    # Public API surface
│
├── ipc/                         # IPC Layer (thin)
│   ├── mod.rs
│   └── <domain>.rs             # Command handlers
│
├── application/                 # Application Layer (orchestration)
│   ├── mod.rs
│   ├── contracts.rs            # Input/output DTOs
│   └── <use_case>.rs           # Use case implementations
│
├── domain/                      # Domain Layer (pure logic)
│   ├── mod.rs
│   ├── models/                 # Entities, value objects
│   ├── services/               # Domain services
│   ├── events/                 # Domain events
│   └── policy.rs               # Business rules
│
├── infrastructure/              # Infrastructure Layer (I/O)
│   ├── mod.rs
│   └── <resource>_repository.rs # Raw SQL, persistence
│
└── tests/                       # Domain tests
    ├── mod.rs
    ├── unit_<domain>.rs
    ├── integration_<domain>.rs
    ├── permission_<domain>.rs
    └── validation_<domain>.rs
```

---

## Implementing a New Command (End-to-End)

### Example: Create Inventory Adjustment Command

#### Step 1: Define Domain Model

```rust
// src-tauri/src/domains/inventory/domain/models/adjustment.rs
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct InventoryAdjustment {
    pub id: String,
    pub material_id: String,
    pub quantity: f64,
    pub reason: String,
    pub performed_by: String,
    pub performed_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CreateAdjustmentRequest {
    pub material_id: String,
    pub quantity: f64,  // Positive = add, Negative = remove
    pub reason: String,
}
```

#### Step 2: Domain Validation

```rust
// src-tauri/src/domains/inventory/domain/policy.rs
use super::models::CreateAdjustmentRequest;
use crate::shared::ipc::errors::AppError;

pub fn validate_adjustment_request(
    req: &CreateAdjustmentRequest
) -> Result<(), AppError> {
    if req.reason.trim().is_empty() {
        return Err(validation_error!(
            "reason",
            "Reason is required for adjustments"
        ));
    }
    
    if req.quantity == 0.0 {
        return Err(validation_error!(
            "quantity",
            "Quantity cannot be zero"
        ));
    }
    
    Ok(())
}
```

#### Step 3: Repository

```rust
// src-tauri/src/domains/inventory/infrastructure/adjustment_repository.rs
use crate::db::Database;
use crate::domains::inventory::domain::models::InventoryAdjustment;
use rusqlite::params;

pub struct AdjustmentRepository {
    db: Database,
}

impl AdjustmentRepository {
    pub fn new(db: Database) -> Self {
        Self { db }
    }
    
    pub async fn create(
        &self,
        tx: &Transaction,
        adjustment: &InventoryAdjustment
    ) -> Result<(), AppError> {
        tx.execute(
            "INSERT INTO inventory_adjustments 
             (id, material_id, quantity, reason, performed_by, performed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                adjustment.id,
                adjustment.material_id,
                adjustment.quantity,
                adjustment.reason,
                adjustment.performed_by,
                adjustment.performed_at
            ],
        )?;
        
        Ok(())
    }
    
    pub async fn update_material_stock(
        &self,
        tx: &Transaction,
        material_id: &str,
        delta: f64
    ) -> Result<f64, AppError> {
        // Get current stock
        let current: f64 = tx.query_row(
            "SELECT current_stock FROM materials WHERE id = ?1",
            [material_id],
            |row| row.get(0)
        )?;
        
        let new_stock = current + delta;
        
        // Update stock
        tx.execute(
            "UPDATE materials SET current_stock = ?1, updated_at = ?2 
             WHERE id = ?3",
            params![new_stock, now(), material_id],
        )?;
        
        Ok(new_stock)
    }
}
```

#### Step 4: Application Service

```rust
// src-tauri/src/domains/inventory/application/adjustment_service.rs
use crate::domains::inventory::domain::{
    models::*,
    policy::validate_adjustment_request,
};
use crate::domains::inventory::infrastructure::AdjustmentRepository;
use crate::shared::auth::RequestContext;
use crate::db::Database;
use uuid::Uuid;

pub struct AdjustmentService {
    db: Database,
    repo: AdjustmentRepository,
}

impl AdjustmentService {
    pub fn new(db: Database, repo: AdjustmentRepository) -> Self {
        Self { db, repo }
    }
    
    pub async fn create_adjustment(
        &self,
        ctx: &RequestContext,
        req: CreateAdjustmentRequest,
    ) -> Result<InventoryAdjustment, AppError> {
        // 1. Authorization check
        ctx.auth.require_role(UserRole::Supervisor)?;
        
        // 2. Validate (domain layer)
        validate_adjustment_request(&req)?;
        
        // 3. Begin transaction
        let tx = self.db.begin_transaction().await?;
        
        // 4. Create entity
        let adjustment = InventoryAdjustment {
            id: Uuid::new_v4().to_string(),
            material_id: req.material_id,
            quantity: req.quantity,
            reason: req.reason,
            performed_by: ctx.auth.user_id.clone(),
            performed_at: now(),
        };
        
        // 5. Persist adjustment record
        self.repo.create(&tx, &adjustment).await?;
        
        // 6. Update material stock
        self.repo.update_material_stock(
            &tx, 
            &adjustment.material_id, 
            adjustment.quantity
        ).await?;
        
        // 7. Audit log
        self.audit_repo.log(
            &tx,
            ctx,
            "inventory_adjusted",
            &adjustment.id
        ).await?;
        
        // 8. Commit
        tx.commit().await?;
        
        // 9. Publish event (post-commit)
        self.event_bus.publish(InventoryAdjustedEvent::new(&adjustment));
        
        Ok(adjustment)
    }
}
```

#### Step 5: IPC Handler

```rust
// src-tauri/src/domains/inventory/ipc/material.rs
use crate::resolve_context;
use crate::shared::ipc::contracts::ApiResponse;
use crate::domains::inventory::application::AdjustmentService;

#[tauri::command]
#[instrument(skip(app_state))]
pub async fn material_adjust_stock(
    app_state: tauri::State<'_, AppState>,
    request: CreateAdjustmentRequest,
) -> Result<ApiResponse<InventoryAdjustment>, String> {
    // 1. Resolve context (auth + correlation)
    let ctx = resolve_context!(app_state, request);
    
    // 2. Delegate to service
    let result = app_state
        .inventory_service
        .create_adjustment(&ctx, request)
        .await;
    
    // 3. Map to API response
    match result {
        Ok(adjustment) => Ok(ApiResponse::success(
            "Stock adjusted successfully",
            adjustment
        )),
        Err(e) => {
            error!(correlation_id = %ctx.correlation_id, error = %e, "Stock adjustment failed");
            Ok(ApiResponse::from_error(e))
        }
    }
}
```

#### Step 6: Register Command

```rust
// src-tauri/src/main.rs (line ~70)
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    domains::inventory::ipc::material::material_adjust_stock,
])
```

#### Step 7: Generate Types

```bash
npm run types:sync
```

#### Step 8: Frontend Wrapper

```typescript
// frontend/src/domains/inventory/ipc/materials.ipc.ts
export const materialsIpc = {
  async adjustStock(data: CreateAdjustmentRequest): Promise<InventoryAdjustment> {
    return safeInvoke('material_adjust_stock', data);
  },
};
```

---

## Error Model (AppError)

Central error type: `src-tauri/src/shared/ipc/errors.rs`

### Error Variants

```rust
pub enum AppError {
    // System errors
    Authentication(String),
    Authorization(String),
    Validation(Vec<ValidationError>),
    NotFound { resource: String, id: String },
    Database(String),
    Internal(String),
    
    // Domain-specific
    InterventionStepNotFound(String),
    TaskInvalidTransition { from: TaskStatus, to: TaskStatus },
    MaterialInsufficientStock { material_id: String, requested: f64, available: f64 },
    // ...
}
```

### Helper Macros

```rust
// Validation error
validation_error!(field, message)
// → AppError::Validation([ValidationError { field, message }])

// Auth errors
auth_error!("Invalid credentials")
authz_error!("Insufficient permissions")

// Not found
not_found_error!("Task", task_id)

// Internal (sanitized)
internal_error!("Database connection failed")
```

### Sanitization

Sensitive errors are sanitized before IPC response:

```rust
impl AppError {
    pub fn to_api_error(&self) -> ApiError {
        match self {
            // Sanitized: remove internal details
            AppError::Database(_) => ApiError {
                code: "DATABASE_ERROR",
                message: "A database error occurred".into(),
                details: None,
            },
            AppError::Internal(_) => ApiError {
                code: "INTERNAL_ERROR",
                message: "An internal error occurred".into(),
                details: None,
            },
            // Non-sanitized: safe for frontend
            AppError::Validation(errors) => ApiError {
                code: "VALIDATION_ERROR",
                message: "Validation failed".into(),
                details: Some(json!(errors)),
            },
            // ...
        }
    }
}
```

---

## Validation Patterns

### Input Validation (Application Layer)

```rust
// Validate before domain operations
pub fn validate_create_task_request(req: &CreateTaskRequest) -> Result<(), AppError> {
    let mut errors = Vec::new();
    
    if req.title.trim().is_empty() {
        errors.push(ValidationError {
            field: "title".into(),
            message: "Title is required".into(),
        });
    }
    
    if req.title.len() > 200 {
        errors.push(ValidationError {
            field: "title".into(),
            message: "Title must be under 200 characters".into(),
        });
    }
    
    if !errors.is_empty() {
        return Err(AppError::Validation(errors));
    }
    
    Ok(())
}
```

### Business Rule Validation (Domain Layer)

```rust
// src-tauri/src/domains/tasks/domain/services/task_state_machine.rs
pub fn validate_status_transition(
    from: &TaskStatus,
    to: &TaskStatus
) -> Result<(), AppError> {
    let valid = match (from, to) {
        (TaskStatus::Draft, TaskStatus::Pending) => true,
        (TaskStatus::Pending, TaskStatus::Scheduled) => true,
        (TaskStatus::Scheduled, TaskStatus::InProgress) => true,
        (TaskStatus::InProgress, TaskStatus::Completed) => true,
        (TaskStatus::InProgress, TaskStatus::Paused) => true,
        (TaskStatus::Paused, TaskStatus::InProgress) => true,
        (TaskStatus::Completed, TaskStatus::Archived) => true,
        _ => false,
    };
    
    if !valid {
        return Err(AppError::TaskInvalidTransition {
            from: from.clone(),
            to: to.clone(),
        });
    }
    
    Ok(())
}
```

---

## Logging & Tracing

### Instrumentation

All IPC handlers must have `#[instrument]`:

```rust
#[tauri::command]
#[instrument(
    skip(app_state),
    fields(
        correlation_id = %request.correlation_id,
        user_id = tracing::field::Empty
    )
)]
pub async fn task_crud(
    app_state: tauri::State<'_, AppState>,
    request: TaskRequest,
) -> Result<ApiResponse<TaskResponse>, String> {
    let ctx = resolve_context!(app_state, request);
    
    // Auto-populates user_id field
    tracing::Span::current().record("user_id", &ctx.auth.user_id);
    
    debug!("Processing task operation");
    
    match operation {
        TaskOperation::Create => {
            info!("Creating new task");
            // ...
        }
    }
}
```

### Log Levels

| Level | Use Case |
|-------|----------|
| `error!` | Failures requiring investigation |
| `warn!` | Degraded functionality, recoverable errors |
| `info!` | Significant business events (task created, etc.) |
| `debug!` | Detailed flow tracing (dev only) |
| `trace!` | Very verbose ( rarely used) |

### Request Correlation

Every request has a `correlation_id`:
- Generated by frontend
- Passed through all layers
- Included in all log entries
- Returned in error responses

---

## Testing Requirements

Every command must have:

1. **Unit Tests**: Domain logic, validation
2. **Integration Tests**: End-to-end flow
3. **Permission Tests**: RBAC enforcement
4. **Validation Tests**: Error cases

```rust
// src-tauri/src/domains/inventory/tests/unit_inventory.rs
#[test]
fn test_adjustment_validation_requires_reason() {
    let req = CreateAdjustmentRequest {
        material_id: "mat-123".into(),
        quantity: 10.0,
        reason: "".into(),
    };
    
    let result = validate_adjustment_request(&req);
    
    assert!(result.is_err());
    match result.unwrap_err() {
        AppError::Validation(errors) => {
            assert_eq!(errors[0].field, "reason");
        }
        _ => panic!("Expected validation error"),
    }
}

// src-tauri/src/domains/inventory/tests/permission_inventory.rs
#[tokio::test]
async fn test_technician_cannot_adjust_stock() {
    let ctx = RequestContext::test_context(UserRole::Technician);
    let service = create_test_service().await;
    
    let req = CreateAdjustmentRequest {
        material_id: "mat-123".into(),
        quantity: 10.0,
        reason: "Test".into(),
    };
    
    let result = service.create_adjustment(&ctx, req).await;
    
    assert!(matches!(result, Err(AppError::Authorization(_))));
}
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Command registration (lines 70-324) |
| `src-tauri/src/service_builder.rs` | Dependency injection |
| `src-tauri/src/shared/ipc/errors.rs` | AppError definitions |
| `src-tauri/src/shared/auth_middleware.rs` | Auth macros (`resolve_context!`) |
| `src-tauri/src/db/mod.rs` | Database pool & transactions |
| `src-tauri/src/domains/*/facade.rs` | Domain public API |

---

## Next Steps

- **Frontend Integration**: See [03_FRONTEND_GUIDE.md](./03_FRONTEND_GUIDE.md)
- **IPC Reference**: See [05_IPC_API_AND_CONTRACTS.md](./05_IPC_API_AND_CONTRACTS.md)
- **Security**: See [06_SECURITY_AND_RBAC.md](./06_SECURITY_AND_RBAC.md)

---

*DDD Architecture: See docs/adr/001-module-boundaries.md*
