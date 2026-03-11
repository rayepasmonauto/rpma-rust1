# RPMA v2 - IPC API and Contracts

> Complete reference for IPC commands, contracts, and type synchronization.

---

## IPC Contract Rules

### Request Structure

Every protected command receives:

```typescript
interface BaseRequest {
  session_token: string;      // UUID from AuthSecureStorage
  correlation_id: string;     // UUID for request tracing
}

// Example with payload
interface CreateTaskRequest extends BaseRequest {
  operation: 'create';
  data: {
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    client_id: string;
    // ...
  };
}
```

### Response Envelope

All responses use `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Error response example
{
  success: false,
  message: "Validation failed",
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [
      { field: "title", message: "Title is required" }
    ]
  }
}
```

### Compressed Responses

Large payloads use `CompressedApiResponse`:

```typescript
// backend: src-tauri/src/commands/ipc_optimization.rs
interface CompressedApiResponse<T> {
  compressed: true;
  encoding: 'gzip' | 'deflate';
  data_base64: string;  // Compressed + base64 encoded
}
```

---

## Command Classification

### Public Commands (No Auth Required)

```typescript
// frontend/src/lib/ipc/client.ts
const PUBLIC_COMMANDS = new Set([
  'auth_login',
  'auth_create_account',
  'bootstrap_first_admin',
  'has_admins',
  'get_app_info',
  'health_check',
]);
```

### Protected Commands (Require Session)

All other commands require valid `session_token`.

### Not Implemented Commands

```typescript
const NOT_IMPLEMENTED_COMMANDS = new Set([
  // Features planned but not yet built
  'auth_setup_2fa',
  'auth_verify_2fa',
  // ...
]);
```

---

## Top 30 Most Important Commands

### Auth & Users (6 commands)

| # | Command | Purpose | Parameters | Permission | Rust Path | Frontend Path |
|---|---------|---------|------------|------------|-----------|---------------|
| 1 | `auth_login` | Authenticate user | username, password | Public | `src-tauri/src/domains/auth/ipc/auth.rs` | `domains/auth/ipc/auth.ipc.ts` |
| 2 | `auth_create_account` | Create first admin | username, password, email | Public (first only) | `src-tauri/src/domains/auth/ipc/auth.rs` | `domains/auth/ipc/auth.ipc.ts` |
| 3 | `auth_validate_session` | Check session validity | session_token | Protected | `src-tauri/src/domains/auth/ipc/auth.rs` | `domains/auth/ipc/auth.ipc.ts` |
| 4 | `user_crud` | User CRUD operations | operation, data | Admin | `src-tauri/src/domains/users/ipc/user.rs` | `domains/users/ipc/users.ipc.ts` |
| 5 | `create_user` | Create new user | user data | Admin | `src-tauri/src/domains/users/ipc/user.rs` | `domains/users/ipc/users.ipc.ts` |
| 6 | `update_user` | Update user | id, updates | Admin / Self | `src-tauri/src/domains/users/ipc/user.rs` | `domains/users/ipc/users.ipc.ts` |

### Clients (2 commands)

| # | Command | Purpose | Parameters | Permission | Rust Path | Frontend Path |
|---|---------|---------|------------|------------|-----------|---------------|
| 7 | `client_crud` | Client CRUD | operation, data | Protected | `src-tauri/src/domains/clients/ipc/client.rs` | `domains/clients/ipc/clients.ipc.ts` |
| 8 | `get_client_statistics` | Get client stats | client_id | Protected | `src-tauri/src/domains/clients/ipc/client.rs` | `domains/clients/ipc/clients.ipc.ts` |

### Tasks (8 commands)

| # | Command | Purpose | Parameters | Permission | Rust Path | Frontend Path |
|---|---------|---------|------------|------------|-----------|---------------|
| 9 | `task_crud` | Task CRUD | operation, data | Protected | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 10 | `edit_task` | Update task | id, updates | Role-based | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 11 | `task_transition_status` | Change status | task_id, new_status | Role-based | `src-tauri/src/domains/tasks/ipc/status.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 12 | `add_task_note` | Add note | task_id, note | Protected | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 13 | `send_task_message` | Send message | task_id, message | Protected | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 14 | `delay_task` | Reschedule | task_id, new_date | Supervisor+ | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 15 | `export_tasks_csv` | Export tasks | query | Protected | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |
| 16 | `get_task_history` | Task audit log | task_id | Protected | `src-tauri/src/domains/tasks/ipc/task.rs` | `domains/tasks/ipc/tasks.ipc.ts` |

### Interventions (6 commands)

| # | Command | Purpose | Parameters | Permission | Rust Path | Frontend Path |
|---|---------|---------|------------|------------|-----------|---------------|
| 17 | `intervention_start` | Start workflow | task_id, type | Protected | `src-tauri/src/domains/interventions/ipc/intervention.rs` | `domains/interventions/ipc/interventions.ipc.ts` |
| 18 | `intervention_advance_step` | Complete step | intervention_id, step_id | Assigned Tech | `src-tauri/src/domains/interventions/ipc/intervention.rs` | `domains/interventions/ipc/interventions.ipc.ts` |
| 19 | `intervention_save_step_progress` | Save progress | step_id, progress | Assigned Tech | `src-tauri/src/domains/interventions/ipc/intervention.rs` | `domains/interventions/ipc/interventions.ipc.ts` |
| 20 | `intervention_finalize` | Complete intervention | intervention_id | Assigned Tech | `src-tauri/src/domains/interventions/ipc/intervention.rs` | `domains/interventions/ipc/interventions.ipc.ts` |
| 21 | `intervention_get_active_by_task` | Get active | task_id | Protected | `src-tauri/src/domains/interventions/ipc/intervention.rs` | `domains/interventions/ipc/interventions.ipc.ts` |
| 22 | `intervention_get_progress` | Get progress | intervention_id | Protected | `src-tauri/src/domains/interventions/ipc/intervention.rs` | `domains/interventions/ipc/interventions.ipc.ts` |

### Inventory (4 commands)

| # | Command | Purpose | Parameters | Permission | Rust Path | Frontend Path |
|---|---------|---------|------------|------------|-----------|---------------|
| 23 | `material_create` | Add material | material data | Supervisor+ | `src-tauri/src/domains/inventory/ipc/material.rs` | `domains/inventory/ipc/materials.ipc.ts` |
| 24 | `material_update_stock` | Update stock | material_id, quantity, operation | Supervisor+ | `src-tauri/src/domains/inventory/ipc/material.rs` | `domains/inventory/ipc/materials.ipc.ts` |
| 25 | `material_record_consumption` | Use material | material_id, quantity, intervention_id | Technician+ | `src-tauri/src/domains/inventory/ipc/material.rs` | `domains/inventory/ipc/materials.ipc.ts` |
| 26 | `inventory_get_dashboard_data` | Stock dashboard | — | Protected | `src-tauri/src/domains/inventory/ipc/material.rs` | `domains/inventory/ipc/materials.ipc.ts` |

### Calendar & Quotes (4 commands)

| # | Command | Purpose | Parameters | Permission | Rust Path | Frontend Path |
|---|---------|---------|------------|------------|-----------|---------------|
| 27 | `create_event` | Schedule event | event data | Supervisor+ | `src-tauri/src/domains/calendar/ipc/calendar.rs` | `domains/calendar/ipc/calendar.ts` |
| 28 | `calendar_schedule_task` | Schedule task | task_id, time_range | Supervisor+ | `src-tauri/src/domains/calendar/ipc/calendar.rs` | `domains/calendar/ipc/calendar.ts` |
| 29 | `quote_create` | Create quote | quote data | Supervisor+ | `src-tauri/src/domains/quotes/ipc/quote.rs` | `domains/quotes/ipc/quotes.ipc.ts` |
| 30 | `quote_convert_to_task` | Convert quote | quote_id | Supervisor+ | `src-tauri/src/domains/quotes/ipc/quote.rs` | `domains/quotes/ipc/quotes.ipc.ts` |

---

## Complete Command Registry

All commands registered in `src-tauri/src/main.rs:70-324`:

### System Commands
- `health_check` — System health status
- `diagnose_database` — DB diagnostics
- `get_database_stats` — DB statistics
- `get_app_info` — App version, build info
- `get_device_info` — Hardware info
- `get_database_pool_health` — Connection pool status
- `vacuum_database` — Optimize DB

### Auth Commands
- `auth_login`
- `auth_create_account`
- `auth_logout`
- `auth_validate_session`

### User Commands
- `user_crud` — Generic CRUD
- `bootstrap_first_admin`
- `has_admins`
- `get_users`
- `create_user`
- `update_user`
- `update_user_status`
- `delete_user`

### Client Commands
- `client_crud` — Generic CRUD

### Task Commands
- `task_crud` — Generic CRUD
- `edit_task`
- `add_task_note`
- `send_task_message`
- `delay_task`
- `report_task_issue`
- `export_tasks_csv`
- `import_tasks_bulk`
- `check_task_assignment`
- `check_task_availability`
- `get_task_history`
- `validate_task_assignment_change`
- `task_transition_status`
- `task_get_status_distribution`

### Intervention Commands
- `intervention_workflow` — Generic workflow ops
- `intervention_progress` — Progress tracking
- `intervention_management` — Generic management
- `intervention_start`
- `intervention_get`
- `intervention_get_active_by_task`
- `intervention_get_latest_by_task`
- `intervention_update`
- `intervention_delete`
- `intervention_finalize`
- `intervention_advance_step`
- `intervention_save_step_progress`
- `intervention_get_progress`
- `intervention_get_step`

### Inventory Commands
- `material_create`
- `material_get`
- `material_get_by_sku`
- `material_list`
- `material_update`
- `material_delete`
- `material_update_stock`
- `material_adjust_stock`
- `material_record_consumption`
- `material_get_consumption_history`
- `material_get_intervention_consumption`
- `material_get_intervention_summary`
- `material_create_inventory_transaction`
- `material_get_transaction_history`
- `material_create_category`
- `material_list_categories`
- `material_create_supplier`
- `material_list_suppliers`
- `material_get_stats`
- `material_get_low_stock`
- `material_get_expired`
- `material_get_low_stock_materials`
- `material_get_expired_materials`
- `material_get_inventory_movement_summary`
- `inventory_get_stats`
- `inventory_get_dashboard_data`

### Calendar Commands
- `get_events`
- `get_event_by_id`
- `create_event`
- `update_event`
- `delete_event`
- `get_events_for_technician`
- `get_events_for_task`
- `calendar_get_tasks`
- `calendar_check_conflicts`
- `calendar_schedule_task`

### Quote Commands
- `quote_create`
- `quote_get`
- `quote_list`
- `quote_update`
- `quote_delete`
- `quote_item_add`
- `quote_item_update`
- `quote_item_delete`
- `quote_mark_sent`
- `quote_mark_accepted`
- `quote_mark_rejected`
- `quote_mark_expired`
- `quote_duplicate`
- `quote_export_pdf`
- `quote_attachments_get`
- `quote_attachment_create`
- `quote_attachment_update`
- `quote_attachment_delete`
- `quote_mark_changes_requested`
- `quote_reopen`
- `quote_attachment_open`
- `quote_convert_to_task`

### Document Commands
- `document_store_photo`
- `document_get_photos`
- `document_get_photo`
- `document_delete_photo`
- `document_get_photo_data`
- `document_update_photo_metadata`
- `export_intervention_report`
- `save_intervention_report`

### Report Commands
- `reports_get_capabilities`
- `report_generate`
- `report_get`
- `report_get_by_intervention`
- `report_list`

### Settings Commands
- `get_app_settings`
- `update_general_settings`
- `update_security_settings`
- `update_notification_settings`
- `update_business_rules`
- `update_security_policies`
- `update_integrations`
- `update_performance_configs`
- `update_business_hours`
- `get_user_settings`
- `update_user_profile`
- `update_user_preferences`
- `update_user_security`
- `update_user_performance`
- `update_user_accessibility`
- `update_user_notifications`
- `change_user_password`
- `export_user_data`
- `delete_user_account`
- `get_data_consent`
- `update_data_consent`
- `upload_user_avatar`

### Organization Commands
- `get_onboarding_status`
- `complete_onboarding`
- `get_organization`
- `update_organization`
- `upload_logo`
- `get_organization_settings`
- `update_organization_settings`

### Notification Commands
- `initialize_notification_service`
- `send_notification`
- `test_notification_config`
- `get_notification_status`
- `get_notifications`
- `mark_notification_read`
- `mark_all_notifications_read`
- `delete_notification`
- `create_notification`
- `message_send`
- `message_get_list`
- `message_mark_read`
- `message_get_templates`
- `message_get_preferences`

### Audit/Security Commands
- `get_security_metrics`
- `get_active_sessions`
- `revoke_session`

### Sync Commands
- `sync_enqueue`
- `sync_now`
- `sync_get_status`

---

## Type Synchronization

### Rust → TypeScript Pipeline

```
┌─────────────────────────────────────────────┐
│  1. Rust models derive TS                   │
│     #[derive(TS)]                           │
│     #[ts(export)]                           │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  2. export-types binary                     │
│     cd src-tauri && cargo run               │
│     --features export-types                 │
│     --bin export-types                      │
└──────────────┬──────────────────────────────┘
               │ JSON output
┌──────────────▼──────────────────────────────┐
│  3. write-types.js                          │
│     Formats TypeScript                      │
│     Writes to frontend/src/types/           │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  4. Generated TypeScript types              │
│     frontend/src/types/                     │
└─────────────────────────────────────────────┘
```

### Marking Types for Export

```rust
// src-tauri/src/domains/tasks/domain/models/task.rs
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]  // ← Required for TypeScript generation
pub struct Task {
    pub id: String,
    pub title: String,
    pub status: TaskStatus,
    // ...
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TaskStatus {
    Draft,
    Scheduled,
    InProgress,
    Completed,
    // ...
}
```

### Running Type Sync

```bash
# Standard sync
npm run types:sync

# Watch mode (during development)
npm run types:watch

# Drift check (CI)
npm run types:drift-check
```

### Where Types Are Generated

```
frontend/src/types/
├── index.ts           # Main exports
├── models.ts          # Entity models (Task, Client, etc.)
├── requests.ts        # Request DTOs
├── responses.ts       # Response DTOs
├── auth.ts            # Auth-specific types
├── calendar.ts        # Calendar types
├── settings.ts        # Settings types
└── ...
```

### Critical Rule

**NEVER** manually edit files in `frontend/src/types/`. They are auto-generated and will be overwritten.

---

## Validation Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| IPC Consistency Check | Verify command names match | `node scripts/ipc-consistency-check.js` |
| IPC Production Gate | Security audit before release | `node scripts/ipc-production-gate.js` |
| Type Drift Check | Verify types match Rust | `npm run types:drift-check` |
| CI Type Check | Full type validation | `npm run ci:validate` |

---

## Common Patterns

### CRUD Command Pattern

```rust
// Generic CRUD handler
#[tauri::command]
#[instrument(skip(app_state))]
pub async fn task_crud(
    app_state: tauri::State<'_, AppState>,
    request: TaskCrudRequest,
) -> Result<ApiResponse<TaskResponse>, String> {
    let ctx = resolve_context!(app_state, request);
    
    match request.operation {
        CrudOperation::Create => {
            let task = app_state.task_service.create(&ctx, request.data).await?;
            Ok(ApiResponse::success("Task created", TaskResponse::from(task)))
        }
        CrudOperation::Read => {
            let task = app_state.task_service.get(&ctx, request.id).await?;
            Ok(ApiResponse::success("Task retrieved", TaskResponse::from(task)))
        }
        CrudOperation::Update => {
            let task = app_state.task_service.update(&ctx, request.id, request.data).await?;
            Ok(ApiResponse::success("Task updated", TaskResponse::from(task)))
        }
        CrudOperation::Delete => {
            app_state.task_service.delete(&ctx, request.id).await?;
            Ok(ApiResponse::success("Task deleted", ()))
        }
    }
}
```

### Request with Pagination

```typescript
// Frontend
interface PaginatedRequest {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  total_pages: number;
}
```

---

## Next Steps

- **Security Model**: See [06_SECURITY_AND_RBAC.md](./06_SECURITY_AND_RBAC.md)
- **Database Guide**: See [07_DATABASE_AND_MIGRATIONS.md](./07_DATABASE_AND_MIGRATIONS.md)
- **Frontend Usage**: See [03_FRONTEND_GUIDE.md](./03_FRONTEND_GUIDE.md)

---

*IPC Architecture: See docs/adr/005-ipc-mapping.md*
