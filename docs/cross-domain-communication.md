---
title: "Cross-Domain Communication"
summary: "Event bus and shared contracts for loose coupling between bounded contexts"
read_when:
* Adding cross-domain functionality
* Understanding domain boundaries
* Implementing reactive updates
* Debugging domain interactions
---

## Overview

Domains must remain isolated. Cross-domain communication uses **shared contracts** for types and the **event bus** for reactive coordination. Never import directly from another domain's internals.

**Related ADRs**: [ADR-016](./adr/016-domain-isolation-contracts.md), [ADR-005](./adr/005-event-bus-pattern.md)

## Critical Rule

```rust
// Bad: Direct import from another domain
use crate::domains::auth::domain::models::auth::UserSession;
use crate::domains::tasks::infrastructure::task::TaskRepository;

// Good: Import from shared contracts
use crate::shared::contracts::auth::UserRole;

// Good: Import from cross_domain (composition layer only)
use crate::shared::services::cross_domain::TaskService;
```

## Shared Contracts

Types shared between domains are defined in `shared/contracts/`, not in domain internals.

Location: `src-tauri/src/shared/contracts/`

```
src-tauri/src/shared/contracts/
├── auth.rs        # UserRole, UserSession, UserAccount
├── common.rs      # GpsLocation, FilmType, WorkLocation
└── prediction.rs  # CompletionTimePrediction
```

### Contract Pattern

```rust
// src-tauri/src/shared/contracts/auth.rs
//! Shared authentication contracts used across bounded contexts.
//! These types originate in the `auth` domain but are re-exported here
//! so that other domains can reference them without creating a
//! cross-domain dependency on `auth::domain`.

pub use crate::domains::auth::domain::models::auth::{
    SessionTimeoutConfig, UserAccount, UserRole, UserSession,
};
```

## Cross-Domain Services

`cross_domain.rs` is the **single audited entry point** for cross-domain service access.

Location: `src-tauri/src/shared/services/cross_domain.rs`

```rust
//! Cross-domain service re-exports for shared access.
//!
//! **Prefer** importing domain-owned traits from `shared::contracts`
//! when only the contract surface is needed. Use this module only
//! when a concrete infrastructure service is required.

// Services
pub use crate::domains::interventions::infrastructure::intervention::InterventionService;
pub use crate::domains::clients::infrastructure::client::ClientService;
pub use crate::domains::tasks::infrastructure::task::TaskService;
pub use crate::domains::auth::infrastructure::auth::AuthService;

// Types (for cross-domain coordination only)
pub use crate::domains::clients::domain::models::client::Client;
pub use crate::domains::tasks::domain::models::task::{Task, TaskStatus};
pub use crate::domains::interventions::domain::models::intervention::Intervention;
```

### When to Use

| Use Case | Source |
|----------|--------|
| Need a type (UserRole, TaskStatus) | `shared::contracts::*` |
| Need a service at composition layer | `shared::services::cross_domain::*` |
| Reactive coordination | Event bus |

## Event Bus

The event bus enables loose coupling through publish/subscribe.

Location: `src-tauri/src/shared/services/event_bus.rs`

### Implementation

```rust
pub struct InMemoryEventBus {
    handlers: Arc<Mutex<HashMap<String, Vec<Arc<dyn EventHandler>>>>>,
}

#[async_trait]
pub trait EventHandler: Send + Sync {
    async fn handle(&self, event: &DomainEvent) -> Result<(), String>;
    fn interested_events(&self) -> Vec<&'static str>;
}
```

### Domain Events

Location: `src-tauri/src/shared/services/domain_event.rs`

```rust
pub enum DomainEvent {
    // Task events
    TaskCreated { task_id: String, title: String, user_id: String },
    TaskUpdated { task_id: String, changed_fields: Vec<String> },
    TaskStatusChanged { task_id: String, old_status: TaskStatus, new_status: TaskStatus },
    TaskAssigned { task_id: String, technician_id: String },
    
    // Intervention events
    InterventionStarted { intervention_id: String, task_id: String },
    InterventionCompleted { intervention_id: String },
    InterventionFinalized { intervention_id: String, task_id: String },
    
    // Inventory events
    MaterialConsumed { material_id: String, intervention_id: String, quantity: f64 },
    
    // Auth events
    AuthenticationFailed { user_id: String, reason: String },
    AuthenticationSuccess { user_id: String },
}
```

### Publishing Events

```rust
// In domain service
event_bus.dispatch(DomainEvent::TaskCompleted { 
    task_id, 
    completed_by: ctx.user_id(),
}).await;
```

### Subscribing to Events

```rust
impl EventHandler for InventoryHandler {
    fn interested_events(&self) -> Vec<&'static str> {
        vec!["TaskCompleted"]
    }
    
    async fn handle(&self, event: &DomainEvent) -> Result<(), String> {
        match event {
            DomainEvent::TaskCompleted { task_id, .. } => {
                // Update inventory without direct task dependency
                self.consume_materials_for_task(task_id).await?;
            }
            _ => {}
        }
        Ok(())
    }
}
```

### Failure Isolation

Handlers run in separate tasks. One handler's failure doesn't affect others:

```rust
let join_result = tokio::spawn(async move { 
    handler.handle(&event_clone).await 
}).await;

match join_result {
    Ok(Ok(())) => { /* success */ },
    Ok(Err(e)) => { tracing::error!("Handler failed: {}", e); },
    Err(_) => { tracing::error!("Handler panicked, isolating failure"); },
}
```

## Use Cases

### Task Completion Triggers Inventory Update

```
[Task Domain] --TaskCompleted--> [Event Bus] --dispatch--> [Inventory Domain]
```

Task domain doesn't know about inventory. Inventory subscribes to `TaskCompleted`.

### Intervention Finalization Updates Task

```
[Intervention Domain] --InterventionFinalized--> [Event Bus] --> [Task Domain]
```

## Key Files

| Purpose | Location |
|---------|----------|
| Shared contracts | `src-tauri/src/shared/contracts/` |
| Cross-domain services | `src-tauri/src/shared/services/cross_domain.rs` |
| Event bus | `src-tauri/src/shared/services/event_bus.rs` |
| Domain events | `src-tauri/src/shared/services/domain_event.rs` |
