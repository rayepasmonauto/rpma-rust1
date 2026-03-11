# RPMA v2 - Database and Migrations

> SQLite configuration, migration system, and database operations.

---

## SQLite Configuration

### Database Setup

**Engine**: SQLite 3.x with WAL (Write-Ahead Logging) mode

**Key Features**:
- WAL mode: Concurrent reads during writes
- Foreign keys: Enforced via pragma
- Connection pooling: r2d2_sqlite
- Embedded migrations: No external files needed

**Pragmas** (configured at connection):

```rust
// src-tauri/src/db/connection.rs
const DB_PRAGMAS: &[&str] = &[
    "PRAGMA journal_mode = WAL",
    "PRAGMA foreign_keys = ON",
    "PRAGMA synchronous = NORMAL",
    "PRAGMA temp_store = MEMORY",
    "PRAGMA mmap_size = 30000000000",
    "PRAGMA cache_size = -64000",  // 64MB
    "PRAGMA busy_timeout = 5000",   // 5 seconds
];
```

### Database Path

**Platform-Specific**:
- **Windows**: `%APPDATA%\com.rayepasmonauto.rpma\db.sqlite`
- **macOS**: `~/Library/Application Support/com.rayepasmonauto.rpma/db.sqlite`
- **Linux**: `~/.local/share/com.rayepasmonauto.rpma/db.sqlite`

**Configuration** (via Tauri app config):
```rust
// src-tauri/src/db/connection.rs
pub fn get_db_path() -> PathBuf {
    let app_dirs = AppDirs::new(Some("com.rayepasmonauto.rpma"), true)
        .expect("Failed to get app directories");
    
    app_dirs.data_dir.join("db.sqlite")
}
```

### Connection Pool

```rust
// src-tauri/src/db/mod.rs
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, AppError> {
        let manager = SqliteConnectionManager::file(path);
        let pool = Pool::builder()
            .max_size(10)  // Max connections
            .connection_customizer(Box::new(PragmaCustomizer))
            .build(manager)?;
        
        Ok(Self { pool })
    }
}
```

### Transaction Management

```rust
// Application layer manages transactions
pub async fn begin_transaction(&self) -> Result<Transaction, AppError> {
    let conn = self.pool.get()?;
    let tx = conn.unchecked_transaction()?;
    Ok(Transaction::new(tx))
}

// Usage in service
let tx = self.db.begin_transaction().await?;
// ... perform operations ...
tx.commit().await?;
```

---

## Migration System

### Migration Files Location

```
src-tauri/migrations/
├── 001_initial_schema.sql
├── 002_rename_ppf_zone.sql
├── 003_add_client_stats_triggers.sql
├── ...
└── 056_organization_settings_table.sql
```

**Total**: 56 migration files

### Migration Naming Convention

```
NNN_description.sql
```

- `NNN`: 3-digit sequence number (001, 002, ...)
- `description`: Snake_case description
- Must be unique and sequential

### Migration Structure

```sql
-- Example: 024_add_inventory_management.sql
-- Migration 024: Enhanced inventory management system

-- Table: material_categories
CREATE TABLE IF NOT EXISTS material_categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  parent_id TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by TEXT,
  updated_by TEXT,
  synced INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  
  FOREIGN KEY (parent_id) REFERENCES material_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_material_categories_parent 
  ON material_categories(parent_id);

-- Idempotent data insertion
INSERT OR IGNORE INTO material_categories (id, name, code, ...)
VALUES ('cat_ppf_films', 'PPF Films', 'PPF', ...);
```

### Migration Discovery and Application

```rust
// src-tauri/src/db/migrations/mod.rs
use include_dir::{include_dir, Dir};

static MIGRATIONS_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/migrations");

pub struct MigrationManager {
    db: Database,
}

impl MigrationManager {
    pub async fn run_migrations(&self) -> Result<(), AppError> {
        // 1. Get current schema version
        let current_version = self.get_schema_version().await?;
        
        // 2. Find pending migrations
        let pending = self.get_pending_migrations(current_version).await?;
        
        // 3. Apply in order
        for migration in pending {
            info!("Applying migration {}", migration.version);
            self.apply_migration(&migration).await?;
        }
        
        Ok(())
    }
    
    async fn get_schema_version(&self) -> Result<i32, AppError> {
        // Check if schema_version table exists
        // Return 0 if not (fresh database)
        // Otherwise return max(version)
    }
}
```

### Schema Version Table

```sql
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    description TEXT,
    checksum TEXT  -- SHA256 of migration file
);
```

### Embedded Migrations

Migrations are embedded in binary via `include_dir!`:

```rust
// src-tauri/src/db/migrations/mod.rs
pub fn get_migration(version: i32) -> Option<&'static str> {
    MIGRATIONS_DIR
        .files()
        .find(|f| f.path().starts_with(&format!("{:03}", version)))
        .and_then(|f| f.contents_utf8())
}
```

This ensures:
- ✅ No external file dependencies
- ✅ Consistent migrations across deployments
- ✅ Works offline

---

## Adding a New Migration

### Step-by-Step Guide

#### 1. Create Migration File

```bash
# Create next migration (e.g., 057)
touch src-tauri/migrations/057_add_feature_x.sql
```

#### 2. Write Migration (Idempotent)

```sql
-- Migration 057: Add feature X support

-- Always use IF NOT EXISTS / IF EXISTS
CREATE TABLE IF NOT EXISTS new_feature_table (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Safe column addition
ALTER TABLE existing_table 
ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Safe index creation
CREATE INDEX IF NOT EXISTS idx_new_column 
ON existing_table(new_column);

-- Safe data migration (if needed)
UPDATE existing_table 
SET new_column = 'default_value' 
WHERE new_column IS NULL;
```

#### 3. Key Rules

**Idempotency**: Must be safe to run multiple times

```sql
-- ✅ Good: IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (...);

-- ✅ Good: IF EXISTS for drops
DROP INDEX IF EXISTS idx_old;

-- ✅ Good: OR IGNORE for inserts
INSERT OR IGNORE INTO settings (key, value) VALUES ('version', '1.0');

-- ❌ Bad: Non-idempotent
CREATE TABLE users (...);  -- Fails if exists
```

**Constraints**: Add in separate migration if possible

```sql
-- Migration N: Add column
ALTER TABLE tasks ADD COLUMN priority TEXT;

-- Migration N+1: Add constraint
-- After data is populated
ALTER TABLE tasks ADD CONSTRAINT valid_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
```

#### 4. Test Migration

```bash
# Run migration tests
cd src-tauri && cargo test smoke_migration_harness_full --lib

# Or via npm
npm run backend:migration:fresh-db-test
```

#### 5. Verify Schema

```bash
# Check for drift
node scripts/detect-schema-drift.js
```

---

## Testing Migrations

### Migration Test Harness

```rust
// src-tauri/src/tests/migrations/mod.rs
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_migration_057_adds_feature_table() {
        let db = create_test_db();
        run_migrations(&db).unwrap();
        
        // Verify table exists
        let count: i64 = db.query_row(
            "SELECT COUNT(*) FROM sqlite_master 
             WHERE type='table' AND name='new_feature_table'",
            [],
            |row| row.get(0)
        ).unwrap();
        
        assert_eq!(count, 1);
    }
    
    #[test]
    fn test_migration_is_idempotent() {
        let db = create_test_db();
        
        // Run twice
        run_migrations(&db).unwrap();
        run_migrations(&db).unwrap();
        
        // Should not error
    }
}
```

### Fresh Database Test

```bash
# Tests migrations from empty database
npm run backend:migration:fresh-db-test
```

This test:
1. Creates empty database
2. Runs all migrations
3. Verifies schema integrity
4. Tests basic CRUD operations

---

## Common Migration Failure Modes

### 1. Duplicate Column Addition

**Error**: `duplicate column name: X`

**Cause**: Migration adds column that already exists

**Fix**: Use `IF NOT EXISTS`

```sql
-- ✅ Safe
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TEXT;

-- ❌ Unsafe
ALTER TABLE table_name ADD COLUMN column_name TEXT;
```

### 2. Foreign Key Constraint Failures

**Error**: `FOREIGN KEY constraint failed`

**Cause**: Data references non-existent parent

**Fix**: Ensure referential integrity or use `ON DELETE SET NULL`

```sql
-- ✅ Safe: Allow NULL on delete
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

-- ❌ Risky: Strict constraint
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
```

### 3. Check Constraint Violations

**Error**: `CHECK constraint failed`

**Cause**: Existing data violates new constraint

**Fix**: Migrate data before adding constraint

```sql
-- Migration N: Add column
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';

-- Migration N+1: Populate existing rows
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;

-- Migration N+2: Add constraint
ALTER TABLE tasks ADD CONSTRAINT chk_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
```

### 4. Index Already Exists

**Error**: `index X already exists`

**Fix**: Use `IF NOT EXISTS`

```sql
-- ✅ Safe
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

### 5. Table Already Exists

**Error**: `table X already exists`

**Fix**: Use `IF NOT EXISTS`

```sql
-- ✅ Safe
CREATE TABLE IF NOT EXISTS table_name (...);
```

---

## Troubleshooting

### Check Current Schema Version

```sql
SELECT * FROM schema_version ORDER BY version DESC LIMIT 1;
```

### List All Tables

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

### Check Foreign Keys

```sql
-- Enable FK checking
PRAGMA foreign_keys = ON;

-- Verify integrity
PRAGMA foreign_key_check;
```

### WAL File Cleanup

```bash
# Manual checkpoint (if -wal file grows large)
sqlite3 db.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"
```

### Database Diagnostics

```bash
# Via app or script
npm run tauri dev -- -- --diagnose-database

# Or programmatically
invoke('diagnose_database', {});
```

---

## Core Tables Reference

| Table | Purpose | Soft Delete |
|-------|---------|-------------|
| `users` | System users | `is_active` |
| `sessions` | Active sessions | No (TTL) |
| `clients` | Customers | `deleted_at` |
| `tasks` | Work units | `deleted_at` |
| `interventions` | PPF workflows | No |
| `intervention_steps` | Workflow steps | No |
| `materials` | Inventory items | `deleted_at` |
| `material_categories` | Material taxonomy | No |
| `inventory_transactions` | Stock movements | No |
| `quotes` | Price quotes | No |
| `quote_items` | Quote line items | No |
| `calendar_events` | Scheduling | No |
| `photos` | Documentation images | No |
| `app_settings` | Application config | No |
| `user_settings` | User preferences | No |
| `organizations` | Multi-tenant orgs | No |
| `notifications` | In-app notifications | No |
| `sync_queue` | Pending sync operations | No |
| `schema_version` | Migration tracking | No |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src-tauri/src/db/mod.rs` | Database pool, transactions |
| `src-tauri/src/db/connection.rs` | Connection initialization, pragmas |
| `src-tauri/src/db/migrations/mod.rs` | Migration orchestration |
| `src-tauri/migrations/*.sql` | Migration files (001-056) |
| `scripts/detect-schema-drift.js` | Schema validation |
| `scripts/validate-migration-system.js` | Migration health check |

---

## Next Steps

- **Development Workflow**: See [08_DEV_WORKFLOWS_AND_TOOLING.md](./08_DEV_WORKFLOWS_AND_TOOLING.md)
- **User Flows**: See [09_USER_FLOWS_AND_UX.md](./09_USER_FLOWS_AND_UX.md)

---

*Migration Strategy: See docs/adr/012-database-migration-strategy.md*  
*Connection Pool: See docs/adr/011-database-connection-pool.md*  
*SQLite Config: See docs/adr/014-sqlite-pragma-configuration.md*
