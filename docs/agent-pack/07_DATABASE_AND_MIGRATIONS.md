---
title: "Database and Migrations"
summary: "SQLite configuration, migration system, and data access patterns."
read_when:
  - "Adding new database tables or columns"
  - "Troubleshooting database performance"
  - "Writing SQL migrations"
---

# 07. DATABASE AND MIGRATIONS

RPMA v2 uses **SQLite** as its primary data store, optimized for reliability and desktop performance.

## SQLite Configuration (**ADR-009**)

| Setting | Value | Purpose |
|---------|-------|---------|
| WAL Mode | Enabled | Concurrent reads and writes |
| Foreign Keys | `ON` | Referential integrity |
| Busy Timeout | 5000ms | Handle locks gracefully |
| Journal Size Limit | Applied | Prevent disk bloat |
| WAL Autocheckpoint | 1000 | Automatic checkpoint |

```rust
// src-tauri/src/db/connection.rs
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA wal_autocheckpoint = 1000;
```

## Database Module

```rust
// src-tauri/src/db/mod.rs
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
    metrics_enabled: bool,
    query_monitor: Arc<QueryPerformanceMonitor>,
    stmt_cache: Arc<PreparedStatementCache>,
    dynamic_pool_manager: Arc<DynamicPoolManager>,
}

pub struct AsyncDatabase {
    // Non-blocking database operations
}

impl Database {
    pub fn new(path: &Path, encryption_key: &str) -> DbResult<Self>;
    pub fn get_connection(&self) -> DbResult<PooledConn>;
    pub fn with_transaction<F, T>(&self, f: F) -> DbResult<T>;
    pub fn get_pool_health(&self) -> PoolHealth;
    pub fn get_performance_stats(&self) -> QueryStatsSummary;
    pub fn health_check(&self) -> DbResult<()>;
}
```

## Migration System (**ADR-010**)

### Location
`src-tauri/migrations/`

### Naming Convention
Numbered SQL files: `NNN_description.sql`

### Current Migrations (002-063)

| Range | Category |
|-------|----------|
| 002-010 | Core schema modifications |
| 011-027 | Feature additions |
| 028-041 | Sessions, auth enhancements |
| 042-049 | Indexes, fixes, quotes |
| 050-058 | Soft deletes, optimization |
| 059-061 | Performance indexes, checklist |
| 062-063 | Task drafts, user preferences |

**Note**: No `001_initial_schema.sql` — schema bootstrapped historically.

### Key Recent Migrations

| Migration | Purpose |
|-----------|---------|
| `057_add_login_attempts_table` | Failed login tracking |
| `058_add_deleted_by_columns` | Track who deleted entities |
| `059_performance_indexes` | Query optimization |
| `060_add_deleted_at_missing_tables` | Soft delete columns |
| `061_task_checklist_items` | Task checklists |
| `062_task_drafts` | Draft task storage |
| `063_user_preferences_calendar` | User calendar preferences |

### Migration Lifecycle

1. **Create**: Add `NNN_description.sql` to `migrations/`
2. **Embed**: Migrations compiled into binary
3. **Apply**: Executed on app startup in order
4. **Verify**: Run `npm run backend:migration:fresh-db-test`

```rust
// src-tauri/src/db/mod.rs
impl Database {
    pub fn initialize_or_migrate(&self) -> DbResult<()> {
        let latest_version = Self::get_latest_migration_version();
        self.migrate(latest_version)
    }
}
```

## Repository Pattern (**ADR-005**)

All database access MUST go through Infrastructure layer repositories.

| Layer | Location |
|-------|----------|
| Trait Definition | `domains/*/infrastructure/` or `shared/repositories/` |
| Implementation | `domains/*/infrastructure/` |

```rust
pub trait TaskRepository: Send + Sync {
    fn find_by_id(&self, id: &str) -> AppResult<Option<Task>>;
    fn save(&self, task: &Task) -> AppResult<()>;
    fn delete(&self, id: &str) -> AppResult<()>;
    fn find_all(&self, filters: TaskFilters) -> AppResult<Vec<Task>>;
}

pub struct SqliteTaskRepository {
    db: Arc<Database>,
}
```

## Database Features

### Connection Pool

```rust
pub struct PoolHealth {
    pub connections_active: u32,
    pub connections_idle: u32,
    pub connections_pending: u32,
    pub avg_wait_time_ms: f64,
    pub max_connections: u32,
    pub utilization_percentage: f64,
}
```

### Prepared Statement Cache

```rust
pub struct PreparedStatementCache {
    // Caches compiled SQL statements for performance
}
```

### Query Performance Monitor

```rust
pub struct QueryPerformanceMonitor {
    // Tracks slow queries (>100ms threshold)
}
```

### Streaming Queries

```rust
pub struct ChunkedQuery<T, F> {
    // For large result sets, streams data in chunks
}

impl Database {
    pub fn execute_streaming_query<T, F>(...) -> DbResult<ChunkedQuery<T, F>>;
}
```

### Async Operations

```rust
impl AsyncDatabase {
    pub async fn execute_async<F, T>(&self, operation: F) -> DbResult<T>;
    pub async fn with_transaction_async<F, T>(&self, operation: F) -> DbResult<T>;
    pub async fn vacuum_async(&self) -> DbResult<()>;
    pub async fn checkpoint_wal_async(&self) -> DbResult<()>;
}
```

## Common Tasks

### Adding a Migration

```bash
# 1. Create migration file
echo "-- Migration: Add new column" > src-tauri/migrations/064_add_column.sql

# 2. Test on fresh DB
npm run backend:migration:fresh-db-test

# 3. Verify schema
node scripts/detect-schema-drift.js
```

### Soft Deletes (**ADR-011**)

```sql
-- Tables include deleted_at column
ALTER TABLE tasks ADD COLUMN deleted_at INTEGER;

-- Repositories filter by default
SELECT * FROM tasks WHERE deleted_at IS NULL;

-- Explicit hard delete (admin only)
UPDATE tasks SET deleted_at = strftime('%s','now') * 1000 WHERE id = ?;
```

### Timestamp Standard (**ADR-012**)

All timestamps stored as **Unix Milliseconds** (BigInt/i64):

```rust
chrono::Utc::now().timestamp_millis()
```

## Database Initialization

```rust
// src-tauri/src/main.rs
fn setup() {
    let db = Database::new(&db_path, &encryption_key)?;
    db.initialize_or_migrate()?;
    
    // Run initial WAL checkpoint
    db.get_connection()?.execute_batch(
        "PRAGMA wal_checkpoint(PASSIVE); PRAGMA optimize;"
    )?;
    
    // Periodic checkpoint (every 60s)
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            let _ = db::checkpoint_wal(db.pool());
        }
    });
}
```

## Constraints

| Constraint | Reason |
|------------|--------|
| No raw SQL in Application/Domain layers | Use repositories |
| Avoid complex joins | Prefer domain logic or simple queries |
| Large BLOBs in filesystem | Store paths in DB, files on disk |
| In-memory DB for tests | WAL mode incompatible with in-memory |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database locked | Restart dev process; check orphaned processes |
| Migration fails | Check SQL syntax; verify NNN sequencing |
| Type mismatch | Ensure Rust structs match DB schema |
| Schema drift detected | Run `node scripts/detect-schema-drift.js` |
| Slow queries | Check `QueryPerformanceMonitor` stats |
| WAL checkpoint needed | Run `PRAGMA wal_checkpoint(FULL)` |

## Key Files

| File | Purpose |
|------|---------|
| `src-tauri/src/db/mod.rs` | Database struct, AsyncDatabase |
| `src-tauri/src/db/connection.rs` | Pool initialization, WAL config |
| `src-tauri/src/db/migrations.rs` | Migration runner |
| `src-tauri/migrations/` | Migration SQL files (002-063) |
| `scripts/detect-schema-drift.js` | Schema drift detection |
| `scripts/validate-migration-system.js` | Migration validation |
| `src-tauri/src/shared/repositories/` | Repository abstractions |