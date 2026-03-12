---
title: "Database & Offline-First"
summary: "SQLite with WAL mode for offline-first operation, connection pooling, and performance optimization"
read_when:
* Adding database tables or indexes
* Investigating performance issues
* Understanding transaction behavior
* Configuring connection pool
---

## Overview

The application uses **SQLite with Write-Ahead Logging (WAL)** as the primary data store. All operations work without network connectivity - this is the system of record.

**Related ADRs**: [ADR-001](./adr/001-sqlite-offline-first.md), [ADR-018](./adr/018-dynamic-pool-sizing.md)

## SQLite Configuration

Location: `src-tauri/src/db/connection.rs`

### WAL Mode Pragmas

```sql
PRAGMA journal_mode = WAL;        -- Enable Write-Ahead Logging
PRAGMA synchronous = NORMAL;      -- Balance durability and performance
PRAGMA busy_timeout = 5000;       -- Wait 5s before "database is locked"
PRAGMA wal_autocheckpoint = 1000; -- Checkpoint every 1000 pages
PRAGMA cache_size = 10000;        -- 10,000 page cache
PRAGMA temp_store = MEMORY;       -- Temp tables in memory
PRAGMA foreign_keys = ON;         -- Enforce referential integrity
PRAGMA locking_mode = NORMAL;     -- Allow concurrent access
```

### Key Configuration Choices

| Setting | Value | Purpose |
|---------|-------|---------|
| `journal_mode` | WAL | Concurrent readers with single writer |
| `synchronous` | NORMAL | Reduce disk I/O, maintain durability |
| `busy_timeout` | 5000ms | Prevent "database is locked" errors |
| `wal_autocheckpoint` | 1000 | Balance WAL size vs checkpoint overhead |
| `foreign_keys` | ON | Enforce referential integrity |

## Connection Pool

SQLite is single-writer. Pool size should be kept small.

### Default Configuration

```rust
pub struct PoolConfig {
    pub max_connections: 10,      // SQLite is single-writer; keep pool small
    pub min_idle: Some(2),        // Maintain small idle pool for responsiveness
    pub connection_timeout: 30s,
    pub idle_timeout: Some(600s), // 10 minutes
    pub max_lifetime: Some(3600s),// 60 minutes
}
```

### Pool Initialization

```rust
pub fn initialize_pool(
    db_path: &str,
    encryption_key: &str,
) -> Result<Pool<SqliteConnectionManager>, Box<dyn std::error::Error>> {
    let manager = SqliteConnectionManager::file(db_path)
        .with_flags(OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_NO_MUTEX)  // CRITICAL: allows concurrent access
        .with_init(|conn| {
            conn.execute_batch(/* pragmas */)?;
            Ok(())
        });

    Pool::builder()
        .max_size(config.max_connections)
        .min_idle(config.min_idle)
        .connection_timeout(config.connection_timeout)
        .build(manager)
}
```

## Dynamic Pool Sizing

The pool can adjust based on load.

Location: `src-tauri/src/db/connection.rs`

```rust
pub struct DynamicPoolManager {
    current_config: Mutex<PoolConfig>,
    load_monitor: Arc<LoadMonitor>,
}

impl DynamicPoolManager {
    pub fn adjust_pool_size(&self) -> Option<PoolConfig> {
        // Increase pool if wait times are high
        if self.load_monitor.should_increase_pool() && config.max_connections < 50 {
            let new_max = (config.max_connections as f64 * 1.5).min(50.0) as u32;
            // ...
        }
        // Decrease pool if consistently low load
        else if self.load_monitor.should_decrease_pool() && config.max_connections > 10 {
            let new_max = (config.max_connections as f64 * 0.8).max(10.0) as u32;
            // ...
        }
    }
}
```

## Performance Monitoring

### Query Performance Monitor

```rust
pub struct QueryPerformanceMonitor {
    slow_query_threshold: Duration,
    query_stats: Arc<Mutex<HashMap<String, QueryStats>>>,
}

impl QueryPerformanceMonitor {
    pub fn monitor_query<F, T>(&self, query: &str, operation: F) -> Result<T, rusqlite::Error>
    where F: FnOnce() -> Result<T, rusqlite::Error>
    {
        let start = Instant::now();
        let result = operation();
        let duration = start.elapsed();

        if duration > self.slow_query_threshold {
            warn!("Slow query detected: {} took {:?}", query, duration);
        }
        
        // Record stats...
        result
    }
}
```

### WAL Checkpoint

```rust
pub fn checkpoint_wal(pool: &Pool<SqliteConnectionManager>) -> Result<(), String> {
    let conn = pool.get().map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA wal_checkpoint(PASSIVE); PRAGMA optimize;")
        .map_err(|e| format!("WAL checkpoint failed: {}", e))?;
    Ok(())
}
```

## Streaming Queries

For large result sets, use streaming to avoid memory issues.

Location: `src-tauri/src/db/connection.rs`

```rust
pub trait StreamingQuery<T> {
    fn next_chunk(&mut self, chunk_size: usize) -> Result<Option<Vec<T>>, rusqlite::Error>;
    fn has_more(&self) -> bool;
    fn total_count(&self) -> Option<usize>;
}

pub struct ChunkedQuery<T, F> {
    query: String,
    params: Vec<rusqlite::types::Value>,
    row_mapper: F,
    pool: Pool<SqliteConnectionManager>,
    offset: usize,
    exhausted: bool,
}
```

## Migrations

Migrations are embedded in the binary and run on startup.

Location: `src-tauri/migrations/`

```
src-tauri/migrations/
├── 001_initial_schema.sql
├── 002_add_tasks.sql
├── ...
└── 050_latest_changes.sql
```

### Migration Commands

```bash
# Validate migration system
node scripts/validate-migration-system.js

# Detect schema drift
node scripts/detect-schema-drift.js

# Fresh DB test
npm run backend:migration:fresh-db-test
```

## Offline-First Principles

1. **All data is local**: SQLite is the system of record
2. **No network required**: Full functionality without internet
3. **Sync is optional**: If sync-related features exist, they enqueue work locally
4. **Fast reads**: Sub-millisecond latency for cached queries

## Key Files

| Purpose | Location |
|---------|----------|
| Connection management | `src-tauri/src/db/connection.rs` |
| Database wrapper | `src-tauri/src/db/mod.rs` |
| Migrations | `src-tauri/migrations/` |
| Schema definition | `src-tauri/src/db/schema.sql` |
| Migration tests | `src-tauri/src/tests/migrations/` |
