---
title: "Security and RBAC"
summary: "Authentication flow, role-based access control, and data protection rules."
read_when:
  - "Implementing role-gated features"
  - "Reviewing security controls"
  - "Adding new user roles"
---

# 06. SECURITY AND RBAC

RPMA v2 uses a strict identity and access management system (**ADR-007**).

## Roles Hierarchy

| Role | Permissions |
|------|-------------|
| **Admin** | System configuration, user management, full access to all entities, hard delete |
| **Supervisor** | Manage tasks, clients, inventory; create quotes; view reports; restore deleted items |
| **Technician** | Execute assigned interventions; record materials; update task status |
| **Viewer** | Read-only access to dashboards and reports |

## Enforcement: resolve_context! (**ADR-006**)

Authentication and RBAC are enforced at the IPC boundary.

```rust
// Basic authentication (any role)
let ctx = resolve_context!(&state, &correlation_id);

// Role-gated authentication (requires specific role)
let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);

// Multiple roles allowed
let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin, UserRole::Supervisor);

// Pre-authentication context (bootstrap only - NOT for RBAC-enforcing commands)
let ctx = RequestContext::unauthenticated(correlation_id);
```

### RequestContext Structure

```rust
// src-tauri/src/shared/context/request_context.rs
pub struct RequestContext {
    pub auth: AuthContext,
    pub correlation_id: String,
}

impl RequestContext {
    pub fn user_id(&self) -> &str { &self.auth.user_id }
    pub fn role(&self) -> &UserRole { &self.auth.role }
    
    /// Create a minimal context for pre-authentication (bootstrap).
    /// WARNING: Must NEVER be used for RBAC-enforcing commands.
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

## RequestContext Flow

| Stage | Details |
|-------|---------|
| IPC Entry | `resolve_context!` validates session and extracts role |
| Application Layer | `RequestContext` passed to all service methods |
| Domain Layer | Business rules may check `ctx.role()` for conditional logic |

**Constraint**: Raw session tokens are **forbidden** beyond the IPC layer.

## Data Protection

| Aspect | Implementation |
|--------|---------------|
| Database | Local SQLite with optional encryption (RPMA_DB_KEY env var) |
| PII | Scoped access via RBAC rules |
| Input Sanitization | Centralized validation (**ADR-008**) |
| Soft Delete | `deleted_at` prevents accidental data loss (**ADR-011**) |
| Error Sanitization | Database and internal errors sanitized before frontend (**ADR-019**) |
| Session Storage | In-memory `SessionStore` with UUID tokens |
| Password Hashing | bcrypt |
| Failed Login Tracking | `login_attempts` table (migration 057) |

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                                    │
│ Frontend → auth_login(credentials) → IPC Layer                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. VALIDATION                                                               │
│ AuthService.login() → validates against users table                        │
│ Creates session in memory (SessionStore)                                    │
│ Returns session token (UUID)                                                │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SESSION STORAGE                                                          │
│ Frontend stores session state (Tauri manages cookie/header)                 │
│ Session token injected via safeInvoke() for protected commands              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. SUBSEQUENT REQUESTS                                                      │
│ IPC call → safeInvoke injects session_token                                 │
│ Backend → resolve_context!() validates session → creates RequestContext      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Session Management

- Sessions stored in memory via `SessionStore` (`infrastructure/auth/session_store.rs`).
- Session tokens are UUID strings.
- Tokens validated on every IPC call.
- Role extracted from session and included in `RequestContext`.
- Failed login attempts tracked in `login_attempts` table.

### Public Commands

Commands that don't require authentication:

```typescript
// frontend/src/lib/ipc/utils.ts
export const PUBLIC_COMMANDS = new Set([
  // Auth - no session required
  'auth_login', 'auth_create_account', 'auth_validate_session', 'auth_logout',
  
  // Bootstrap - pre-auth setup
  'has_admins', 'bootstrap_first_admin',
  
  // UI window controls - no auth needed
  'ui_window_minimize', 'ui_window_maximize', 'ui_window_close', 'ui_window_get_state',
  
  // Navigation - no auth needed
  'navigation_update', 'navigation_go_back', 'navigation_go_forward',
  'navigation_get_current', 'navigation_add_to_history', 'navigation_refresh',
  
  // Shell / GPS
  'shortcuts_register', 'ui_shell_open_url', 'ui_gps_get_current_position',
  'ui_initiate_customer_call',
  
  // System info / health
  'get_app_info',
]);
```

## Security Constraints

| Constraint | Enforcement |
|------------|-------------|
| No hardcoded secrets | Environment variables (`RPMA_DB_KEY`) or config files |
| No logging passwords/PII | Explicit exclusion in logging |
| Critical transitions validated | Domain layer checks (e.g., Task status changes) |
| Session expiry | Handled by `SessionStore` |
| Failed login tracking | `login_attempts` table (migration 057) |
| CORS | Tauri IPC (no HTTP CORS needed) |

## Authorization Checks by Domain

| Domain | Admin | Supervisor | Technician | Viewer |
|--------|:-----:|:----------:|:----------:|:------:|
| auth (login) | ✓ | ✓ | ✓ | ✓ |
| auth (create account) | ✓ | — | — | — |
| users (CRUD) | ✓ | — | — | — |
| tasks (create) | ✓ | ✓ | — | — |
| tasks (view) | ✓ | ✓ | ✓ (assigned) | ✓ |
| tasks (update) | ✓ | ✓ | ✓ (assigned) | — |
| quotes (create) | ✓ | ✓ | — | — |
| inventory (manage) | ✓ | ✓ | ✓ | — |
| clients (manage) | ✓ | ✓ | — | — |
| trash (restore) | ✓ | ✓ | — | — |
| trash (hard delete) | ✓ | — | — | — |
| settings (app) | ✓ | — | — | — |
| settings (user) | ✓ | ✓ | ✓ | ✓ |
| security audit | ✓ | — | — | — |

## Audit Logging

The system maintains comprehensive audit logs via `AuditService`:

| Event | Logged |
|-------|--------|
| Successful login | `UserLoggedIn` |
| Failed login | `AuthenticationFailed` |
| Logout | `UserLoggedOut` |
| User created | `UserCreated` |
| User updated | `UserUpdated` |
| Security alerts | Tracked in security_events table |

## Key Files

| File | Purpose |
|------|---------|
| `src-tauri/src/shared/context/request_context.rs` | RequestContext definition |
| `src-tauri/src/shared/context/auth_context.rs` | AuthContext definition |
| `src-tauri/src/infrastructure/auth/session_store.rs` | In-memory session storage |
| `src-tauri/src/domains/auth/` | Authentication domain |
| `src-tauri/src/shared/contracts/auth.rs` | UserRole enum |
| `src-tauri/migrations/057_add_login_attempts_table.sql` | Failed login tracking |
| `src-tauri/src/shared/logging/audit_service.rs` | Audit logging service |
| `src-tauri/src/shared/logging/audit_log_handler.rs` | Event bus handler |
| `frontend/src/lib/ipc/utils.ts` | `PUBLIC_COMMANDS` set, session injection |

## Security Events

| Event | Logged |
|-------|--------|
| Successful login | `UserLoggedIn` |
| Failed login | `AuthenticationFailed` |
| Logout | `UserLoggedOut` |
| User created | `UserCreated` |
| User updated | `UserUpdated` |
| Entity restored | `EntityRestored` |
| Entity hard deleted | `EntityHardDeleted` |