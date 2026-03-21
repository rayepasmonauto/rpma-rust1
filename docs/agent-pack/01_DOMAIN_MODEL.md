---
title: "Domain Model"
summary: "Detailed overview of core entities, their relations, and domain rules."
read_when:
  - "Designing new features"
  - "Understanding entity relationships"
  - "Modifying database schema"
---

# 01. DOMAIN MODEL

The RPMA v2 domain model follows Bounded Context principles (**ADR-002**). Each domain is isolated in `src-tauri/src/domains/<name>/`.

## Architecture Compliance

Most domains follow the **4-layer pattern** (ADR-001):
`IPC → Application → Domain ← Infrastructure`

**Domains with full layer compliance:**
- `auth`, `clients`, `interventions`, `inventory`, `quotes`, `tasks`, `trash`, `users`

**Domains with flat/handler-based structure:**
- `calendar`, `documents`, `notifications`, `settings`

## Core Entities

### 1. Task (`tasks`)
- **Location**: `src-tauri/src/domains/tasks/domain/models/task.rs`
- **Purpose**: Represents a requested job.
- **Status Flow**: `Draft` → `Scheduled` → `InProgress` → `Completed` | `Cancelled` | `Delayed`.
- **Relations**: Belongs to a **Client**, assigned to a **User** (Technician).
- **IPC Entry**: `domains::tasks::ipc::task::*`

### 2. Client (`clients`)
- **Location**: `src-tauri/src/domains/clients/client_handler/`
- **Purpose**: Individuals or organizations requesting service.
- **Relations**: One client has many tasks.
- **IPC Entry**: `domains::clients::client_handler::*`

### 3. Intervention (`interventions`)
- **Location**: `src-tauri/src/domains/interventions/domain/models/intervention.rs`
- **Purpose**: The execution phase of a task.
- **Flow**: Start → Step Progression → Consumption Recording → Finalization.
- **Relations**: 1:1 with **Task** (typically).
- **Sub-Services**: `InterventionStepService`, `PhotoValidationService`, `InterventionScoringService`, `MaterialConsumptionService`, `InterventionWorkflowService`.
- **IPC Entry**: `domains::interventions::ipc::*`

### 4. Material / Inventory (`inventory`)
- **Location**: `src-tauri/src/domains/inventory/domain/models/material.rs`
- **Purpose**: Consumables used during interventions.
- **Relations**: Linked to interventions via consumption records.
- **IPC Entry**: `domains::inventory::ipc::material::*`

### 5. User (`users`)
- **Location**: `src-tauri/src/domains/users/domain/models/user.rs`
- **Roles**: `Admin`, `Supervisor`, `Technician`, `Viewer` (**ADR-007**).
- **IPC Entry**: `domains::users::ipc::user::*`

### 6. Quote (`quotes`)
- **Location**: `src-tauri/src/domains/quotes/domain/models/quote.rs`
- **Lifecycle**: `Draft` → `Sent` → `Accepted` → `Converted to Task`.
- **IPC Entry**: `domains::quotes::ipc::quote::*`

### 7. Auth Session (`auth`)
- **Location**: `src-tauri/src/domains/auth/`
- **Purpose**: Login, session management, token validation.
- **Components**: `AuthService`, `SessionService`, `SessionStore` (in-memory).
- **IPC Entry**: `domains::auth::ipc::*`

### 8. Notification (`notifications`)
- **Location**: `src-tauri/src/domains/notifications/notification_handler/`
- **Purpose**: System and user-triggered alerts.
- **IPC Entry**: `domains::notifications::notification_handler::*`

### 9. Trash (`trash`)
- **Location**: `src-tauri/src/domains/trash/`
- **Purpose**: Soft-deleted entity recovery.
- **IPC Entry**: `domains::trash::ipc::*`

## Storage & Implementation Patterns

| Pattern | Location | Details |
|---------|----------|---------|
| Soft Delete | ADR-011 | `deleted_at` timestamp for most entities |
| Timestamps | ADR-012 | i64 Unix milliseconds everywhere |
| IDs | UUID v4 | String-based primary keys |
| Validation | ADR-008 | Centralized via `shared/services/validation/` |
| Repositories | ADR-005 | Trait definitions in domain, implementations in infrastructure |

## Cross-Domain Communication

| Mechanism | Location | Purpose |
|-----------|----------|---------|
| Shared Contracts | `src-tauri/src/shared/contracts/` | Common types across domains |
| Event Bus | `src-tauri/src/shared/services/event_bus/` | Decoupled domain events (ADR-016) |
| Domain Events | `src-tauri/src/shared/services/domain_event.rs` | Event type definitions (ADR-017) |
| Facades | `src-tauri/src/domains/*/facade.rs` | Simplified public API for cross-domain access |
| Service Builder | `src-tauri/src/service_builder.rs` | Centralized service initialization (ADR-004) |

## Domain Events (ADR-017)

### Task Events
| Event | Trigger |
|-------|---------|
| `TaskCreated` | New task created |
| `TaskUpdated` | Task fields modified |
| `TaskAssigned` | Technician assigned |
| `TaskStatusChanged` | Status transition |
| `TaskCompleted` | Task marked complete |
| `TaskDeleted` | Soft delete |

### Client Events
| Event | Trigger |
|-------|---------|
| `ClientCreated` | New client registered |
| `ClientUpdated` | Client data modified |
| `ClientDeactivated` | Client marked inactive |

### Intervention Events
| Event | Trigger |
|-------|---------|
| `InterventionCreated` | New intervention |
| `InterventionStarted` | Work begins |
| `InterventionStepStarted` | Step begins |
| `InterventionStepCompleted` | Step finished |
| `InterventionCompleted` | Work finished |
| `InterventionFinalized` | Final closure |
| `InterventionCancelled` | Aborted |

### Material Events
| Event | Trigger |
|-------|---------|
| `MaterialConsumed` | Stock deduction |

### Quote Events
| Event | Trigger |
|-------|---------|
| `QuoteShared` | Quote sent to client |
| `QuoteCustomerResponded` | Client response |
| `QuoteAccepted` | Client accepts |
| `QuoteRejected` | Client declines |
| `QuoteConverted` | Became a task |

### User Events
| Event | Trigger |
|-------|---------|
| `UserCreated` | New user registered |
| `UserUpdated` | User data changed |
| `UserLoggedIn` | Successful login |
| `UserLoggedOut` | Session ended |
| `AuthenticationFailed` | Login failure |
| `AuthenticationSuccess` | Login success |

### System Events
| Event | Trigger |
|-------|---------|
| `SystemError` | Error occurrence |
| `SystemMaintenance` | Maintenance mode |
| `PerformanceAlert` | Threshold breach |
| `NotificationReceived` | Notification created |

### Trash Events
| Event | Trigger |
|-------|---------|
| `EntityRestored` | Soft delete reversed |
| `EntityHardDeleted` | Permanent deletion |

## Domain Rules

1. **Business logic MUST live in the Domain Layer** (`domains/*/domain/`).
2. **Only `Admin` or `Supervisor` can delete critical entities**.
3. **Technicians have scoped access** to their assigned tasks (ADR-006).
4. **Cross-domain calls MUST go through**:
   - `shared/services/` for synchronous access
   - `EventBus` for asynchronous reactions
5. **Direct imports from another domain's internals are FORBIDDEN**.
6. **All timestamps are Unix milliseconds** (ADR-012).
7. **All primary keys are UUID v4 strings**.