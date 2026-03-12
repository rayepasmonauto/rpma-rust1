---
title: "Authentication & RBAC"
summary: "Session-based authentication with role-based access control enforced at the IPC layer"
read_when:
* Adding new IPC commands
* Implementing permission checks
* Understanding role hierarchy
* Debugging auth issues
---

## Overview

Authentication uses in-memory sessions with RBAC enforced at the IPC layer via the `resolve_context!` macro. Services never see session tokens.

**Related ADRs**: [ADR-004](./adr/004-session-auth-rbac.md)

## Session Management

Sessions are stored in memory, not persisted.

Location: `src-tauri/src/infrastructure/auth/session_store.rs`

```rust
pub struct SessionStore {
    session: RwLock<Option<UserSession>>,
}

impl SessionStore {
    pub fn set(&self, session: UserSession) { ... }
    pub fn clear(&self) { ... }
    pub fn get(&self) -> AppResult<UserSession> {
        // Validates expiration
        if session.is_expired() {
            self.clear();
            return Err(AppError::Authentication("Session expired".to_string()));
        }
        Ok(session)
    }
}
```

### Session Characteristics

- **Memory-Only**: Lost on app restart (users must re-login)
- **Single Device**: No multi-device session sharing
- **Expiration**: Sessions expire requiring re-authentication

## Role Hierarchy

Location: `src-tauri/src/shared/contracts/auth.rs`

```rust
pub enum UserRole {
    Admin,      // Full access to everything
    Manager,    // Team management, reports, most operations
    Technician, // Task execution, interventions, basic operations
    Viewer,     // Read-only access
}
```

### Permission Levels

| Role | Capabilities |
|------|--------------|
| **Admin** | All operations, user management, system settings, database operations |
| **Manager** | Task assignment, reports, team oversight, most CRUD operations |
| **Technician** | Task execution, intervention workflow, inventory consumption |
| **Viewer** | Read-only access to tasks, clients, reports |

## IPC Layer Enforcement

All authentication and authorization happens at the IPC layer using the `resolve_context!` macro.

Location: `src-tauri/src/shared/context/session_resolver.rs`

### resolve_context! Macro

```rust
#[macro_export]
macro_rules! resolve_context {
    // Authenticate any logged-in user
    ($state:expr, $correlation_id:expr) => {
        $crate::shared::context::session_resolver::resolve_request_context(
            $state, None, $correlation_id,
        )?
    };
    
    // Authenticate with minimum role requirement
    ($state:expr, $correlation_id:expr, $required_role:expr) => {
        $crate::shared::context::session_resolver::resolve_request_context(
            $state, Some($required_role), $correlation_id,
        )?
    };
}
```

### Usage in Commands

```rust
#[tauri::command]
pub async fn vacuum_database(
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<()>, AppError> {
    // Admin-only operation
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    
    // ... perform operation with ctx
}

#[tauri::command]
pub async fn list_tasks(
    state: AppState<'_>,
    correlation_id: Option<String>,
    filters: TaskQuery,
) -> Result<ApiResponse<Vec<Task>>, AppError> {
    // Any authenticated user
    let ctx = resolve_context!(&state, &correlation_id);
    
    // ... list tasks
}
```

### Resolution Process

```rust
pub fn resolve_request_context(
    app: &AppContext,
    required_role: Option<UserRole>,
    correlation_id: &Option<String>,
) -> AppResult<RequestContext> {
    // 1. Validate session exists and isn't expired
    let session = app.session_store.get()?;
    
    // 2. RBAC gate - check role if required
    if let Some(required) = required_role {
        if !AuthMiddleware::has_permission(&session.role, required) {
            return Err(AppError::Authorization("Insufficient permissions".into()));
        }
    }
    
    // 3. Set up correlation context for tracing
    let corr_id = init_correlation_context(correlation_id, Some(&session.user_id));
    
    // 4. Build request context
    Ok(RequestContext::new(AuthContext::from_session(&session), corr_id))
}
```

## Critical Rule

> **No service or repository may ever see a session token.**

The `RequestContext` is passed downstream, not the raw session. This ensures:
- Single enforcement point
- No auth bypass possible
- Clear audit trail

## Permission Middleware

Location: `src-tauri/src/shared/auth_middleware.rs`

```rust
pub fn has_permission(user_role: &UserRole, required_role: &UserRole) -> bool {
    matches!(
        (user_role, required_role),
        (UserRole::Admin, _) |
        (_, UserRole::Viewer) |
        (UserRole::Manager, UserRole::Manager | UserRole::Technician) |
        (UserRole::Technician, UserRole::Technician)
    )
}
```

## Frontend Session

The frontend stores session tokens and injects them into IPC calls.

Location: `frontend/src/shared/contracts/session.ts`

```typescript
export async function getSessionToken(): Promise<string | null> {
  // Returns current session token or null
}
```

Session injection happens automatically in `safeInvoke`:

```typescript
// frontend/src/lib/ipc/utils.ts
if (!PUBLIC_COMMANDS.has(command)) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    throw new Error("Authentication required");
  }
  argsWithCorrelation.session_token = sessionToken;
}
```

## Public Commands

These commands don't require authentication:

```typescript
export const PUBLIC_COMMANDS = new Set([
  'auth_login',
  'auth_create_account',
  'has_admins',
  'bootstrap_first_admin',
  'get_app_info',
  // ... UI window controls
]);
```

## Audit Logging

All auth decisions are logged with correlation IDs.

Location: `src-tauri/src/shared/logging/audit_service.rs`

```rust
pub struct AuditService;

impl AuditService {
    pub async fn log_event(
        &self,
        event_type: AuditEventType,
        user_id: &str,
        action: &str,
        result: ActionResult,
        details: Option<&str>,
    ) { ... }
}
```

## Key Files

| Purpose | Location |
|---------|----------|
| Session store | `src-tauri/src/infrastructure/auth/session_store.rs` |
| Session resolver | `src-tauri/src/shared/context/session_resolver.rs` |
| Role definitions | `src-tauri/src/shared/contracts/auth.rs` |
| Permission checks | `src-tauri/src/shared/auth_middleware.rs` |
| Audit logging | `src-tauri/src/shared/logging/audit_service.rs` |
| Frontend session | `frontend/src/shared/contracts/session.ts` |
