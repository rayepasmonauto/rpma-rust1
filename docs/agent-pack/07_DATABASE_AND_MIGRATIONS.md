# 07. DATABASE AND MIGRATIONS

## SQLite Configuration
- **Database Path**: Typically stored in the OS-specific application data directory (resolved by Tauri at runtime).
- **WAL Mode** (ADR-009): Write-Ahead Logging is enabled via pragmas on connection to allow concurrent reads and prevent locking issues.
- **Soft Deletes** (ADR-011): Records are rarely hard-deleted. They are marked with a `deleted_at` timestamp. Queries must filter out `deleted_at IS NOT NULL`.

## Migration Mechanism (ADR-010)
- RPMA uses numbered SQL migrations located in `src-tauri/migrations/` (e.g., `001_initial_schema.sql`, `002_add_users.sql`).
- Migrations are applied automatically on application startup by the database bootstrap logic (`src-tauri/src/db/`).
- A `schema_version` or `migrations` table tracks applied migrations.

## Adding a Migration Safely
1. Create a new SQL file in `src-tauri/migrations/` following the numbering convention (e.g., `XXX_description.sql`).
2. Write raw SQLite SQL. Avoid complex logic; keep schemas declarative.
3. Test locally by running the app and inspecting the database state.
4. Run `node scripts/validate-migration-system.js` or `npm run doctor` to ensure no schema drift.

## Troubleshooting
- **Migration Failed on Startup**: Check the Rust console logs. Often caused by syntax errors in SQLite or attempting to alter tables in an unsupported way (SQLite has limited `ALTER TABLE` support).
- **Locked Database**: Usually means a transaction was started but not committed/rolled back, or WAL mode wasn't applied correctly.