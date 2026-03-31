# 04. BACKEND GUIDE

## Backend Structure
The backend is written in Rust and lives in `src-tauri/`. It acts as the core business logic engine, utilizing a strict 4-layer architecture (ADR-001).

### Key Directories
- `src-tauri/src/domains/<domain>/`: Contains the bounded contexts (`auth`, `tasks`, `interventions`, `users`, etc.).
  - `ipc/`: Tauri command handlers.
  - `application/`: Service orchestrators and use cases.
  - `domain/`: Pure business logic, models, and errors.
  - `infrastructure/`: SQLite Repositories and external adapters.
  - `tests/`: Domain-specific unit tests.
- `src-tauri/src/shared/`: Cross-domain kernel (`context/`, `contracts/`, `error/`, `event_bus/`, `services/`).
- `src-tauri/migrations/`: Numbered SQL migrations (ADR-010).

## Implementing a New Command (End-to-End)
1. **Domain Model**: Define the input request struct (derive `TS` for frontend generation) and output struct in `domain/models.rs`.
2. **Repository**: Implement database interactions in `infrastructure/repository.rs` using `sqlx`. Ensure transaction boundaries are respected.
3. **Application Service**: Add a method in `application/service.rs`. Handle business validation, orchestrate repository calls, and emit domain events if necessary.
4. **IPC Handler**: Create a function in `ipc/commands.rs` decorated with `#[tauri::command]`.
   - **First step**: Use `resolve_context!()` to enforce authentication and extract the current user context (ADR-006).
   - Call the application service.
   - Map errors to the standard `ApiResponse` envelope.

## Error Model (ADR-019)
- All IPC commands return a standardized `Result<T, AppError>`.
- `AppError` is mapped to frontend-friendly codes (e.g., `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`).
- **Never return raw SQL errors** to the frontend. Map database errors to `AppError::Database` or `AppError::NotFound` in the repository layer.

## Validation (ADR-008)
- Implement validation via the Centralized Validation Service (or directly in the application service).
- Protect against invalid states (e.g., trying to complete a cancelled task) in the domain layer.

## Logging and Tracing (ADR-020)
- Use `tracing` crate for logging.
- Pass a `Correlation ID` from the frontend through the IPC boundary to track requests end-to-end.