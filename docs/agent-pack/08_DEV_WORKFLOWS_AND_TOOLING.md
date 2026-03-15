# 08. DEV WORKFLOWS AND TOOLING

This guide covers the commands and scripts used during the development lifecycle.

## Core Development Commands


- **Run App (Dev)**: `npm run dev` (Starts Tauri dev environment with hot reloading).
- **Frontend Only**: `npm run frontend:dev` (Runs Next.js in the browser).
- **Type Sync**: `npm run types:sync` (Exports Rust models to TS). **Run this after changing any Rust struct used in IPC.**

## Verification & Testing

- **Full Backend Suite**: `make test` (Runs all Rust unit and integration tests).
- **Frontend Lint**: `npm run frontend:lint`.
- **Frontend Type Check**: `npm run frontend:type-check`.
- **Frontend Unit Tests**: `cd frontend && npm run test:ci`.
- **Integration Tests (Harness)**: `cd src-tauri && cargo test --test integration`.
* **Backend tests (domain):** `cd src-tauri && cargo test <domain> -- --nocapture`

## Useful Scripts (`scripts/`)
- `validate-migration-system.js`: Ensures migrations are consistent and applied correctly.
- `detect-schema-drift.js`: Compares local DB schema with migrations.
- `backend-architecture-check.js`: Validates the four-layer rule in Rust source.
- `generate-docs-index.js`: Rebuilds the documentation TOC.

## Release Process
- **Build**: Managed by GitHub Actions (`.github/workflows/build.yml`).
- **Artifacts**: Produces installers for Windows (MSI/EXE) and potentially other platforms.
- **Changelog**: Generated based on conventional commit messages.

## "If You Change X, You Must Run Y" Checklist
- **Change Rust IPC Model** → `npm run types:sync`.
- **Add DB Migration** → `npm run backend:migration:fresh-db-test`.
- **Modify IPC Signature** → Update both `src-tauri/src/domains/*/ipc/` and `frontend/src/domains/*/ipc/`.
- **Change Tailwind Config** → The dev server should reload automatically.
