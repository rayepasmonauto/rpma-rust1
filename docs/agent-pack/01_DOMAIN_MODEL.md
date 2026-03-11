# RPMA v2 - Domain Model

> Core entities, relationships, and business rules for the RPMA system.

---

## Core Entities

### 1. User (`users` table)

**Purpose**: System users with role-based access control.

**Key Fields**:
```rust
// src-tauri/src/domains/users/domain/models.rs (TODO: verify path)
pub struct User {
    pub id: String,              // UUID
    pub username: String,
    pub email: String,
    pub role: UserRole,          // admin | supervisor | technician | viewer
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub avatar_url: Option<String>,
}
```

**Role Hierarchy**: `Admin > Supervisor > Technician > Viewer`

**Lifecycle**: Active → Inactive (soft delete via `is_active`)

**Relations**:
- Has many: `Task` (as assignee), `Session`, `Notification`, `AuditLog`
- Has one: `UserSettings`

---

### 2. Client (`clients` table)

**Purpose**: Customer records for vehicle owners.

**Key Fields**:
```rust
// src-tauri/src/domains/clients/domain/models.rs (TODO: verify path)
pub struct Client {
    pub id: String,              // UUID
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub postal_code: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>, // Soft delete
}
```

**Lifecycle**: Active → Soft Deleted (via `deleted_at`)

**Relations**:
- Has many: `Task`, `Quote`, `Intervention`
- Has one: `ClientStatistics` (view)

---

### 3. Task (`tasks` table)

**Purpose**: Work units representing PPF intervention requests.

**Key Fields**:
```rust
// src-tauri/src/domains/tasks/domain/models/task.rs:98-708
pub struct Task {
    pub id: String,
    pub task_number: String,     // Human-readable reference
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,      // See enum below
    pub priority: TaskPriority,  // low | medium | high | urgent
    pub client_id: String,
    pub assigned_to: Option<String>, // User ID
    pub vehicle_vin: Option<String>,
    pub vehicle_plate: Option<String>,
    pub vehicle_make: Option<String>,
    pub vehicle_model: Option<String>,
    pub vehicle_year: Option<String>,
    pub scheduled_date: Option<i64>,
    pub estimated_duration: Option<i32>, // minutes
    pub actual_duration: Option<i32>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>, // Soft delete
}
```

**Status Enum** (`TaskStatus`):
| Status | Description | Valid Transitions |
|--------|-------------|-------------------|
| `draft` | Initial state | → pending |
| `pending` | Awaiting scheduling | → scheduled, cancelled |
| `scheduled` | Date assigned | → in_progress, cancelled |
| `in_progress` | Work started | → completed, paused, cancelled |
| `paused` | Temporarily stopped | → in_progress |
| `completed` | Work finished | → archived |
| `cancelled` | Cancelled | (terminal) |
| `archived` | Archived | (terminal) |
| `assigned` | Technician assigned | → scheduled |
| `on_hold` | Blocked | → pending |

**Priority Enum**: `low`, `medium` (default), `high`, `urgent`

**Business Rules**:
- Only `Admin`/`Supervisor` can modify admin fields (title, priority, client_id)
- `Technician` can only update operational fields (status, notes, actual_duration)
- Status transitions validated by state machine (see `task_state_machine.rs`)

**Relations**:
- Belongs to: `Client`, `User` (assignee)
- Has many: `Intervention`, `TaskHistory`, `CalendarEvent`

---

### 4. Intervention (`interventions` table)

**Purpose**: PPF workflow execution instance linked to a task.

**Key Fields**:
```rust
// src-tauri/src/domains/interventions/domain/models/intervention.rs:98-552
pub struct Intervention {
    pub id: String,
    pub task_id: String,
    pub intervention_number: String,
    pub status: InterventionStatus,  // pending | in_progress | paused | completed | cancelled
    pub intervention_type: InterventionType, // ppf | ceramic | detailing | other
    pub vehicle_zone: Option<String>, // PPF zone (hood, bumper, etc.)
    pub film_product: Option<String>, // Film brand/model
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub notes: Option<String>,
    pub technician_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}
```

**Status Enum** (`InterventionStatus`):
- `pending` → `in_progress` → `completed` | `cancelled`
- Can be `paused` and resumed

**Type Enum**: `ppf`, `ceramic`, `detailing`, `other`

**Business Rules**:
- Only one active intervention per task (enforced by DB constraint)
- Must have at least one step
- Completion requires all steps done

**Relations**:
- Belongs to: `Task`, `User` (technician)
- Has many: `InterventionStep`, `Photo`, `InventoryTransaction`

---

### 5. InterventionStep (`intervention_steps` table)

**Purpose**: Individual steps in the PPF workflow.

**Key Fields**:
```rust
// src-tauri/src/domains/interventions/domain/models/step.rs (TODO: verify)
pub struct InterventionStep {
    pub id: String,
    pub intervention_id: String,
    pub step_number: i32,        // Order within intervention
    pub title: String,
    pub description: Option<String>,
    pub status: StepStatus,      // pending | in_progress | completed | skipped
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub estimated_duration: Option<i32>,
    pub actual_duration: Option<i32>,
    pub location_zone: Option<String>, // For multi-zone tracking
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

**Status Enum**: `pending`, `in_progress`, `completed`, `skipped`

**Business Rules**:
- Steps executed sequentially (default workflow)
- Can be skipped with authorization
- Time tracking per step

**Relations**:
- Belongs to: `Intervention`
- Has many: `Photo` (step photos), `InventoryTransaction` (material usage)

---

### 6. Material (`materials` table)

**Purpose**: Inventory items (PPF films, tools, consumables).

**Key Fields**:
```sql
-- src-tauri/migrations/012_add_material_tables.sql
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category_id TEXT REFERENCES material_categories(id),
  unit TEXT,                    -- 'meter', 'roll', 'piece'
  unit_price REAL,
  current_stock REAL NOT NULL DEFAULT 0,
  minimum_stock REAL DEFAULT 0,
  supplier_id TEXT REFERENCES suppliers(id),
  is_active INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER,
  deleted_at INTEGER           -- Soft delete (migration 050)
);
```

**Business Rules**:
- Stock cannot go negative (DB constraint)
- Low stock alerts when `current_stock < minimum_stock`
- Soft delete support

**Relations**:
- Belongs to: `MaterialCategory`, `Supplier`
- Has many: `InventoryTransaction`, `QuoteItem`

---

### 7. Quote (`quotes` table)

**Purpose**: Price quotes for clients before task creation.

**Key Fields**:
```sql
-- src-tauri/migrations/037_quotes.sql
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  task_id TEXT REFERENCES tasks(id), -- Null until converted
  status TEXT CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until INTEGER,
  notes TEXT,
  terms TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  vehicle_plate TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  vehicle_vin TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  created_by TEXT
);
```

**Status Flow**: `draft` → `sent` → (`accepted` | `rejected` | `expired`)

**Business Rules**:
- Accepted quotes can be converted to tasks
- PDF export available
- Line items in `quote_items` table

**Relations**:
- Belongs to: `Client`, `Task` (optional), `User` (creator)
- Has many: `QuoteItem`

---

### 8. CalendarEvent (`calendar_events` table)

**Purpose**: Scheduling and availability management.

**Key Fields**:
```rust
// src-tauri/src/domains/calendar/domain/models/calendar_event.rs (TODO: verify)
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub event_type: EventType,   // task | intervention | meeting | other
    pub start_time: i64,
    pub end_time: i64,
    pub task_id: Option<String>,
    pub technician_id: Option<String>,
    pub is_all_day: bool,
    pub created_at: i64,
    pub updated_at: i64,
}
```

**Relations**:
- Optional: `Task`, `User` (technician)

---

### 9. Photo (`photos` table)

**Purpose**: Image documentation for interventions.

**Key Fields**:
```sql
-- Migration 006_add_step_location_columns.sql adds photo metadata
id TEXT PRIMARY KEY,
intervention_id TEXT,
step_id TEXT,                 -- Optional: step-specific photo
caption TEXT,
file_path TEXT,               -- Local storage path
taken_at INTEGER,
created_at INTEGER
```

**Relations**:
- Belongs to: `Intervention`, `InterventionStep` (optional)

---

### 10. Session (`sessions` table)

**Purpose**: Active user sessions for authentication.

**Key Fields**:
```rust
// src-tauri/src/domains/auth/domain/models/auth.rs (TODO: verify)
pub struct Session {
    pub id: String,              // UUID = session token
    pub user_id: String,
    pub role: UserRole,
    pub created_at: i64,
    pub expires_at: i64,         // 8 hour TTL
    pub last_activity: i64,
}
```

**Business Rules**:
- 8-hour TTL (480 minutes)
- `last_activity` updated on every authenticated request
- Stored in `SessionStore` (in-memory) + `sessions` table

**Relations**:
- Belongs to: `User`

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│    Task     │>────│   Client    │
│  (system)   │     │  (work unit)│     │  (customer) │
└─────────────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │            ┌──────┴──────┐
       │            │ Intervention│
       │            │  (workflow) │
       │            └──────┬──────┘
       │                   │
       │            ┌──────┴──────┐
       └───────────<│Intervention │>────┐
                  │    Step     │     │
                  └─────────────┘     │
                         │            │
                  ┌──────┴──────┐     │
                  │    Photo    │     │
                  └─────────────┘     │
                                      │
┌─────────────┐     ┌─────────────┐   │
│   Material  │<────│  Inventory  │───┘
│  (inventory)│     │ Transaction │
└──────┬──────┘     └─────────────┘
       │
┌──────┴──────┐
│MaterialCategory
└─────────────┘
```

---

## Storage Mapping

| Entity | Table | Soft Delete | Audit Fields |
|--------|-------|-------------|--------------|
| User | `users` | `is_active` | created_at, updated_at |
| Client | `clients` | `deleted_at` | created_at, updated_at, deleted_at |
| Task | `tasks` | `deleted_at` | created_at, updated_at, deleted_at |
| Intervention | `interventions` | No | created_at, updated_at |
| InterventionStep | `intervention_steps` | No | created_at, updated_at |
| Material | `materials` | `deleted_at` | created_at, updated_at, deleted_at |
| Quote | `quotes` | No | created_at, updated_at |
| CalendarEvent | `calendar_events` | No | created_at, updated_at |
| Photo | `photos` | No | created_at |
| Session | `sessions` | No (TTL) | created_at, expires_at |

---

## Domain Rules Summary

### Task Management
1. Status transitions must follow state machine (see `task_state_machine.rs`)
2. Only Admin/Supervisor can change assignment
3. Technician can only modify operational fields
4. Soft delete preserves history

### Intervention Workflow
1. One active intervention per task maximum
2. Steps progress sequentially
3. All steps must complete for intervention completion
4. Photos can be attached at intervention or step level

### Inventory
1. Stock cannot go negative
2. Consumption tracked per intervention/step
3. Low stock alerts trigger at threshold
4. All transactions logged in `inventory_transactions`

### Quotes
1. Valid until date enforced
2. Accepted quotes convertible to tasks
3. PDF generation with template
4. Line items support labor, material, service, discount types

---

## Next Steps

- **Architecture**: See [02_ARCHITECTURE_AND_DATAFLOWS.md](./02_ARCHITECTURE_AND_DATAFLOWS.md)
- **Backend Patterns**: See [04_BACKEND_GUIDE.md](./04_BACKEND_GUIDE.md)
- **Frontend Usage**: See [03_FRONTEND_GUIDE.md](./03_FRONTEND_GUIDE.md)

---

*TODO: Verify model file paths for users and clients domains*
