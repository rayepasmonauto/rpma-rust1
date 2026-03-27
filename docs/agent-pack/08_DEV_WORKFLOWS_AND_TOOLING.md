---
title: "Development Workflows and Tooling"
summary: "Essential commands, scripts, and verification steps for developers."
read_when:
  - "Setting up the development environment"
  - "Preparing a pull request"
  - "Automating repetitive tasks"
---

# 08. DEV WORKFLOWS AND TOOLING

This repo has a small set of canonical commands for day-to-day development and verification.

## Run And Preview

| Command | Purpose |
|---|---|
| `npm run dev` | Tauri dev with hot reload |
| `npm run dev:types` | Sync types, then start dev |
| `npm run dev:strict` | Sync types and run drift checks before dev |
| `npm run frontend:dev` | Next.js only in the browser |

## Verification

| Command | Purpose |
|---|---|
| `npm run doctor` | Fast health check |
| `npm run doctor -- --fix` | Auto-fix fixable issues, including type sync drift |
| `npm run doctor -- --full` | Full verification, including slower tests |
| `npm run frontend:lint` | Frontend lint |
| `npm run frontend:type-check` | Frontend TypeScript check |
| `cd frontend && npm run test:ci` | Frontend test suite |
| `make test` | Full Rust backend test suite |
| `cd src-tauri && cargo test --test integration` | Integration harness |

## Type Sync And Drift

| Command | Purpose |
|---|---|
| `npm run types:sync` | Export Rust types to TypeScript |
| `npm run types:drift-check` | Verify generated types match the Rust model |
| `scripts/write-types.js` | Writer used by type sync |
| `scripts/record-types-sync.js` | Records the sync stamp |

Run `npm run types:sync` whenever a `#[derive(TS)]` struct or IPC-facing model changes.

## Backend Checks

| Command | Purpose |
|---|---|
| `npm run backend:architecture-check` | Enforce architecture rules |
| `npm run backend:validate-migrations` | Validate migration numbering and structure |
| `npm run backend:detect-schema-drift` | Compare DB schema against migrations |
| `npm run backend:soft-delete-check` | Check soft-delete coverage |
| `npm run backend:ts-rs-coverage` | Check TS export coverage |

## Frontend Checks

| Command | Purpose |
|---|---|
| `npm run frontend:guard` | Lint, type-check, and tests |
| `npm run frontend:lint` | ESLint only |
| `npm run frontend:type-check` | TypeScript only |
| `cd frontend && npm run test:ci` | Jest in CI mode |

## Database And Docs Scripts

| Script | Purpose |
|---|---|
| `scripts/validate-migration-system.js` | Migration system validation |
| `scripts/detect-schema-drift.js` | Schema drift detection |
| `scripts/generate-docs-index.js` | Rebuild docs index |
| `scripts/backend-architecture-check.js` | Architecture check implementation |

## If You Change X, Run Y

| Change | Run |
|---|---|
| Rust `#[derive(TS)]` model | `npm run types:sync` then `npm run frontend:type-check` |
| IPC handler or command registration | `npm run frontend:type-check` and `npm run backend:architecture-check` |
| Database schema | `npm run backend:validate-migrations`, `npm run backend:detect-schema-drift`, `npm run backend:migration:fresh-db-test` |
| Backend business logic | `make test` |
| Frontend feature UI | `npm run frontend:guard` |
| Auth or session code | `npm run doctor -- --full` |

## Minimal Setup

1. Install dependencies with `npm install`.
2. Run `npm run types:sync`.
3. Start the app with `npm run dev:types`.

## Key Files

| File | Purpose |
|---|---|
| `package.json` | Root command surface |
| `frontend/package.json` | Frontend scripts |
| `Makefile` | Rust build/test aliases |
| `src-tauri/Cargo.toml` | Backend dependencies |
| `scripts/` | Repo automation |

