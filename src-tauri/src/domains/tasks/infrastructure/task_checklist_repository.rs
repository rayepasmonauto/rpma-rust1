//! Repository for task checklist items (ADR-002: SQL stays in infrastructure).

use std::sync::Arc;

use rusqlite::params;
use tracing::instrument;

use crate::commands::AppError;
use crate::db::Database;
use crate::domains::tasks::domain::models::task::{
    ChecklistItem, CreateChecklistItemRequest, UpdateChecklistItemRequest,
};

#[derive(Debug)]
pub struct TaskChecklistRepository {
    db: Arc<Database>,
}

impl TaskChecklistRepository {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Return all checklist items for a task, ordered by position.
    #[instrument(skip(self))]
    pub fn list_for_task(&self, task_id: &str) -> Result<Vec<ChecklistItem>, AppError> {
        let conn = self
            .db
            .get_connection()
            .map_err(|e| AppError::Database(format!("Connection error: {e}")))?;

        let mut stmt = conn
            .prepare(
                r#"
                SELECT id, task_id, description, position, is_completed,
                       completed_at, completed_by, notes, created_at, updated_at
                FROM task_checklist_items
                WHERE task_id = ?
                ORDER BY position ASC, created_at ASC
                "#,
            )
            .map_err(|e| AppError::Database(format!("Prepare error: {e}")))?;

        let rows = stmt
            .query_map(params![task_id], |row| {
                Ok(ChecklistItem {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    description: row.get(2)?,
                    position: row.get(3)?,
                    is_completed: row.get::<_, i64>(4)? != 0,
                    completed_at: row.get(5)?,
                    completed_by: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })
            .map_err(|e| AppError::Database(format!("Query error: {e}")))?;

        let items = rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| AppError::Database(format!("Row error: {e}")))?;

        Ok(items)
    }

    /// Insert a new checklist item.
    #[instrument(skip(self))]
    pub fn create(&self, req: CreateChecklistItemRequest) -> Result<ChecklistItem, AppError> {
        let position = req
            .position
            .unwrap_or_else(|| self.next_position(&req.task_id).unwrap_or(0));
        let item = ChecklistItem::new(req.task_id, req.description, position);
        let now = item.created_at;

        self.db
            .execute(
                r#"
                INSERT INTO task_checklist_items
                    (id, task_id, description, position, is_completed, completed_at,
                     completed_by, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, NULL, NULL, NULL, ?, ?)
                "#,
                params![
                    item.id,
                    item.task_id,
                    item.description,
                    item.position,
                    now,
                    now
                ],
            )
            .map_err(|e| AppError::Database(format!("Insert error: {e}")))?;

        Ok(item)
    }

    /// Toggle completion state of a checklist item.
    ///
    /// Returns the updated item.
    #[instrument(skip(self))]
    pub fn update(
        &self,
        item_id: &str,
        task_id: &str,
        completed_by: &str,
        req: UpdateChecklistItemRequest,
    ) -> Result<ChecklistItem, AppError> {
        let now = chrono::Utc::now().timestamp_millis();
        let completed_at: Option<i64> = if req.is_completed { Some(now) } else { None };
        let is_completed_int: i64 = if req.is_completed { 1 } else { 0 };

        let rows = self
            .db
            .execute(
                r#"
                UPDATE task_checklist_items
                SET is_completed = ?,
                    completed_at = ?,
                    completed_by = ?,
                    notes        = COALESCE(?, notes),
                    updated_at   = ?
                WHERE id = ? AND task_id = ?
                "#,
                params![
                    is_completed_int,
                    completed_at,
                    completed_by,
                    req.notes,
                    now,
                    item_id,
                    task_id
                ],
            )
            .map_err(|e| AppError::Database(format!("Update error: {e}")))?;

        if rows == 0 {
            return Err(AppError::NotFound(format!(
                "Checklist item {} not found for task {}",
                item_id, task_id
            )));
        }

        // Reload updated row
        let conn = self
            .db
            .get_connection()
            .map_err(|e| AppError::Database(format!("Connection error: {e}")))?;

        conn.query_row(
            r#"
            SELECT id, task_id, description, position, is_completed,
                   completed_at, completed_by, notes, created_at, updated_at
            FROM task_checklist_items
            WHERE id = ?
            "#,
            params![item_id],
            |row| {
                Ok(ChecklistItem {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    description: row.get(2)?,
                    position: row.get(3)?,
                    is_completed: row.get::<_, i64>(4)? != 0,
                    completed_at: row.get(5)?,
                    completed_by: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| AppError::Database(format!("Reload error: {e}")))
    }

    /// Delete a checklist item.
    pub fn delete(&self, item_id: &str, task_id: &str) -> Result<bool, AppError> {
        let rows = self
            .db
            .execute(
                "DELETE FROM task_checklist_items WHERE id = ? AND task_id = ?",
                params![item_id, task_id],
            )
            .map_err(|e| AppError::Database(format!("Delete error: {e}")))?;
        Ok(rows > 0)
    }

    fn next_position(&self, task_id: &str) -> Result<i32, AppError> {
        let conn = self
            .db
            .get_connection()
            .map_err(|e| AppError::Database(format!("Connection error: {e}")))?;

        let max: Option<i32> = conn
            .query_row(
                "SELECT MAX(position) FROM task_checklist_items WHERE task_id = ?",
                params![task_id],
                |row| row.get(0),
            )
            .unwrap_or(None);

        Ok(max.map_or(0, |m| m + 1))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;
    use std::sync::Arc;

    async fn setup_test_db() -> Database {
        Database::new_in_memory().await.expect("in-memory DB")
    }

    fn insert_test_task(db: &Database, task_id: &str) {
        let now = chrono::Utc::now().timestamp_millis();
        db.execute(
            r#"INSERT INTO tasks (id, task_number, title, status, priority, checklist_completed, created_at, updated_at)
               VALUES (?, ?, 'Test Task', 'pending', 'medium', 0, ?, ?)"#,
            params![task_id, format!("TST-{}", task_id), now, now],
        )
        .expect("insert test task");
    }

    #[tokio::test]
    async fn test_create_and_list_checklist_items() {
        let db = Arc::new(setup_test_db().await);
        let repo = TaskChecklistRepository::new(db.clone());

        insert_test_task(&db, "task-1");

        let item = repo
            .create(CreateChecklistItemRequest {
                task_id: "task-1".to_string(),
                description: "Déposer le film".to_string(),
                position: None,
            })
            .expect("create item");

        assert_eq!(item.task_id, "task-1");
        assert!(!item.is_completed);

        let items = repo.list_for_task("task-1").expect("list items");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].description, "Déposer le film");
    }

    #[tokio::test]
    async fn test_update_checklist_item_completion() {
        let db = Arc::new(setup_test_db().await);
        let repo = TaskChecklistRepository::new(db.clone());

        insert_test_task(&db, "task-2");

        let item = repo
            .create(CreateChecklistItemRequest {
                task_id: "task-2".to_string(),
                description: "Nettoyer la surface".to_string(),
                position: None,
            })
            .expect("create item");

        let updated = repo
            .update(
                &item.id,
                "task-2",
                "user-1",
                UpdateChecklistItemRequest {
                    is_completed: true,
                    notes: None,
                },
            )
            .expect("update item");

        assert!(updated.is_completed);
        assert!(updated.completed_at.is_some());
        assert_eq!(updated.completed_by.as_deref(), Some("user-1"));
    }

    #[tokio::test]
    async fn test_update_unknown_item_returns_not_found() {
        let db = Arc::new(setup_test_db().await);
        let repo = TaskChecklistRepository::new(db.clone());

        insert_test_task(&db, "task-3");

        let result = repo.update(
            "nonexistent-id",
            "task-3",
            "user-1",
            UpdateChecklistItemRequest {
                is_completed: true,
                notes: None,
            },
        );

        assert!(matches!(result, Err(AppError::NotFound(_))));
    }
}
