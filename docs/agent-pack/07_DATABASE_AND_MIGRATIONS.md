---
title: "Database and Migrations"
summary: "SQLite configuration, migration system, and data access patterns."
read_when:
  - "Adding new database tables or columns"
  - "Troubleshooting database performance"
  - "Writing SQL migrations"
---

# 07. DATABASE AND MIGRATIONS

RPMA v2 uses SQLite as its primary local data store.

## SQLite Setup

| Setting | Value | Where |
|---|---|---|
| WAL mode | Enabled | `src-tauri/src/db/connection.rs` |
| Foreign keys | `ON` | `src-tauri/src/db/connection.rs` |
| Busy timeout | `5000` ms | `src-tauri/src/db/connection.rs` |
| WAL autocheckpoint | `1000` | `src-tauri/src/db/connection.rs` |
| Journal size limit | Set | `src-tauri/src/db/connection.rs` |

The database file is created under the app data directory as `rpma.db` from `src-tauri/src/main.rs`.

## Migration System

- Migration SQL lives in `src-tauri/migrations/`.
- Files are numbered and embedded into the binary.
- `src-tauri/src/db/migrations/mod.rs` creates or reads `schema_version`, then applies missing migrations on startup.
- `Database::initialize_or_migrate()` is the startup entrypoint.

At the time of this scan, the migration set runs through `064_rules_and_integrations.sql`.

## Schema Files

| File | Purpose |
|---|---|
| `src-tauri/src/db/schema.sql` | Base schema and legacy structures |
| `src-tauri/migrations/*` | Incremental SQL migrations |
| `src-tauri/src/db/migrations/mod.rs` | Migration discovery and application |

## Safe Migration Workflow

1. Add a new numbered SQL file under `src-tauri/migrations/`.
2. Keep the migration idempotent if possible.
3. Run `npm run backend:validate-migrations`.
4. Run `npm run backend:detect-schema-drift`.
5. Run `npm run backend:migration:fresh-db-test`.

## Repository Rule

- All SQLite access should go through repositories in the infrastructure layer.
- Do not query SQLite directly from application or domain code.
- Keep transactions and joins inside repository implementations when possible.

## Common Patterns

| Pattern | What to look for |
|---|---|
| Soft delete | `deleted_at` columns and repository filters |
| Audit fields | `created_at`, `updated_at`, and `*_by` columns |
| Timestamps | Unix milliseconds |
| Sessions | Session rows plus in-memory session cache |
| Legacy queue | `sync_queue` exists in schema, but verify runtime usage before depending on it |

## Troubleshooting

| Issue | Likely fix |
|---|---|
| Database locked | Restart the dev process and check for orphaned app instances |
| Migration failed | Check SQL syntax and numbering |
| Schema drift | Run `npm run backend:detect-schema-drift` |
| Fresh DB test fails | Run `npm run backend:validate-migrations` first, then inspect the migration that diverged |
| WAL checkpoint needed | Use `force_wal_checkpoint` or run a checkpoint pragma |

## Key Commands And Scripts

- `npm run backend:validate-migrations`
- `npm run backend:detect-schema-drift`
- `npm run backend:migration:fresh-db-test`
- `scripts/validate-migration-system.js`
- `scripts/detect-schema-drift.js`

