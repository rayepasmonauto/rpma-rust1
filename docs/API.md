# API Documentation

## Overview

This is a **Tauri desktop application** using IPC (Inter-Process Communication) instead of HTTP endpoints. All commands are invoked from the frontend via `invoke()` calls to the Rust backend.

---

## Authentication

### Public Endpoints (No Auth Required)

| Command | Description |
|---------|-------------|
| `auth_login` | User login |
| `auth_create_account` | User signup |
| `auth_validate_session` | Session validation |
| `has_admins` | Check if admins exist |
| `get_onboarding_status` | Organization onboarding status |
| `complete_onboarding` | Complete initial setup |
| `get_app_info` | Application info |
| `health_check` | System health check |

### Authenticated Endpoints

The system uses a **macro-based role enforcement pattern** via `resolve_context!`:

```rust
// Any authenticated user
let ctx = resolve_context!(&state, &correlation_id);

// Role-required authentication
let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
let ctx = resolve_context!(&state, &correlation_id, UserRole::Supervisor);
let ctx = resolve_context!(&state, &correlation_id, UserRole::Technician);
let ctx = resolve_context!(&state, &correlation_id, UserRole::Viewer);
```

**Role Hierarchy**: Admin > Supervisor > Technician > Viewer

---

## Response Format

All commands return `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorInfo | null;
  correlation_id: string | null;
}

interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

## Authentication Context

```typescript
interface RequestContext {
  auth: AuthContext;
  correlation_id: string;
}

interface AuthContext {
  user_id: string;
  role: UserRole;
  session_id: string;
}

type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer';
```

---

## IPC Commands by Domain

---

## AUTH Domain

**File**: `src-tauri/src/domains/auth/ipc/auth.rs`

### auth_login

Authenticate user with credentials.

| Attribute | Value |
|-----------|-------|
| **Auth** | None (Public) |
| **Parameters** | `LoginRequest` |
| **Returns** | `ApiResponse<UserSession>` |

```typescript
interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  correlation_id?: string;
}

interface UserSession {
  id: string;
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: number;
  expires_at: number;
  last_activity: number;
}
```

### auth_create_account

Create new user account.

| Attribute | Value |
|-----------|-------|
| **Auth** | None (Public) |
| **Parameters** | `SignupRequest` |
| **Returns** | `ApiResponse<UserSession>` |

```typescript
interface SignupRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  correlation_id?: string;
}
```

### auth_logout

Terminate current session.

| Attribute | Value |
|-----------|-------|
| **Auth** | None |
| **Parameters** | `correlation_id: string` |
| **Returns** | `ApiResponse<()>` |

### auth_validate_session

Validate existing session token.

| Attribute | Value |
|-----------|-------|
| **Auth** | None |
| **Parameters** | `session_token: string, correlation_id: string` |
| **Returns** | `ApiResponse<UserSession>` |

---

## AUTH SECURITY Domain

**File**: `src-tauri/src/domains/auth/ipc/auth_security.rs`

### get_active_sessions

List all active sessions for current user.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `correlation_id: string` |
| **Returns** | `ApiResponse<Vec<UserSession>>` |

### revoke_session

Revoke a specific session.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `session_id: string, correlation_id: string` |
| **Returns** | `ApiResponse<string>` |

### revoke_all_sessions_except_current

Revoke all other sessions.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `correlation_id: string` |
| **Returns** | `ApiResponse<u32>` |

### update_session_timeout

Update session timeout configuration.

| Attribute | Value |
|-----------|-------|
| **Auth** | Admin |
| **Parameters** | `timeout_minutes: number, correlation_id: string` |
| **Returns** | `ApiResponse<string>` |

### get_session_timeout_config

Get current session timeout settings.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `correlation_id: string` |
| **Returns** | `ApiResponse<SessionTimeoutConfig>` |

---

## USERS Domain

**File**: `src-tauri/src/domains/users/ipc/user.rs`

### user_crud

Unified CRUD operations for users.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `UserCrudRequest` |
| **Returns** | `ApiResponse<UserResponse>` |

```typescript
interface UserCrudRequest {
  action: 'Create' | 'Get' | 'Update' | 'Delete' | 'List';
  user_id?: string;
  data?: CreateUserRequest | UpdateUserRequest;
  page?: number;
  page_size?: number;
  search?: string;
  role?: UserRole;
  correlation_id?: string;
}
```

### has_admins

Check if any admin users exist.

| Attribute | Value |
|-----------|-------|
| **Auth** | None |
| **Parameters** | `correlation_id: string` |
| **Returns** | `ApiResponse<boolean>` |

### bootstrap_first_admin

Create the first admin user (onboarding).

| Attribute | Value |
|-----------|-------|
| **Auth** | None |
| **Parameters** | `BootstrapFirstAdminRequest` |
| **Returns** | `ApiResponse<string>` |

### get_users

List users with pagination and filters.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `page, page_size, search, role, correlation_id` |
| **Returns** | `serde_json::Value` |

### create_user

Create a new user.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `CreateUserRequest, correlation_id` |
| **Returns** | `serde_json::Value` |

### update_user

Update existing user.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `user_id, UpdateUserRequest, correlation_id` |
| **Returns** | `serde_json::Value` |

### update_user_status

Activate/deactivate user.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `user_id, is_active, correlation_id` |
| **Returns** | `()` |

### delete_user

Soft delete user.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `user_id, correlation_id` |
| **Returns** | `()` |

---

## CLIENTS Domain

**File**: `src-tauri/src/domains/clients/client_handler/ipc.rs`

### client_crud

Unified CRUD operations for clients.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated (role-based within) |
| **Parameters** | `ClientCrudRequest` |
| **Returns** | `ApiResponse<ClientResponse>` |

```typescript
interface ClientCrudRequest {
  action: 'Create' | 'Get' | 'GetWithTasks' | 'Update' | 'Delete' | 'List' | 'ListWithTasks' | 'Search' | 'Stats';
  client_id?: string;
  data?: CreateClientRequest | UpdateClientRequest;
  page?: number;
  page_size?: number;
  search?: string;
  correlation_id?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customer_type: 'individual' | 'business';
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country: string;
  company_name?: string;
  contact_person?: string;
  notes?: string;
  tags?: string[];
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  created_at: number;
  updated_at: number;
}
```

---

## TASKS Domain

**File**: `src-tauri/src/domains/tasks/ipc/task/facade.rs`

### task_crud

Unified CRUD operations for tasks.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated (role-based for create/update/delete) |
| **Parameters** | `TaskCrudRequest` |
| **Returns** | `ApiResponse<TaskResponse>` |

```typescript
interface TaskCrudRequest {
  action: 'Create' | 'Get' | 'Update' | 'Delete' | 'List';
  task_id?: string;
  data?: CreateTaskRequest | UpdateTaskRequest;
  page?: number;
  page_size?: number;
  filters?: TaskFilters;
  correlation_id?: string;
}

interface Task {
  id: string;
  task_number: string;
  title: string;
  description?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_make?: string;
  vehicle_year?: string;
  vin?: string;
  status: TaskStatus;
  priority: TaskPriority;
  technician_id?: string;
  client_id?: string;
  scheduled_date?: string;
  started_at?: number;
  completed_at?: number;
  created_at: number;
  updated_at: number;
}

type TaskStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'pending' | 'invalid' | 'archived' | 'failed' | 'overdue' | 'assigned' | 'paused';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### task_transition_status

Transition task to new status.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician+ |
| **Parameters** | `StatusTransitionRequest` |
| **Returns** | `ApiResponse<Task>` |

```typescript
interface StatusTransitionRequest {
  task_id: string;
  new_status: TaskStatus;
  reason?: string;
  correlation_id?: string;
}
```

### add_task_note

Add note to task.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `AddTaskNoteRequest` |
| **Returns** | `ApiResponse<string>` |

### get_task_history

Get task status history.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `GetTaskHistoryRequest` |
| **Returns** | `ApiResponse<Vec<TaskHistory>>` |

### get_tasks_with_clients

Get tasks with embedded client data.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `GetTasksWithClientsRequest` |
| **Returns** | `ApiResponse<TaskListResponse>` |

### get_user_assigned_tasks

Get tasks assigned to specific user.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `GetUserAssignedTasksRequest` |
| **Returns** | `ApiResponse<Vec<Task>>` |

### get_task_statistics

Get aggregated task statistics.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `GetTaskStatisticsRequest` |
| **Returns** | `ApiResponse<TaskStatistics>` |

### export_tasks_csv

Export tasks to CSV.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `ExportTasksCsvRequest` |
| **Returns** | `ApiResponse<string>` |

### import_tasks_bulk

Bulk import tasks.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `ImportTasksBulkRequest` |
| **Returns** | `ApiResponse<BulkImportResponse>` |

---

## INTERVENTIONS Domain

**File**: `src-tauri/src/domains/interventions/ipc/intervention/workflow.rs`

### intervention_start

Start a new intervention.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `StartInterventionRequest` |
| **Returns** | `ApiResponse<Intervention>` |

```typescript
interface StartInterventionRequest {
  task_id: string;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_make?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_vin?: string;
  client_id?: string;
  technician_id?: string;
  intervention_type?: string;
  film_type?: string;
  scheduled_at?: number;
  correlation_id?: string;
}

interface Intervention {
  id: string;
  task_id: string;
  task_number: string;
  status: InterventionStatus;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_make?: string;
  client_id?: string;
  technician_id?: string;
  intervention_type: string;
  current_step: number;
  completion_percentage: number;
  started_at?: number;
  completed_at?: number;
  created_at: number;
}

type InterventionStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
```

### intervention_update

Update intervention details.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `id, data, correlation_id` |
| **Returns** | `ApiResponse<Intervention>` |

### intervention_finalize

Complete an intervention.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `FinalizeInterventionRequest` |
| **Returns** | `ApiResponse<FinalizeInterventionResponse>` |

### intervention_get

Get intervention by ID.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `id, correlation_id` |
| **Returns** | `ApiResponse<Intervention>` |

### intervention_get_progress

Get intervention progress.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `intervention_id, correlation_id` |
| **Returns** | `ApiResponse<InterventionProgress>` |

### intervention_advance_step

Advance to next workflow step.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `intervention_id, step_id, collected_data, photos, notes, issues, correlation_id` |
| **Returns** | `ApiResponse<InterventionStep>` |

---

## QUOTES Domain

**File**: `src-tauri/src/domains/quotes/ipc/quote_crud.rs`

### quote_create

Create a new quote.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteCreateRequest` |
| **Returns** | `ApiResponse<Quote>` |

```typescript
interface QuoteCreateRequest {
  client_id: string;
  task_id?: string;
  description?: string;
  notes?: string;
  terms?: string;
  valid_until?: number;
  vehicle_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  correlation_id?: string;
}

interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  task_id?: string;
  status: QuoteStatus;
  valid_until?: number;
  description?: string;
  subtotal: number;  // cents
  tax_total: number;  // cents
  total: number;  // cents
  vehicle_plate?: string;
  created_at: number;
  updated_at: number;
}

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'changes_requested';
```

### quote_get

Get quote by ID.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteGetRequest` |
| **Returns** | `ApiResponse<Quote>` |

### quote_list

List quotes with pagination.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteListRequest` |
| **Returns** | `ApiResponse<QuoteListResponse>` |

### quote_update

Update quote.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteUpdateRequest` |
| **Returns** | `ApiResponse<Quote>` |

### quote_delete

Soft delete quote.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteDeleteRequest` |
| **Returns** | `ApiResponse<boolean>` |

### quote_mark_sent

Mark quote as sent.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteStatusRequest` |
| **Returns** | `ApiResponse<Quote>` |

### quote_mark_accepted

Mark quote as accepted.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteStatusRequest` |
| **Returns** | `ApiResponse<QuoteAcceptResponse>` |

### quote_mark_rejected

Mark quote as rejected.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteStatusRequest` |
| **Returns** | `ApiResponse<Quote>` |

### quote_item_add

Add line item to quote.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteItemAddRequest` |
| **Returns** | `ApiResponse<Quote>` |

```typescript
interface QuoteItemAddRequest {
  quote_id: string;
  kind: 'labor' | 'material' | 'service' | 'discount';
  label: string;
  description?: string;
  qty: number;
  unit_price: number;  // cents
  tax_rate?: number;
  material_id?: string;
  correlation_id?: string;
}
```

### quote_export_pdf

Export quote to PDF.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteGetRequest` |
| **Returns** | `ApiResponse<QuoteExportResponse>` |

### quote_convert_to_task

Convert accepted quote to task.

| Attribute | Value |
|-----------|-------|
| **Auth** | Any authenticated |
| **Parameters** | `QuoteConvertToTaskRequest` |
| **Returns** | `ApiResponse<ConvertQuoteToTaskResponse>` |

---

## INVENTORY Domain

**File**: `src-tauri/src/domains/inventory/ipc/material/crud.rs`

### material_create

Create new material.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `CreateMaterialRequest` |
| **Returns** | `ApiResponse<Material>` |

```typescript
interface CreateMaterialRequest {
  sku: string;
  name: string;
  description?: string;
  material_type: MaterialType;
  category?: string;
  category_id?: string;
  brand?: string;
  model?: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock?: number;
  maximum_stock?: number;
  unit_cost?: number;
  supplier_id?: string;
  correlation_id?: string;
}

interface Material {
  id: string;
  sku: string;
  name: string;
  description?: string;
  material_type: MaterialType;
  category?: string;
  category_id?: string;
  brand?: string;
  model?: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit_cost?: number;
  supplier_id?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

type MaterialType = 'ppf_film' | 'adhesive' | 'cleaning_solution' | 'tool' | 'consumable';
```

### material_get

Get material by ID.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `id, correlation_id` |
| **Returns** | `ApiResponse<Material | null>` |

### material_list

List materials with filters.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `material_type, category, active_only, limit, offset, correlation_id` |
| **Returns** | `ApiResponse<Vec<Material>>` |

### material_update

Update material.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `id, CreateMaterialRequest, correlation_id` |
| **Returns** | `ApiResponse<Material>` |

### material_delete

Delete material (Supervisor only).

| Attribute | Value |
|-----------|-------|
| **Auth** | Supervisor |
| **Parameters** | `id, correlation_id` |
| **Returns** | `ApiResponse<()>` |

### material_update_stock

Update material stock.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `UpdateStockRequest` |
| **Returns** | `ApiResponse<Material>` |

### material_record_consumption

Record material usage.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `RecordConsumptionRequest` |
| **Returns** | `ApiResponse<MaterialConsumption>` |

### inventory_get_stats

Get inventory statistics.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `correlation_id` |
| **Returns** | `ApiResponse<InventoryStats>` |

### material_get_low_stock_materials

Get materials below minimum stock.

| Attribute | Value |
|-----------|-------|
| **Auth** | Technician |
| **Parameters** | `correlation_id` |
| **Returns** | `ApiResponse<LowStockMaterialsResponse>` |

---

## SETTINGS Domain

### App Settings

**File**: `src-tauri/src/domains/settings/settings_handler.rs`

| Command | Auth | Parameters | Returns |
|---------|------|------------|--------|
| `get_app_settings` | Admin | `correlation_id` | `ApiResponse<AppSettings>` |
| `update_general_settings` | Admin | `GeneralSettings, correlation_id` | `ApiResponse<AppSettings>` |
| `update_security_settings` | Admin | `SecuritySettings, correlation_id` | `ApiResponse<AppSettings>` |
| `update_notification_settings` | Admin | `NotificationSettings, correlation_id` | `ApiResponse<AppSettings>` |
| `update_business_rules` | Admin | `rules, correlation_id` | `ApiResponse<AppSettings>` |

### User Settings

**File**: `src-tauri/src/domains/settings/user_settings_handler.rs`

| Command | Auth | Parameters | Returns |
|---------|------|------------|--------|
| `get_user_settings` | Any | `correlation_id` | `ApiResponse<UserSettings>` |
| `update_user_profile` | Any | `UserProfileSettings, correlation_id` | `ApiResponse<UserSettings>` |
| `update_user_preferences` | Any | `UserPreferences, correlation_id` | `ApiResponse<UserSettings>` |
| `export_user_data` | Any | `correlation_id` | `ApiResponse<string>` |
| `delete_user_account` | Any | `correlation_id` | `ApiResponse<()>` |

### Organization Settings

**File**: `src-tauri/src/domains/settings/organization_handler.rs`

| Command | Auth | Parameters | Returns |
|---------|------|------------|--------|
| `get_onboarding_status` | None | `correlation_id` | `ApiResponse<OnboardingStatus>` |
| `complete_onboarding` | None | `OnboardingData, correlation_id` | `ApiResponse<Organization>` |
| `get_organization` | Viewer | `correlation_id` | `ApiResponse<Organization>` |
| `update_organization` | Admin | `UpdateOrganizationRequest, correlation_id` | `ApiResponse<Organization>` |
| `upload_logo` | Admin | `UploadLogoRequest` | `ApiResponse<Organization>` |

---

## NOTIFICATIONS Domain

**File**: `src-tauri/src/domains/notifications/notification_handler/mod.rs`

| Command | Auth | Parameters | Returns |
|---------|------|------------|--------|
| `message_send` | Any | `SendMessageRequest` | `ApiResponse<Message>` |
| `message_get_list` | Any | `MessageQuery` | `ApiResponse<MessageListResponse>` |
| `message_mark_read` | Any | `message_id, correlation_id` | `ApiResponse<()>` |
| `get_notifications` | Any | `correlation_id` | `ApiResponse<GetNotificationsResponse>` |
| `mark_notification_read` | Any | `id, correlation_id` | `ApiResponse<SuccessResponse>` |
| `mark_all_notifications_read` | Any | `correlation_id` | `ApiResponse<SuccessResponse>` |
| `delete_notification` | Any | `id, correlation_id` | `ApiResponse<SuccessResponse>` |
| `create_notification` | Any | `CreateNotificationRequest` | `ApiResponse<Notification>` |

---

## TRASH Domain

**File**: `src-tauri/src/domains/trash/ipc/mod.rs`

| Command | Auth | Parameters | Returns |
|---------|------|------------|--------|
| `list_trash` | Supervisor | `entity_type, limit, offset, correlation_id` | `Vec<DeletedItem>` |
| `restore_entity` | Supervisor | `entity_type, id, correlation_id` | `()` |
| `hard_delete_entity` | Admin | `entity_type, id, correlation_id` | `()` |
| `empty_trash` | Admin | `entity_type, correlation_id` | `u64` |

```typescript
type EntityType = 'task' | 'client' | 'intervention' | 'quote' | 'material' | 'user';
```

---

## SYSTEM Domain

**File**: `src-tauri/src/commands/system.rs`

| Command | Auth | Parameters | Returns |
|---------|------|------------|--------|
| `get_device_info` | Viewer | `correlation_id` | `DeviceInfo` |
| `diagnose_database` | Admin | `correlation_id` | `serde_json::Value` |
| `health_check` | Viewer | `correlation_id` | `string` |
| `system_health_check` | Any | `correlation_id` | `HealthStatus` |
| `get_app_info` | None | `correlation_id` | `serde_json::Value` |
| `get_database_status` | Viewer | `correlation_id` | `ApiResponse<Value>` |
| `get_database_pool_stats` | Viewer | `correlation_id` | `ApiResponse<Value>` |
| `get_database_pool_health` | Viewer | `correlation_id` | `ApiResponse<PoolHealth>` |
| `vacuum_database` | Admin | `correlation_id` | `ApiResponse<()>` |

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Session expired |
| `AUTH_003` | Insufficient permissions |
| `VALIDATION_001` | Required field missing |
| `VALIDATION_002` | Invalid format |
| `VALIDATION_003` | Value out of range |
| `NOT_FOUND` | Entity not found |
| `CONFLICT` | Duplicate or conflict |
| `INTERNAL` | Internal server error |

---

## Frontend IPC Wrapper Pattern

```typescript
// Example from domains/tasks/ipc/taskIpc.ts
export async function getTask(id: string): Promise<Task> {
  return invoke<Task>('task_crud', {
    request: { action: 'Get', task_id: id }
  });
}

// Example with React Query
export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
    enabled: !!id,
  });
}
```

---

## Gaps and Recommendations

1. **No OpenAPI/Swagger**: IPC commands lack formal schema documentation
2. **Request DTO Inconsistency**: Some commands use `correlation_id` as separate param, others embed in request
3. **Missing Rate Limiting**: No client-side rate limiting for IPC calls
4. **Suggestion**: Generate TypeScript types automatically from Rust (already done via ts-rs, ensure coverage)