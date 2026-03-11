# RPMA v2 - Security and RBAC

> Authentication flow, role-based access control, and security enforcement.

---

## Authentication Flow

### Login Sequence

```
┌──────────────┐         ┌──────────────────────────────────────────┐
│   Frontend   │         │              Backend                      │
└──────┬───────┘         └──────────────┬───────────────────────────┘
       │                                │
       │ POST /auth_login               │
       │ { username, password }         │
       ├───────────────────────────────>│
       │                                │
       │                                │ 1. Lookup user by username
       │                                │ 2. Verify Argon2 password hash
       │                                │ 3. Create session (UUID)
       │                                │ 4. Store in SessionStore + DB
       │                                │
       │         { session_token,       │
       │           user,                │
       │           expires_at }         │
       │<───────────────────────────────┤
       │                                │
       │ 5. Encrypt & store token       │
       │    in AuthSecureStorage        │
       │                                │
```

### Session Token Model

**Structure**: Simple UUID (no JWT)

```rust
// src-tauri/src/domains/auth/domain/models/auth.rs
pub struct Session {
    pub id: String,              // UUID = session_token
    pub user_id: String,
    pub role: UserRole,
    pub created_at: i64,         // Unix epoch ms
    pub expires_at: i64,         // created_at + 8 hours
    pub last_activity: i64,
}
```

**Storage**:
- Backend: In-memory `SessionStore` + `sessions` table
- Frontend: `AuthSecureStorage` (AES-GCM encrypted)

**Lifecycle**:
- Created: On successful login
- Duration: 8 hours (480 minutes)
- Extended: `last_activity` updated on every authenticated request
- Expired: Removed from SessionStore, requires re-login

### Frontend Session Management

```typescript
// frontend/src/lib/secureStorage.ts
class AuthSecureStorage {
  async setSession(session: UserSession): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(session));
    await store.set('auth_session', encrypted);
  }
  
  async getSession(): Promise<UserSession | null> {
    const encrypted = await store.get('auth_session');
    if (!encrypted) return null;
    return JSON.parse(await this.decrypt(encrypted));
  }
  
  async clearSession(): Promise<void> {
    await store.delete('auth_session');
  }
}
```

### Session Validation

```rust
// src-tauri/src/infrastructure/auth/session_store.rs
impl SessionStore {
    pub fn get(&self) -> Option<UserSession> {
        let guard = self.active_session.read();
        
        if let Some(session) = guard.as_ref() {
            let now = now();
            if now > session.expires_at {
                // Session expired
                drop(guard);
                let mut guard = self.active_session.write();
                *guard = None;
                return None;
            }
            return Some(session.clone());
        }
        
        None
    }
}
```

---

## RBAC Matrix

### Role Hierarchy

```
Admin > Supervisor > Technician > Viewer
```

Higher roles inherit all permissions of lower roles.

### Permission Matrix

| Feature | Admin | Supervisor | Technician | Viewer |
|---------|-------|------------|------------|--------|
| **User Management** |
| Create/Edit/Delete Users | ✅ | ❌ | ❌ | ❌ |
| View Users | ✅ | ✅ | ✅ | ✅ |
| **Tasks** |
| Create/Delete Tasks | ✅ | ✅ | ❌ | ❌ |
| Edit All Tasks (admin fields) | ✅ | ✅ | ❌ | ❌ |
| Edit Own Tasks (operational) | ✅ | ✅ | ✅ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ | ❌ |
| View All Tasks | ✅ | ✅ | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ | ✅ | ✅ |
| **Interventions** |
| Start/Complete Interventions | ✅ | ✅ | ✅ | ❌ |
| Delete Interventions | ✅ | ✅ | ❌ | ❌ |
| View Interventions | ✅ | ✅ | ✅ | ✅ |
| **Clients** |
| Create/Edit/Delete Clients | ✅ | ✅ | ❌ | ❌ |
| View Clients | ✅ | ✅ | ✅ | ✅ |
| **Inventory** |
| Add/Edit Materials | ✅ | ✅ | ❌ | ❌ |
| Adjust Stock | ✅ | ✅ | ❌ | ❌ |
| Record Consumption | ✅ | ✅ | ✅ | ❌ |
| View Inventory | ✅ | ✅ | ✅ | ✅ |
| **Calendar** |
| Schedule/Reschedule | ✅ | ✅ | ❌ | ❌ |
| View Calendar | ✅ | ✅ | ✅ | ✅ |
| **Quotes** |
| Create/Edit Quotes | ✅ | ✅ | ❌ | ❌ |
| Convert to Task | ✅ | ✅ | ❌ | ❌ |
| View Quotes | ✅ | ✅ | ✅ | ✅ |
| **Settings** |
| App/System Settings | ✅ | ❌ | ❌ | ❌ |
| Own Profile Settings | ✅ | ✅ | ✅ | ✅ |
| **Reports** |
| All Reports | ✅ | ✅ | ❌ | ❌ |
| View Assigned Reports | ✅ | ✅ | ✅ | ✅ |

### Field-Level Permissions (Tasks)

**Technician can only modify**:
- `status`
- `notes`
- `actual_duration`
- `photos`

**Technician cannot modify**:
- `title`
- `priority`
- `client_id`
- `assigned_to`
- `vehicle_vin`
- `vehicle_plate`
- `scheduled_date`
- `estimated_duration`

---

## Enforcement Mechanisms

### 1. IPC Handler Entry Check

```rust
// src-tauri/src/shared/auth_middleware.rs
#[macro_export]
macro_rules! resolve_context {
    ($app_state:expr, $request:expr) => {{
        let session_token = $request.session_token.as_ref()
            .ok_or_else(|| AppError::Authentication("Missing session token".into()))?;
        
        let session = $app_state.session_store.get()
            .ok_or_else(|| AppError::Authentication("Invalid or expired session".into()))?;
        
        // Update last activity
        $app_state.session_store.touch(&session.id);
        
        RequestContext {
            auth: AuthContext {
                user_id: session.user_id,
                role: session.role,
            },
            correlation_id: $request.correlation_id.clone(),
        }
    }};
    
    // With role check
    ($app_state:expr, $request:expr, $role:expr) => {{
        let ctx = resolve_context!($app_state, $request);
        if ctx.auth.role < $role {
            return Err(AppError::Authorization(
                format!("Requires {} role", $role)
            ));
        }
        ctx
    }};
}
```

### 2. Application Service Authorization

```rust
// src-tauri/src/domains/tasks/application/task_service.rs
impl TaskService {
    pub async fn update_task(
        &self,
        ctx: &RequestContext,
        task_id: String,
        updates: TaskUpdateRequest,
    ) -> Result<Task, AppError> {
        let task = self.repo.get(&task_id).await?;
        
        // Role-based field filtering
        match ctx.auth.role {
            UserRole::Technician => {
                // Technicians can only update operational fields
                self.validate_technician_fields(&updates)?;
                
                // Can only modify their own tasks
                if task.assigned_to != Some(ctx.auth.user_id.clone()) {
                    return Err(AppError::Authorization(
                        "Not assigned to this task".into()
                    ));
                }
            }
            UserRole::Supervisor | UserRole::Admin => {
                // Full access
            }
            _ => return Err(AppError::Authorization("Insufficient permissions".into())),
        }
        
        // Apply updates...
    }
    
    fn validate_technician_fields(&self, updates: &TaskUpdateRequest) -> Result<(), AppError> {
        if updates.title.is_some() || updates.priority.is_some() {
            return Err(AppError::Authorization(
                "Technicians cannot modify admin fields".into()
            ));
        }
        Ok(())
    }
}
```

### 3. AuthGuard Pattern

```rust
// src-tauri/src/shared/auth_middleware.rs
pub struct AuthGuard {
    ctx: RequestContext,
}

impl AuthGuard {
    pub fn require_authenticated(&self) -> Result<&Self, AppError> {
        // Already authenticated if AuthGuard exists
        Ok(self)
    }
    
    pub fn require_role(&self, role: UserRole) -> Result<&Self, AppError> {
        if self.ctx.auth.role < role {
            return Err(AppError::Authorization(
                format!("Requires {} or higher", role)
            ));
        }
        Ok(self)
    }
    
    pub fn require_admin(&self) -> Result<&Self, AppError> {
        self.require_role(UserRole::Admin)
    }
}
```

---

## Data Protection

### Local Database

- **Storage**: Platform-specific app data directory
- **Encryption**: SQLite encryption enabled (TODO: verify implementation)
- **WAL Mode**: Write-Ahead Logging for concurrent access
- **Backup**: Automatic periodic backups

### Secrets Management

**Environment Variables** (via `.env`):
```
DATABASE_ENCRYPTION_KEY=<generated>
SESSION_SECRET=<generated>
```

**Never commit secrets**: `.env` is in `.gitignore`

### Session Security

1. **Token Storage**: AES-GCM encrypted in local storage
2. **Token Transmission**: Included in every protected IPC request
3. **Token Expiration**: 8-hour TTL with idle detection
4. **Token Revocation**: Immediate via `revoke_session` command

### Input Sanitization

```rust
// All user input validated at boundaries
pub fn sanitize_input(input: &str) -> String {
    input
        .trim()
        .replace(['<', '>', '"', '\''], "")
        .chars()
        .take(1000)  // Max length
        .collect()
}
```

---

## Security Audit Scripts

### IPC Authorization Audit

```bash
# Verify all protected commands have RBAC checks
node scripts/ipc-authorization-audit.js

# Output: List of commands missing auth checks
```

### IPC Consistency Check

```bash
# Verify command names match between frontend and backend
node scripts/ipc-consistency-check.js
```

### Security Audit

```bash
# Full security audit
npm run security:audit

# Checks:
# - Command authorization
# - Type safety
# - Secret detection
# - Dependency vulnerabilities
```

---

## Security Checklist for New Commands

Before adding a new IPC command, verify:

- [ ] **Command registration**: Added to `main.rs` `generate_handler!`
- [ ] **Authentication**: Uses `resolve_context!` macro
- [ ] **Authorization**: Checks role permissions
- [ ] **Input validation**: Validates all inputs
- [ ] **Error sanitization**: Returns sanitized errors
- [ ] **Logging**: Has `#[instrument]` attribute
- [ ] **Tests**: Includes permission tests
- [ ] **Frontend wrapper**: Type-safe wrapper in domain IPC

### Example Secure Command

```rust
#[tauri::command]
#[instrument(skip(app_state), fields(user_id = tracing::field::Empty))]
pub async fn delete_task(
    app_state: tauri::State<'_, AppState>,
    request: DeleteTaskRequest,
) -> Result<ApiResponse<()>, String> {
    // 1. Authenticate + basic authz (Supervisor+)
    let ctx = resolve_context!(app_state, request, UserRole::Supervisor);
    Span::current().record("user_id", &ctx.auth.user_id);
    
    // 2. Application-level authorization (ownership check)
    let task = app_state.task_service.get(&ctx, request.task_id).await?;
    
    if task.created_by != ctx.auth.user_id && ctx.auth.role != UserRole::Admin {
        return Ok(ApiResponse::error(
            "AUTHORIZATION_ERROR",
            "Can only delete own tasks or be Admin"
        ));
    }
    
    // 3. Execute
    app_state.task_service.delete(&ctx, request.task_id).await?;
    
    info!(task_id = %request.task_id, "Task deleted");
    
    Ok(ApiResponse::success("Task deleted", ()))
}
```

---

## Common Security Issues

### 1. Missing Auth Check

❌ **Wrong**:
```rust
#[tauri::command]
pub async fn get_sensitive_data() -> Result<Data, String> {
    // No auth check!
    Ok(data)
}
```

✅ **Right**:
```rust
#[tauri::command]
pub async fn get_sensitive_data(
    app_state: State<'_, AppState>,
    request: Request,
) -> Result<ApiResponse<Data>, String> {
    let ctx = resolve_context!(app_state, request);
    // ...
}
```

### 2. Information Leakage in Errors

❌ **Wrong**:
```rust
Err(format!("Database error: {}", db_err))
```

✅ **Right**:
```rust
Err(AppError::Internal("Database error".into()))
// Returns sanitized: { code: "INTERNAL_ERROR", message: "An internal error occurred" }
```

### 3. Missing Field Validation

❌ **Wrong**:
```rust
let task = Task {
    title: request.title,  // No validation
    // ...
};
```

✅ **Right**:
```rust
validate_task_create(&request)?;
let task = Task::new(request)?;
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src-tauri/src/shared/auth_middleware.rs` | `resolve_context!` macro, AuthGuard |
| `src-tauri/src/infrastructure/auth/session_store.rs` | SessionStore implementation |
| `src-tauri/src/domains/auth/domain/models/auth.rs` | UserRole, Session types |
| `frontend/src/lib/secureStorage.ts` | Encrypted session storage |
| `frontend/src/lib/ipc/utils.ts` | `safeInvoke()` with auth |
| `scripts/ipc-authorization-audit.js` | RBAC audit script |

---

## Next Steps

- **Database Security**: See [07_DATABASE_AND_MIGRATIONS.md](./07_DATABASE_AND_MIGRATIONS.md)
- **Development Workflow**: See [08_DEV_WORKFLOWS_AND_TOOLING.md](./08_DEV_WORKFLOWS_AND_TOOLING.md)
- **User Flows**: See [09_USER_FLOWS_AND_UX.md](./09_USER_FLOWS_AND_UX.md)

---

*RBAC Policy: See docs/adr/006-rbac-policy.md*  
*Session Model: See docs/adr/010-session-token-model.md*
