# 06. SECURITY AND RBAC

## Authentication Flow
- RPMA uses a standard session token or JWT-based authentication via the `RequestContext` pattern (ADR-006).
- **Login**: Frontend sends credentials via the `login` IPC command. The backend verifies them and issues a token.
- **Enforcement**: Every protected IPC command starts with the `resolve_context!()` macro (or similar logic) to validate the active session and extract user roles.

## RBAC Matrix (ADR-007)
The system implements a Role-Based Access Control hierarchy:
- **Admin**: Full access. Can manage users, global settings, and system configurations.
- **Supervisor**: Can create tasks, assign work, manage clients, and view all interventions.
- **Technician**: Can execute assigned interventions, update their own tasks, and upload photos. Cannot modify system configurations or assign work to others.
- **Viewer** (Optional): Read-only access to dashboards and reports.

## Data Protection
- **Local DB**: SQLite is stored locally on the desktop. Sensitive configurations (like API keys if present) must be encrypted or stored securely in the system keychain, not plaintext in the SQLite DB.
- **Audit Logging**: Important actions (task deletion, intervention completion) generate audit events (via the Event Bus) ensuring accountability.
- **Secrets**: Never commit secrets or `.env` files.