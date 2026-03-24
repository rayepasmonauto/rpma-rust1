---
title: "IPC API and Contracts"
summary: "The contract between Frontend and Backend, type generation, and communication standards."
read_when:
  - "Defining new IPC commands"
  - "Debugging communication issues"
  - "Syncing types between Rust and TS"
---

# 05. IPC API AND CONTRACTS

The IPC layer connects React and Rust via Tauri's `invoke` system.

## Communication Standard

### Response Envelope

All IPC commands return `ApiResponse<T>`:

```rust
// src-tauri/src/shared/ipc/response.rs
#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: Option<String>,       // Human-readable message
    pub error_code: Option<String>,     // Machine-readable error code
    pub data: Option<T>,
    pub error: Option<ApiError>,
    pub correlation_id: Option<String>,
}

pub struct ApiError {
    pub message: String,
    pub code: String,
    pub details: Option<JsonValue>,
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| `AUTH_INVALID` | Authentication failed |
| `AUTH_FORBIDDEN` | Authorization denied |
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Entity not found |
| `DATABASE_ERROR` | Database error (sanitized) |
| `INTERNAL_ERROR` | Internal error (sanitized) |
| `IPC_TIMEOUT` | Request timed out (15s default) |

### Correlation IDs (**ADR-020**)

Every request carries a `correlation_id` for distributed tracing. If not provided by the frontend, the backend generates one.

## Type Synchronization (**ADR-015**)

We use `ts-rs` to export Rust types to TypeScript.

| Step | Command | Output |
|------|---------|--------|
| Annotate | `#[derive(TS)] #[ts(export)]` | Marks type for export |
| Sync | `npm run types:sync` | Generates TypeScript |
| Output | `frontend/src/types/` | **DO NOT EDIT MANUALLY** |

## Command Implementation Pattern

### 1. Rust Command Handler

```rust
// src-tauri/src/domains/tasks/ipc/task/mod.rs
#[tauri::command]
pub async fn task_create(
    state: AppState<'_>,
    request: CreateTaskRequest,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Task>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let service = state.task_service.clone();
    service.create_task(request, ctx).await
}
```

### 2. Frontend Wrapper (**ADR-013**)

```typescript
// frontend/src/domains/tasks/ipc/task.ipc.ts
import { safeInvoke, extractAndValidate } from '@/lib/ipc/utils';
import { IPC_COMMANDS } from '@/lib/ipc/commands';

export const taskIpc = {
  create: async (data: CreateTaskRequest): Promise<Task> => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.TASK_CREATE, {
      request: data
    });
    return extractAndValidate(result, validateTask) as Task;
  },
  // ... other methods
};
```

### 3. Command Registration

```rust
// src-tauri/src/main.rs
.invoke_handler(tauri::generate_handler![
    domains::tasks::ipc::task::task_create,
    domains::tasks::ipc::task::task_get,
    domains::tasks::ipc::task::task_update,
    // ...
])
```

## Command Registry by Domain

### Auth Commands (4)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `auth_login` | User login | Public | `domains::auth::ipc::auth` |
| `auth_create_account` | Account creation | Public | `domains::auth::ipc::auth` |
| `auth_logout` | Session termination | Authenticated | `domains::auth::ipc::auth` |
| `auth_validate_session` | Session check | Authenticated | `domains::auth::ipc::auth` |

### Security Audit Commands (4)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `get_security_metrics` | Security metrics | Admin | `domains::auth::ipc::audit_security_ipc` |
| `get_security_events` | Security events | Admin | `domains::auth::ipc::audit_security_ipc` |
| `get_security_alerts` | Security alerts | Admin | `domains::auth::ipc::audit_security_ipc` |
| `acknowledge_security_alert` | Ack alert | Admin | `domains::auth::ipc::audit_security_ipc` |

### Task Commands (~40)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `task_create` | Create task | Supervisor+ | `domains::tasks::ipc::task` |
| `task_get` | Get task by ID | All | `domains::tasks::ipc::task` |
| `task_update` | Update task | Role-based | `domains::tasks::ipc::task` |
| `task_delete` | Soft delete | Supervisor+ | `domains::tasks::ipc::task` |
| `task_list` | List tasks | All | `domains::tasks::ipc::task` |
| `task_statistics` | Task stats | All | `domains::tasks::ipc::task` |
| `edit_task` | Edit task | Technician+ | `domains::tasks::ipc::task` |
| `task_transition_status` | Status change | Role-based | `domains::tasks::ipc::status` |
| `delay_task` | Delay task | Technician+ | `domains::tasks::ipc::task` |
| `add_task_note` | Add note | Technician+ | `domains::tasks::ipc::task` |
| `export_tasks_csv` | Export CSV | Supervisor+ | `domains::tasks::ipc::task` |
| `import_tasks_bulk` | Bulk import | Supervisor+ | `domains::tasks::ipc::task` |
| `task_checklist_items_get` | Get checklist | All | `domains::tasks::ipc::task` |
| `task_checklist_item_update` | Update item | Technician+ | `domains::tasks::ipc::task` |
| `task_checklist_item_create` | Create item | Technician+ | `domains::tasks::ipc::task` |
| `task_draft_save` | Save draft | All | `domains::tasks::ipc::task` |
| `task_draft_get` | Get draft | All | `domains::tasks::ipc::task` |
| `task_draft_delete` | Delete draft | All | `domains::tasks::ipc::task` |

### Client Commands (11)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `client_crud` | CRUD operations | Role-based | `domains::clients::client_handler` |
| `client_create` | Create client | Supervisor+ | `domains::clients::client_handler` |
| `client_get` | Get client | All | `domains::clients::client_handler` |
| `client_get_with_tasks` | Get with tasks | All | `domains::clients::client_handler` |
| `client_update` | Update client | Supervisor+ | `domains::clients::client_handler` |
| `client_delete` | Soft delete | Admin | `domains::clients::client_handler` |
| `client_list` | List clients | All | `domains::clients::client_handler` |
| `client_list_with_tasks` | List with tasks | All | `domains::clients::client_handler` |
| `client_search` | Search clients | All | `domains::clients::client_handler` |
| `client_get_stats` | Client stats | All | `domains::clients::client_handler` |

### Intervention Commands (~20)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `intervention_start` | Start intervention | Technician | `domains::interventions::ipc` |
| `intervention_get` | Get intervention | All | `domains::interventions::ipc` |
| `intervention_update` | Update intervention | Technician+ | `domains::interventions::ipc` |
| `intervention_delete` | Delete intervention | Supervisor+ | `domains::interventions::ipc` |
| `intervention_finalize` | Finalize intervention | Technician | `domains::interventions::ipc` |
| `intervention_advance_step` | Advance step | Technician | `domains::interventions::ipc` |
| `intervention_get_active_by_task` | Get active | All | `domains::interventions::ipc` |
| `intervention_get_latest_by_task` | Get latest | All | `domains::interventions::ipc` |
| `intervention_get_progress` | Get progress | All | `domains::interventions::ipc` |
| `intervention_save_step_progress` | Save progress | Technician | `domains::interventions::ipc` |
| `intervention_get_step` | Get step | All | `domains::interventions::ipc` |

### Inventory Commands (~25)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `material_create` | Create material | Supervisor+ | `domains::inventory::ipc::material` |
| `material_get` | Get material | All | `domains::inventory::ipc::material` |
| `material_get_by_sku` | Get by SKU | All | `domains::inventory::ipc::material` |
| `material_list` | List materials | All | `domains::inventory::ipc::material` |
| `material_update` | Update material | Supervisor+ | `domains::inventory::ipc::material` |
| `material_delete` | Delete material | Admin | `domains::inventory::ipc::material` |
| `material_update_stock` | Adjust stock | Technician+ | `domains::inventory::ipc::material` |
| `material_record_consumption` | Record usage | Technician | `domains::inventory::ipc::material` |
| `inventory_get_dashboard_data` | Dashboard data | All | `domains::inventory::ipc::material` |
| `material_get_low_stock_materials` | Low stock | All | `domains::inventory::ipc::material` |
| `material_get_expired_materials` | Expired | All | `domains::inventory::ipc::material` |

### Quote Commands (~25)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `quote_create` | Create quote | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_get` | Get quote | All | `domains::quotes::ipc::quote` |
| `quote_get_stats` | Quote stats | All | `domains::quotes::ipc::quote` |
| `quote_list` | List quotes | All | `domains::quotes::ipc::quote` |
| `quote_update` | Update quote | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_delete` | Delete quote | Admin | `domains::quotes::ipc::quote` |
| `quote_mark_accepted` | Accept quote | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_mark_rejected` | Reject quote | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_mark_sent` | Mark sent | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_mark_expired` | Mark expired | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_mark_changes_requested` | Request changes | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_reopen` | Reopen quote | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_duplicate` | Duplicate quote | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_convert_to_task` | Convert to task | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_export_pdf` | Export PDF | All | `domains::quotes::ipc::quote` |
| `quote_item_add` / `quote_item_update` / `quote_item_delete` | Line items | Supervisor+ | `domains::quotes::ipc::quote` |
| `quote_attachments_get` / `quote_attachment_*` | Attachments | All | `domains::quotes::ipc::quote` |

### User Commands (8)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `user_crud` | CRUD operations | Admin | `domains::users::ipc::user` |
| `get_users` | List users | Admin | `domains::users::ipc::user` |
| `create_user` | Create user | Admin | `domains::users::ipc::user` |
| `update_user` | Update user | Admin | `domains::users::ipc::user` |
| `update_user_status` | Update status | Admin | `domains::users::ipc::user` |
| `delete_user` | Delete user | Admin | `domains::users::ipc::user` |
| `bootstrap_first_admin` | Initial admin | Public | `domains::users::ipc::user` |
| `has_admins` | Check admins | Public | `domains::users::ipc::user` |

### Settings Commands (~25)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `get_app_settings` | Get settings | Admin | `domains::settings` |
| `update_general_settings` | Update general | Admin | `domains::settings` |
| `update_security_settings` | Update security | Admin | `domains::settings` |
| `update_business_rules` | Update business | Admin | `domains::settings` |
| `update_security_policies` | Update policies | Admin | `domains::settings` |
| `get_user_settings` | User preferences | Authenticated | `domains::settings` |
| `update_user_profile` | Update profile | Authenticated | `domains::settings` |
| `update_user_preferences` | Update prefs | Authenticated | `domains::settings` |
| `change_user_password` | Change password | Authenticated | `domains::settings` |
| `upload_user_avatar` | Upload avatar | Authenticated | `domains::settings` |
| `export_user_data` | Export data | Authenticated | `domains::settings` |
| `delete_user_account` | Delete account | Authenticated | `domains::settings` |

### Organization Commands (7)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `get_onboarding_status` | Onboarding status | Public | `domains::settings` |
| `complete_onboarding` | Complete setup | Admin | `domains::settings` |
| `get_organization` | Get organization | Authenticated | `domains::settings` |
| `update_organization` | Update org | Admin | `domains::settings` |
| `upload_logo` | Upload logo | Admin | `domains::settings` |
| `get_organization_settings` | Org settings | Authenticated | `domains::settings` |
| `update_organization_settings` | Update org settings | Admin | `domains::settings` |

### Calendar Commands (10)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `get_events` | List events | All | `domains::calendar::calendar_handler` |
| `get_event_by_id` | Get event | All | `domains::calendar::calendar_handler` |
| `create_event` | Create event | Supervisor+ | `domains::calendar::calendar_handler` |
| `update_event` | Update event | Supervisor+ | `domains::calendar::calendar_handler` |
| `delete_event` | Delete event | Supervisor+ | `domains::calendar::calendar_handler` |
| `get_events_for_technician` | Events for tech | All | `domains::calendar::calendar_handler` |
| `get_events_for_task` | Events for task | All | `domains::calendar::calendar_handler` |
| `calendar_get_tasks` | Get tasks for calendar | All | `domains::calendar::calendar_handler` |
| `calendar_check_conflicts` | Check conflicts | All | `domains::calendar::calendar_handler` |
| `calendar_schedule_task` | Schedule task | Supervisor+ | `domains::calendar::calendar_handler` |

### Notification Commands (~15)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `get_notifications` | List notifications | Authenticated | `domains::notifications::notification_handler` |
| `mark_notification_read` | Mark read | Authenticated | `domains::notifications::notification_handler` |
| `mark_all_notifications_read` | Mark all read | Authenticated | `domains::notifications::notification_handler` |
| `delete_notification` | Delete notification | Authenticated | `domains::notifications::notification_handler` |
| `create_notification` | Create notification | Admin | `domains::notifications::notification_handler` |
| `send_notification` | Send notification | Admin | `domains::notifications::notification_handler` |
| `message_send` | Send message | Authenticated | `domains::notifications::notification_handler` |
| `message_get_list` | Get messages | Authenticated | `domains::notifications::notification_handler` |
| `message_mark_read` | Mark read | Authenticated | `domains::notifications::notification_handler` |
| `message_get_templates` | Get templates | Authenticated | `domains::notifications::notification_handler` |
| `message_get_preferences` | Get preferences | Authenticated | `domains::notifications::notification_handler` |
| `message_update_preferences` | Update prefs | Authenticated | `domains::notifications::notification_handler` |

### Document / Photo Commands (7)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `document_store_photo` | Store photo | Technician | `domains::documents::photo_handler` |
| `document_get_photos` | Get photos | All | `domains::documents::photo_handler` |
| `document_get_photo` | Get single photo | All | `domains::documents::photo_handler` |
| `document_delete_photo` | Delete photo | Technician | `domains::documents::photo_handler` |
| `document_get_photo_data` | Get photo data | All | `domains::documents::photo_handler` |
| `document_update_photo_metadata` | Update metadata | Technician | `domains::documents::photo_handler` |
| `export_intervention_report` | Export report | All | `domains::documents::photo_handler` |

### Report Commands (5)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `reports_get_capabilities` | Get capabilities | All | `domains::documents::report_handler` |
| `report_generate` | Generate report | All | `domains::documents::report_handler` |
| `report_get` | Get report | All | `domains::documents::report_handler` |
| `report_get_by_intervention` | Get by intervention | All | `domains::documents::report_handler` |
| `report_list` | List reports | All | `domains::documents::report_handler` |

### Trash Commands (4)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `list_trash` | List deleted | Supervisor+ | `domains::trash::ipc` |
| `restore_entity` | Restore entity | Supervisor+ | `domains::trash::ipc` |
| `hard_delete_entity` | Permanent delete | Admin | `domains::trash::ipc` |
| `empty_trash` | Empty all trash | Admin | `domains::trash::ipc` |

### System Commands (~12)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `health_check` | Health check | Public | `commands::system` |
| `system_health_check` | System health | Authenticated | `commands::system` |
| `diagnose_database` | DB diagnostics | Admin | `commands::system` |
| `get_database_stats` | DB stats | Admin | `commands::system` |
| `get_app_info` | App info | Public | `commands::system` |
| `get_device_info` | Device info | Authenticated | `commands::system` |
| `vacuum_database` | Vacuum DB | Admin | `commands::system` |
| `force_wal_checkpoint` | Force checkpoint | Admin | `commands::system` |

### UI Commands (~12)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `ui_window_minimize` | Minimize window | Public | `commands::ui` |
| `ui_window_maximize` | Maximize window | Public | `commands::ui` |
| `ui_window_close` | Close window | Public | `commands::ui` |
| `ui_window_get_state` | Get window state | Public | `commands::ui` |
| `ui_window_set_always_on_top` | Set always on top | Public | `commands::ui` |
| `ui_shell_open_url` | Open URL | Authenticated | `commands::ui` |
| `ui_gps_get_current_position` | Get GPS | Authenticated | `commands::ui` |
| `ui_initiate_customer_call` | Initiate call | Authenticated | `commands::ui` |
| `get_recent_activities` | Recent activities | Authenticated | `commands::ui` |
| `dashboard_get_stats` | Dashboard stats | Authenticated | `commands::ui` |
| `get_entity_counts` | Entity counts | Authenticated | `commands::ui` |

### Navigation Commands (6)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `navigation_update` | Update navigation | Public | `commands::navigation` |
| `navigation_add_to_history` | Add to history | Public | `commands::navigation` |
| `navigation_go_back` | Go back | Public | `commands::navigation` |
| `navigation_go_forward` | Go forward | Public | `commands::navigation` |
| `navigation_get_current` | Get current | Public | `commands::navigation` |
| `navigation_refresh` | Refresh | Public | `commands::navigation` |

### Global Search (1)

| Command | Purpose | Permissions | Rust Path |
|---------|---------|-------------|-----------|
| `global_search` | Cross-domain search | Authenticated | `commands::navigation` |

## Adding a New IPC Command

1. **Define types** in `domains/*/domain/models/` with `#[derive(TS)]`
2. **Create handler** in `domains/*/ipc/`
3. **Register** in `src-tauri/src/main.rs`
4. **Run** `npm run types:sync`
5. **Add command string** to `frontend/src/lib/ipc/commands.ts`
6. **Create wrapper** in `frontend/src/domains/*/ipc/`
7. **Create React Query hook** in `frontend/src/domains/*/api/`