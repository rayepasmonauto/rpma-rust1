# ADR-007: Logging and Distributed Tracing

## Status
Accepted

## Context
Diagnosing issues in a multi-layered Tauri application requires the ability to trace a single user action from the frontend through the IPC boundary and down to the database layer. Consistent field standards and error sanitization are necessary to maintain security and searchability.

## Decision

### Correlation ID Lifecycle
- Every request is assigned a unique `correlation_id`.
- The frontend `safeInvoke` wrapper generates or reuses this ID and injects it into every IPC payload.
- The backend initializes the `CorrelationContext` at the IPC boundary (`src-tauri/src/shared/ipc/correlation.rs`).
- Backend-generated IDs carry an `ipc-` prefix to distinguish them from client-supplied IDs.

### Structured Field Standard
Every `#[tauri::command]` and tracing span must utilize standardized fields:
- `correlation_id`: Unique request identifier.
- `user_id`: Authenticated user performing the operation.
- `task_id` / `intervention_id`: Contextual resource identifiers.
- `operation`: Human-readable name of the action.
- `error`: Internal error details (for backend logging only).

### Logging Layers and Domains
- **Layers**: Logs are categorized into `Frontend`, `IPC`, `Backend`, and `Database` layers to isolate cross-cutting concerns.
- **Domains**: Functional domains (e.g., `Auth`, `Task`, `Sync`, `System`) provide granular searchability for domain-specific events.

### Error Sanitization
- **Strict Separation**: Internal error details (Database, IO, Network) are logged server-side at the `error!` level with full context.
- **Frontend Safety**: Errors returned to the frontend must be sanitized via `AppError::sanitize_for_frontend()` or similar helpers to prevent the leakage of internal implementation details (e.g., SQL text or file paths).

### Observability and Propagation
- The correlation ID is automatically propagated through `tracing::Span` instrumentation.
- The `ApiResponse` envelope echoes the `correlation_id` back to the frontend for debugging correlation.

## Consequences
- End-to-end tracing is possible across all layers of the stack.
- Security is maintained by preventing internal system details from leaking to the UI.
- Log analysis is standardized across all domains and layers.
