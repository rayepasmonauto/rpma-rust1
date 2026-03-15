# 04. BACKEND GUIDE

The backend is written in **Rust** and managed by **Tauri**. It is located in the `src-tauri/` directory.

## Directory Structure (`src-tauri/src/`)
- `commands/`: System-wide and cross-domain IPC command modules.
- `domains/`: Bounded contexts following the four-layer rule.
  - `[domain]/ipc/`: Command entry points (thin layer).
  - `[domain]/application/`: Use cases and orchestration.
  - `[domain]/domain/`: Pure business rules and entities.
  - `[domain]/infrastructure/`: Repositories and SQL.
- `shared/`: Errors, auth middleware, event bus, and utilities.
- `db/`: Database connection, migrations, and pooling logic.
- `main.rs`: Application entry point and command registration.

## Implementing a New Command
1. **Define the Model**: Create/update the entity in `domain/models/` and ensure it derives `TS` for export.
2. **Infrastructure**: Add repository methods in `infrastructure/` to handle SQL.
3. **Application**: Add a service method in `application/` to coordinate the action and validation.
4. **IPC**: Create a thin handler in `ipc/` that calls `resolve_context!` and the service.
5. **Register**: Add the command to `tauri::generate_handler![]` in `main.rs`.

## Error Handling
- Use the custom `AppError` type defined in `shared/ipc/errors.rs`.
- Return `Result<ApiResponse<T>, AppError>` from all IPC commands.
- Use `?` and `map_err` to propagate and convert errors.

## Authorization & Security
Every IPC command MUST call `resolve_context!` as its first line to ensure the caller is authenticated and has the required role.
```rust
let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
```

## Logging & Tracing
- Use the `tracing` crate for instrumentation.
- Commands should be annotated with `#[tracing::instrument(skip(state))]`.
- Include `correlation_id` in logs to trace requests across the system.
