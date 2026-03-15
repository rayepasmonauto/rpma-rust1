# 07. DATABASE AND MIGRATIONS

RPMA v2 uses an embedded **SQLite** database, optimized for high performance and reliability.

## SQLite Configuration
- **WAL Mode**: Write-Ahead Logging is enabled for improved concurrency (ADR-009).
- **PRAGMAs**: Optimized with `foreign_keys = ON`, `journal_size_limit`, and `busy_timeout`.
- **Connection Pooling**: Managed by `r2d2` or a similar pooler in the backend infrastructure.
- **Path**: The database file (`rpma.db`) is stored in the application data directory.

## Migrations (ADR-010)
Migrations are handled as numbered SQL files in `src-tauri/migrations/`.
- **Discovery**: The backend automatically detects and applies missing migrations on startup.
- **Versioning**: The `schema_version` table tracks the current state of the database.
- **Constraints**: Migrations must be idempotent and should include `IF NOT EXISTS` where appropriate.

## Adding a Migration
1. **Create File**: Add a new `.sql` file in `src-tauri/migrations/` (e.g., `015_add_notes_to_tasks.sql`).
2. **Write SQL**: Include both `UP` logic (standard SQL).
3. **Test**: Run `npm run backend:migration:fresh-db-test` to ensure the migration applies cleanly to a fresh DB.
4. **Validate**: Run existing integration tests to ensure no regressions.

## Database Maintenance
- **Vacuum**: Can be triggered manually via `vacuum_database` or scheduled periodically.
- **Checkpoints**: WAL checkpoints are run periodically to prevent log file bloat.
- **Integrity**: `PRAGMA integrity_check` is run during system diagnostics.

## Troubleshooting
- **Migration Failure**: Check `tauri.log` for SQL syntax errors.
- **Locked Database**: Ensure no other process is holding a long-running transaction (though WAL mode mitigates this).
- **Schema Drift**: Use `node scripts/detect-schema-drift.js` to compare the actual DB schema against the source of truth.
