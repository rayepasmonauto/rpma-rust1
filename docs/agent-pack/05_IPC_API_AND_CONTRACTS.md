# 05. IPC API AND CONTRACTS

## IPC Contract Rules
1. **Response Envelopes**: All commands return an `ApiResponse<T>` or `Result<T, AppError>`.
2. **Authentication**: Most commands require an active session. The `RequestContext` must be extracted in the IPC layer.
3. **Correlation IDs** (ADR-020): Every IPC request from the frontend should include a `correlation_id` to trace logs end-to-end.
4. **Data Transfer Objects (DTOs)**: The domain layer shouldn't leak directly to IPC. Use specific request and response DTO structs.

## Top Core Commands (TODO: Expand to full 30 in code)
- `login(credentials)`: Auth Domain, returns `Token`. Role: None. `frontend/src/lib/ipc/auth.ts` -> `src-tauri/src/domains/auth/ipc/`.
- `create_task(payload)`: Task Domain. Role: Supervisor/Admin.
- `update_task_status(id, status)`: Task Domain. Role: Supervisor/Technician.
- `advance_intervention_step(id, step_data)`: Intervention Domain. Role: Technician.
- `get_calendar_events(filter)`: Calendar Domain. Role: All.
- `add_photo_to_intervention(id, photo)`: Intervention Domain. Role: Technician.

## Type Syncing (`ts-rs`)
To ensure type safety across the IPC boundary, RPMA uses `ts-rs` (ADR-015).
- Rust structs annotated with `#[derive(TS)]` and `#[ts(export)]` will generate TypeScript interfaces.
- The output directory is typically `frontend/src/types/` (or `src-tauri/bindings/`).
- **Command**: Run `npm run types:sync` after changing any IPC-facing Rust struct. If types are out of sync, the frontend build will fail.