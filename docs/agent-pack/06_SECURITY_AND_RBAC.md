# 06. SECURITY AND RBAC

Security in RPMA v2 is built around a centralized **Role-Based Access Control (RBAC)** system enforced at the IPC boundary.

## Roles Hierarchy (ADR-007)
- **Admin**: Full access to all data, settings, system diagnostics, and user management.
- **Supervisor**: Can manage tasks, clients, and quotes. Cannot access system settings or audit logs.
- **Technician**: Can manage their own assigned tasks and execute interventions.
- **Viewer**: Read-only access to specific dashboards and reports.

## Enforcement Mechanism
Every backend command uses the `resolve_context!` macro to verify the user's role before proceeding:
```rust
// Only Admins can run this
let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);

// Technicians and above can run this
let ctx = resolve_context!(&state, &correlation_id, UserRole::Technician);
```
If the check fails, an `AppError::Unauthorized` is returned, which the frontend handles by showing a permission error.

## Authentication Flow
1. **Login**: User provides credentials via `auth_login`.
2. **Session**: On success, a `UserSession` is created in memory (backend state).
3. **Validation**: Subsequent requests include a session identifier (managed by Tauri's internal state).
4. **Expiry**: Sessions expire after a period of inactivity (configurable in security settings).

## Data Protection
- **Local DB Encryption**: The SQLite database can be encrypted using a key provided via the `RPMA_DB_KEY` environment variable.
- **Input Validation**: All data entering the backend is validated against domain-specific rules (ADR-008).
- **Audit Logs**: Critical actions (deletions, role changes) are logged with the acting user's ID and a timestamp.

## Security Practices
- **No Raw Tokens**: Services and Repositories never see raw session tokens; they receive a `RequestContext`.
- **Newtypes**: Intent-revealing types like `UserId` and `TaskId` are used to prevent accidental ID swapping (IDOR prevention).
- **Thin IPC**: The IPC layer does no business logic; it only handles auth and delegation.
