---
title: "Security and RBAC"
summary: "Authentication flow, role-based access control, and data protection rules."
read_when:
  - "Implementing role-gated features"
  - "Reviewing security controls"
  - "Adding new user roles"
---

# 06. SECURITY AND RBAC

RPMA v2 uses centralized request-context based authentication and role enforcement.

## Roles

| Role | Typical access |
|---|---|
| `Admin` | Full system access, user management, app settings, hard delete, security audit |
| `Supervisor` | Planning, clients, quotes, calendar, trash recovery, most operational management |
| `Technician` | Assigned work execution, status changes, material consumption, photos |
| `Viewer` | Read-only access to approved dashboards and reports |

## Auth Flow

1. `auth_login` validates credentials.
2. The backend creates a UUID session in the in-memory session store.
3. The frontend keeps the session and `safeInvoke()` injects it for protected commands.
4. Rust handlers call `resolve_context!()` to validate the session and role.
5. `auth_logout` ends the session.

## Current Runtime Notes

- The current build uses UUID-backed sessions, not JWTs.
- `auth_refresh_token` is present as a command surface but currently returns a validation error.
- The repo still contains some legacy 2FA-related schema fields, but there is no clearly wired runtime 2FA flow in the current app path.

## Enforcement Points

| File | Role |
|---|---|
| `src-tauri/src/shared/context/request_context.rs` | RequestContext creation and accessors |
| `src-tauri/src/shared/context/auth_context.rs` | AuthContext payload |
| `src-tauri/src/shared/contracts/auth.rs` | `UserRole` contract |
| `src-tauri/src/domains/*/ipc/*` | Command-level session and role checks |
| `frontend/src/lib/ipc/utils.ts` | Session injection and public command list |

## RequestContext Rules

- Never pass raw session tokens deeper than the IPC boundary.
- Use `RequestContext::unauthenticated(...)` only for bootstrap-style pre-auth flows.
- Keep role checks in Rust so the UI cannot bypass them.

## Data Protection

| Concern | Current approach |
|---|---|
| Local DB | SQLite under the app data directory |
| DB key | `RPMA_DB_KEY` env var is read during startup |
| Passwords | Hashed before storage |
| Soft delete | `deleted_at` fields keep recoverable records out of normal views |
| Error output | `AppError` and `ApiResponse` sanitize backend failures before they reach the UI |
| Audit trail | Security and domain events are recorded through shared audit/logging services |

## Authorization Matrix

| Area | Admin | Supervisor | Technician | Viewer |
|---|---:|---:|---:|---:|
| Auth and bootstrap | Yes | Yes | Yes | Yes |
| Users | Full | No | No | No |
| Tasks | Full | Manage | Assigned work | Read-only |
| Quotes | Full | Manage | No | Read-only |
| Inventory | Full | Manage | Execute consumption | Read-only |
| Clients | Full | Manage | No | Read-only |
| Settings | Full | Limited user settings | Limited user settings | Limited user settings |
| Trash | Hard delete | Restore | No | No |
| Security audit | Yes | No | No | No |

## Key Files

| File | Purpose |
|---|---|
| `src-tauri/src/domains/auth/ipc/auth.rs` | Login, logout, validation |
| `src-tauri/src/domains/auth/ipc/auth_security.rs` | Session management commands |
| `src-tauri/src/domains/auth/ipc/audit_security_ipc.rs` | Security audit commands |
| `src-tauri/src/domains/users/ipc/user.rs` | User bootstrap and admin CRUD |
| `src-tauri/src/shared/logging/*` | Logging and audit support |
| `frontend/src/lib/ipc/utils.ts` | `PUBLIC_COMMANDS` and session injection |

## Security Checks

- Do not log passwords, session tokens, or raw PII.
- Keep sensitive DB access behind repositories and domain services.
- Validate state transitions in the domain layer, not in the UI.
- Review legacy schema fields before assuming a feature exists at runtime.
