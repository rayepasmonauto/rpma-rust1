# 08. DEV WORKFLOWS AND TOOLING

## Core Commands
Always use the commands specified in `package.json` and the root `Makefile`.
- **Run App (Dev)**: `npm run dev` (Starts Tauri dev environment with hot reloading).
- **Run App (Dev, with type sync)**: `npm run dev:types` (runs `types:sync` then starts Tauri).
- **Frontend Only**: `npm run frontend:dev` (Runs Next.js in the browser).
- **Test (Backend)**: `make test` or `cargo test`.
- **Test (Frontend)**: `npm run frontend:test`.

## The Doctor Command
The project includes a comprehensive health check: `npm run doctor`.
- Use this **before declaring any task complete**.
- It runs type checking, linting, architecture validation, and schema drift checks.
- Add `--serial` for sequential execution (safer on Windows) and `--fix` to auto-fix issues like out-of-sync types.

## Important Scripts (`scripts/`)
- `scripts/backend-architecture-check.js`: Validates the 4-layer rule in Rust source.
- `scripts/detect-schema-drift.js`: Compares DB schema against migrations.
- `scripts/scaffold-domain.ts`: Generates boilerplate for a new bounded context. Use this instead of manual creation.

## "If you change X, you must run Y" Checklist
- Change an IPC Rust struct (`#[derive(TS)]`) -> **Run `npm run types:sync`**.
- Add a new database table -> **Create a migration and run app to apply**.
- Modify frontend UI -> **Run `npm run frontend:lint` and `npm run frontend:type-check`**.
- Change domain logic -> **Run `cargo check` and `make test`**.