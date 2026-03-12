---
title: "Backend Architecture"
summary: "Rust backend with Domain-Driven Design, four-layer architecture, and 14 bounded contexts"
read_when:
* Implementing new backend features
* Understanding where to place code
* Debugging domain boundaries
* Adding new IPC commands
---

## Overview

The backend is a Rust/Tauri application following **Domain-Driven Design (DDD)** with strict four-layer separation. Each domain is a bounded context with clear ownership and boundaries.

**Related ADRs**: [ADR-002](./adr/002-ddd-four-layer-architecture.md), [ADR-006](./adr/006-repository-pattern.md), [ADR-018](./adr/018-dynamic-pool-sizing.md)

## Four-Layer Architecture

```
IPC (Tauri commands) -> Application (use cases) -> Domain (business rules) -> Infrastructure (data access)
```

### Layer Responsibilities

| Layer | Location | Responsibility | Dependencies |
|-------|----------|----------------|--------------|
| **IPC** | `domains/*/ipc/` | Tauri command handlers, authentication, input/output mapping | Application, Shared |
| **Application** | `domains/*/application/` | Use case orchestration, authorization enforcement | Domain, Infrastructure |
| **Domain** | `domains/*/domain/` | Pure business rules, entities, value objects, validation | None (pure) |
| **Infrastructure** | `domains/*/infrastructure/` | Repositories, SQL, external adapters | Domain |

### Critical Rule

> **Domain layer must have NO dependencies on other layers.** It contains pure business logic only.

## Bounded Contexts (Domains)

Location: `src-tauri/src/domains/`

| Domain | Purpose |
|--------|---------|
| `auth` | Authentication, sessions, security monitoring |
| `users` | User management, profiles, roles |
| `tasks` | Task CRUD, status transitions, assignments |
| `interventions` | Intervention workflow, steps, progress |
| `clients` | Client management, contact info |
| `inventory` | Material and inventory tracking |
| `quotes` | Quotes and pricing |
| `calendar` | Calendar events, scheduling |
| `reports` | Report generation, analytics, exports |
| `settings` | User and system settings |
| `documents` | Document management, photos |
| `notifications` | Notifications system |

## Directory Structure Example

```
src-tauri/src/domains/tasks/
├── ipc/
│   ├── mod.rs              # Command registration
│   ├── task/
│   │   ├── mod.rs          # Task commands
│   │   ├── queries.rs      # Query handlers
│   │   ├── validation.rs   # Request validation
│   │   └── types.rs        # IPC-specific types
│   └── status.rs           # Status-related commands
├── application/
│   ├── mod.rs
│   ├── contracts.rs        # Service traits
│   └── services/
│       ├── task_command_service.rs
│       └── task_policy_service.rs
├── domain/
│   ├── mod.rs
│   ├── models/
│   │   ├── task.rs         # Task entity
│   │   └── status.rs       # Status value object
│   └── services/
│       └── task_state_machine.rs
├── infrastructure/
│   ├── mod.rs
│   ├── task_repository.rs  # Repository implementation
│   ├── task_crud.rs        # CRUD operations
│   ├── task_queries.rs     # Query implementations
│   └── task_history_repository.rs
├── tests/
│   ├── integration_tasks.rs
│   ├── unit_tasks.rs
│   ├── validation_tasks.rs
│   └── permission_tasks.rs
└── mod.rs                  # Domain index
```

## Repository Pattern

All data access uses the repository pattern with async traits.

### Base Trait

Location: `src-tauri/src/shared/repositories/base.rs`

```rust
#[async_trait]
pub trait Repository<T: Send, ID: Send + Sync + Clone + 'static> {
    async fn find_by_id(&self, id: ID) -> RepoResult<Option<T>>;
    async fn find_all(&self) -> RepoResult<Vec<T>>;
    async fn save(&self, entity: T) -> RepoResult<T>;
    async fn delete_by_id(&self, id: ID) -> RepoResult<bool>;
    async fn exists_by_id(&self, id: ID) -> RepoResult<bool>;
}
```

### Queryable Extension

```rust
#[async_trait]
pub trait Queryable<T, Q>: Repository<T, Q::Id> {
    async fn find_by_query(&self, query: Q) -> RepoResult<Vec<T>>;
    async fn count_by_query(&self, query: Q) -> RepoResult<i64>;
}
```

### Error Types

```rust
pub enum RepoError {
    Database(String),
    NotFound(String),
    Validation(String),
    Conflict(String),
    Cache(String),
}
```

## Import Rules

```rust
// Good: Import from same domain or shared
use crate::domains::tasks::domain::models::task::Task;
use crate::shared::contracts::auth::UserRole;
use crate::shared::services::cross_domain::ClientService;

// Bad: Direct import from another domain's internals
use crate::domains::auth::infrastructure::auth::AuthService;
use crate::domains::clients::domain::models::client::Client;
```

## Cross-Domain Communication

Never import directly from another domain. Use:

1. **Shared Contracts**: `src-tauri/src/shared/contracts/` for types
2. **Cross-Domain Module**: `src-tauri/src/shared/services/cross_domain.rs` for services
3. **Event Bus**: `src-tauri/src/shared/services/event_bus.rs` for reactive updates

See [cross-domain-communication.md](./cross-domain-communication.md) for details.

## Key Files

| Purpose | Location |
|---------|----------|
| Domain index | `src-tauri/src/domains/mod.rs` |
| Repository traits | `src-tauri/src/shared/repositories/base.rs` |
| Cross-domain services | `src-tauri/src/shared/services/cross_domain.rs` |
| Shared contracts | `src-tauri/src/shared/contracts/` |
| Event bus | `src-tauri/src/shared/services/event_bus.rs` |
