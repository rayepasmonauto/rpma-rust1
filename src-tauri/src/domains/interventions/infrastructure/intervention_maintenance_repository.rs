use crate::db::{Database, InterventionError, InterventionResult};
use crate::domains::interventions::domain::models::intervention::InterventionStatus;
use crate::shared::contracts::task_status::TaskStatus;
use std::sync::Arc;

pub(super) fn reset_task_workflow_state(db: &Arc<Database>, task_id: &str) -> Result<(), String> {
    let conn = db.get_connection()?;
    conn.execute(
        "UPDATE tasks SET workflow_id = NULL, current_workflow_step_id = NULL, status = ?, started_at = NULL WHERE id = ? AND workflow_id IS NOT NULL",
        rusqlite::params![TaskStatus::Draft.to_string(), task_id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub(super) fn delete_orphaned_for_task(db: &Arc<Database>, task_id: &str) -> Result<(), String> {
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM intervention_steps WHERE intervention_id IN (SELECT id FROM interventions WHERE task_id = ?)",
        rusqlite::params![task_id]
    ).map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM interventions WHERE task_id = ?",
        rusqlite::params![task_id],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub(super) fn count_orphaned(db: &Arc<Database>) -> InterventionResult<i64> {
    let conn = db
        .get_connection()
        .map_err(|e| InterventionError::Database(format!("Failed to get connection: {}", e)))?;

    conn.query_row(
        "SELECT COUNT(*) FROM interventions i
         LEFT JOIN tasks t ON i.task_id = t.id
         WHERE t.id IS NULL OR t.deleted_at IS NOT NULL",
        [],
        |row| row.get(0),
    )
    .map_err(|e| {
        InterventionError::Database(format!("Failed to count orphaned interventions: {}", e))
    })
}

pub(super) fn delete_orphaned(db: &Arc<Database>) -> InterventionResult<u32> {
    let orphaned_count = count_orphaned(db)?;
    if orphaned_count > 0 {
        let mut conn = db
            .get_connection()
            .map_err(|e| InterventionError::Database(format!("Failed to get connection: {}", e)))?;

        let tx = conn.transaction().map_err(|e| {
            InterventionError::Database(format!("Failed to start transaction: {}", e))
        })?;

        tx.execute(
            "DELETE FROM intervention_steps WHERE intervention_id IN (
                SELECT i.id FROM interventions i
                LEFT JOIN tasks t ON i.task_id = t.id
                WHERE t.id IS NULL OR t.deleted_at IS NOT NULL
            )",
            [],
        )
        .map_err(|e| {
            InterventionError::Database(format!("Failed to delete orphaned steps: {}", e))
        })?;

        tx.execute(
            "DELETE FROM interventions WHERE id IN (
                SELECT i.id FROM interventions i
                LEFT JOIN tasks t ON i.task_id = t.id
                WHERE t.id IS NULL OR t.deleted_at IS NOT NULL
            )",
            [],
        )
        .map_err(|e| {
            InterventionError::Database(format!("Failed to delete orphaned interventions: {}", e))
        })?;

        tx.commit().map_err(|e| {
            InterventionError::Database(format!("Failed to commit transaction: {}", e))
        })?;
    }

    Ok(orphaned_count as u32)
}

pub(super) fn archive_old(db: &Arc<Database>, days_old: i32) -> InterventionResult<u32> {
    let conn = db
        .get_connection()
        .map_err(|e| InterventionError::Database(format!("Failed to get connection: {}", e)))?;

    let cutoff_timestamp =
        chrono::Utc::now().timestamp_millis() - (days_old as i64 * 24 * 60 * 60 * 1000);

    let archived_count = conn
        .execute(
            "UPDATE interventions
             SET status = 'archived', updated_at = ?
             WHERE status = ?
             AND completed_at < ?
             AND status != 'archived'",
            rusqlite::params![
                chrono::Utc::now().timestamp_millis(),
                InterventionStatus::Completed.to_string(),
                cutoff_timestamp
            ],
        )
        .map_err(|e| {
            InterventionError::Database(format!("Failed to archive old interventions: {}", e))
        })?;

    Ok(archived_count as u32)
}

pub(super) fn count_orphaned_steps(db: &Arc<Database>) -> InterventionResult<i64> {
    let conn = db
        .get_connection()
        .map_err(|e| InterventionError::Database(format!("Failed to get connection: {}", e)))?;

    conn.query_row(
        "SELECT COUNT(*) FROM intervention_steps s
         LEFT JOIN interventions i ON s.intervention_id = i.id
         WHERE i.id IS NULL",
        [],
        |row| row.get(0),
    )
    .map_err(|e| InterventionError::Database(format!("Failed to count orphaned steps: {}", e)))
}

pub(super) fn count_archived(db: &Arc<Database>) -> InterventionResult<i64> {
    let conn = db
        .get_connection()
        .map_err(|e| InterventionError::Database(format!("Failed to get connection: {}", e)))?;

    conn.query_row(
        "SELECT COUNT(*) FROM interventions WHERE status = 'archived' AND deleted_at IS NULL",
        [],
        |row| row.get(0),
    )
    .map_err(|e| {
        InterventionError::Database(format!("Failed to count archived interventions: {}", e))
    })
}
