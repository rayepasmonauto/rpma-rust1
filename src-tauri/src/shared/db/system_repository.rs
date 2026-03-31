//! Repository for system-level database diagnostics.
//!
//! Isolates all SQL / PRAGMA access for the system diagnostics subsystem
//! following the bounded context architecture rule that SQL must live
//! in infrastructure / db layers only.

/// ADR-005: Repository Pattern
use serde_json::json;

/// Repository responsible for system-level database diagnostics.
pub struct SystemRepository;

impl SystemRepository {
    /// Get lightweight counters for dashboard entities.
    pub fn get_entity_counts(
        pool: &r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
    ) -> Result<(i64, i64, i64), String> {
        let conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let tasks: i64 = conn
            .query_row("SELECT COUNT(*) FROM tasks", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count tasks: {}", e))?;

        let clients: i64 = conn
            .query_row("SELECT COUNT(*) FROM clients", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count clients: {}", e))?;

        let interventions: i64 = conn
            .query_row("SELECT COUNT(*) FROM interventions", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count interventions: {}", e))?;

        Ok((tasks, clients, interventions))
    }

    /// Diagnose database health and return diagnostic information.
    pub fn diagnose_database(
        pool: &r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
    ) -> Result<serde_json::Value, String> {
        let conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let journal_mode: String = conn
            .query_row("PRAGMA journal_mode;", [], |row| row.get(0))
            .map_err(|e| format!("Failed to check journal mode: {}", e))?;

        let wal_checkpoint: (i64, i64) = conn
            .query_row("PRAGMA wal_checkpoint;", [], |row| {
                Ok((row.get(0)?, row.get(1)?))
            })
            .map_err(|e| format!("Failed to checkpoint: {}", e))?;

        let busy_timeout: i64 = conn
            .query_row("PRAGMA busy_timeout;", [], |row| row.get(0))
            .map_err(|e| format!("Failed to check busy_timeout: {}", e))?;

        let integrity: String = conn
            .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
            .map_err(|e| format!("Failed integrity check: {}", e))?;

        let task_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM tasks;", [], |row| row.get(0))
            .unwrap_or(0);

        let client_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM clients;", [], |row| row.get(0))
            .unwrap_or(0);

        Ok(json!({
            "journal_mode": journal_mode,
            "wal_checkpoint": {
                "busy": wal_checkpoint.0,
                "log": wal_checkpoint.1
            },
            "busy_timeout_ms": busy_timeout,
            "integrity": integrity,
            "table_counts": {
                "tasks": task_count,
                "clients": client_count
            },
            "pool_state": {
                "active": pool.state().connections,
                "idle": pool.state().idle_connections,
            }
        }))
    }

    /// Force a WAL checkpoint restart.
    pub fn force_wal_checkpoint(
        pool: &r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
    ) -> Result<String, String> {
        let conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        conn.execute_batch("PRAGMA wal_checkpoint(RESTART);")
            .map_err(|e| format!("Checkpoint failed: {}", e))?;

        Ok("WAL checkpoint completed successfully".to_string())
    }

    /// Perform a basic health check on the database.
    pub fn health_check(
        pool: &r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
    ) -> Result<String, String> {
        let conn = pool
            .get()
            .map_err(|e| format!("Database connection failed: {}", e))?;

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .map_err(|e| format!("Database query failed: {}", e))?;

        if count == 0 {
            return Err("No users found in database".to_string());
        }

        Ok("OK".to_string())
    }

    /// Get database statistics including file size and table counts.
    pub fn get_database_stats(
        pool: &r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
    ) -> Result<serde_json::Value, String> {
        let conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let db_path: String = conn
            .query_row("PRAGMA database_list;", [], |row| {
                let _seq: i64 = row.get(0)?;
                let _name: String = row.get(1)?;
                let path: String = row.get(2)?;
                Ok(path)
            })
            .map_err(|e| format!("Failed to get database path: {}", e))?;

        let size_bytes = match std::fs::metadata(&db_path) {
            Ok(metadata) => metadata.len() as i64,
            Err(e) => {
                tracing::warn!("Could not determine database file size: {}", e);
                0
            }
        };

        let users_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap_or(0);

        let tasks_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM tasks", [], |row| row.get(0))
            .unwrap_or(0);

        let clients_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM clients", [], |row| row.get(0))
            .unwrap_or(0);

        let interventions_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM interventions", [], |row| row.get(0))
            .unwrap_or(0);

        Ok(json!({
            "size_bytes": size_bytes,
            "tables": {
                "users": users_count,
                "tasks": tasks_count,
                "clients": clients_count,
                "interventions": interventions_count
            },
            "database_path": db_path
        }))
    }

    // ── Data retention helpers ────────────────────────────────────────────────

    /// Verify that `path` starts with the 16-byte SQLite magic header.
    ///
    /// Rejects empty files, non-SQLite files, and unreadable paths before any
    /// copy operation takes place.
    pub fn validate_sqlite_file(path: &std::path::Path) -> Result<(), String> {
        if !path.exists() {
            return Err(format!(
                "Backup file not found: {}",
                path.display()
            ));
        }

        let mut f = std::fs::File::open(path)
            .map_err(|e| format!("Cannot open backup file: {}", e))?;

        let mut header = [0u8; 16];
        use std::io::Read;
        f.read_exact(&mut header)
            .map_err(|_| "Backup file is too small to be a valid SQLite database".to_string())?;

        const SQLITE_MAGIC: &[u8; 16] = b"SQLite format 3\0";
        if &header != SQLITE_MAGIC {
            return Err(
                "Selected file does not appear to be a SQLite database".to_string(),
            );
        }

        Ok(())
    }

    /// Perform a FULL WAL checkpoint on the live database then copy the
    /// database file to `dest_path`.
    ///
    /// A FULL checkpoint flushes all WAL frames into the main DB file so the
    /// copy is a consistent, self-contained snapshot.
    pub fn export_data_backup(
        pool: &r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>,
        db_path: &std::path::Path,
        dest_path: &str,
    ) -> Result<serde_json::Value, String> {
        if dest_path.trim().is_empty() {
            return Err("Destination path must not be empty".to_string());
        }

        let dest = std::path::Path::new(dest_path);

        // Ensure destination directory exists.
        if let Some(parent) = dest.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("Cannot create destination directory: {}", e))?;
            }
        }

        // Flush WAL → main DB file before copying.
        let conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection for checkpoint: {}", e))?;
        conn.execute_batch("PRAGMA wal_checkpoint(FULL);")
            .map_err(|e| format!("WAL checkpoint failed: {}", e))?;
        drop(conn); // release before copy

        let bytes_copied = std::fs::copy(db_path, dest)
            .map_err(|e| format!("Failed to copy database: {}", e))?;

        let file_name = dest
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("rpma-backup.db")
            .to_string();

        tracing::info!(
            dest_path = %dest.display(),
            bytes_copied,
            "Data backup exported successfully"
        );

        Ok(json!({
            "success": true,
            "path": dest.display().to_string(),
            "filename": file_name,
            "size_bytes": bytes_copied
        }))
    }

    /// Validate `source_path` as a SQLite file then copy it to `staged_path`.
    ///
    /// The staged file is named `rpma.restore.db` and will be renamed over the
    /// live `rpma.db` on the next application startup before the pool is opened.
    pub fn stage_restore_backup(
        source_path: &str,
        staged_path: &std::path::Path,
    ) -> Result<(), String> {
        if source_path.trim().is_empty() {
            return Err("Source path must not be empty".to_string());
        }

        let src = std::path::Path::new(source_path);
        Self::validate_sqlite_file(src)?;

        std::fs::copy(src, staged_path)
            .map_err(|e| format!("Failed to stage restore file: {}", e))?;

        tracing::info!(
            source = %src.display(),
            staged = %staged_path.display(),
            "Restore backup staged — will be applied on next startup"
        );

        Ok(())
    }
}

#[cfg(test)]
mod backup_tests {
    use super::*;
    use std::io::Write;

    fn temp_dir() -> std::path::PathBuf {
        std::env::temp_dir().join(format!("rpma_test_{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos()))
    }

    #[test]
    fn validate_sqlite_file_rejects_missing_path() {
        let result = SystemRepository::validate_sqlite_file(
            std::path::Path::new("/nonexistent/path/db.sqlite"),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn validate_sqlite_file_rejects_non_sqlite_content() {
        let dir = temp_dir();
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("not_sqlite.db");
        let mut f = std::fs::File::create(&path).unwrap();
        f.write_all(b"this is not a sqlite database file at all!!").unwrap();

        let result = SystemRepository::validate_sqlite_file(&path);
        let _ = std::fs::remove_dir_all(&dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not appear to be a SQLite"));
    }

    #[test]
    fn validate_sqlite_file_accepts_valid_header() {
        let dir = temp_dir();
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("valid.db");
        let mut f = std::fs::File::create(&path).unwrap();
        f.write_all(b"SQLite format 3\0some-other-bytes-here").unwrap();

        let result = SystemRepository::validate_sqlite_file(&path);
        let _ = std::fs::remove_dir_all(&dir);
        assert!(result.is_ok());
    }

    #[test]
    fn export_data_backup_rejects_empty_dest_path() {
        // We don't need a real pool for this validation path.
        // Use a stub pool that will never be reached.
        use r2d2_sqlite::SqliteConnectionManager;
        let manager = SqliteConnectionManager::memory();
        let pool = r2d2::Pool::builder().max_size(1).build(manager).unwrap();

        let result = SystemRepository::export_data_backup(
            &pool,
            std::path::Path::new("rpma.db"),
            "   ",
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("must not be empty"));
    }

    #[test]
    fn stage_restore_backup_rejects_empty_source_path() {
        let staged = std::path::Path::new("/tmp/rpma.restore.db");
        let result = SystemRepository::stage_restore_backup("", staged);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("must not be empty"));
    }

    #[test]
    fn stage_restore_backup_rejects_non_sqlite_file() {
        let dir = temp_dir();
        std::fs::create_dir_all(&dir).unwrap();
        let src = dir.join("bad.db");
        std::fs::write(&src, b"not sqlite").unwrap();
        let staged = dir.join("rpma.restore.db");

        let result = SystemRepository::stage_restore_backup(
            src.to_str().unwrap(),
            &staged,
        );
        let _ = std::fs::remove_dir_all(&dir);
        assert!(result.is_err());
    }
}
