//! Flattened handler for Reports within Documents domain.
//!
//! Each handler authenticates the caller via `resolve_context!`, then
//! delegates to `DocumentsFacade` for all repository operations.

use chrono::{Datelike, Utc};
use rusqlite::params;
use std::sync::Arc;
use tracing::{debug, info, instrument};

use super::facade::DocumentsFacade;
use super::models::*;
use super::report_export as report_export_service;
use super::report_pdf::InterventionPdfReport;
use crate::commands::{ApiResponse, AppError, AppState};
use crate::db::Database;
use crate::resolve_context;
use crate::shared::contracts::auth::UserRole;
use crate::shared::services::document_storage::DocumentStorageService;

// ── Report Repository ───────────────────────────────────────────────────────

// TODO(ADR-005): move to infrastructure repository
pub struct ReportRepository {
    db: Arc<Database>,
}

impl ReportRepository {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn generate_report_number(&self) -> Result<String, AppError> {
        let year = Utc::now().year();
        let prefix = format!("INT-{}-", year);

        // TODO(ADR-005): move to infrastructure repository
        let count: i32 = self
            .db
            .query_single_value(
                "SELECT COUNT(*) FROM intervention_reports WHERE report_number LIKE ?1",
                params![format!("{}%", prefix)],
            )
            .map_err(|e| AppError::Database(format!("Failed to count reports: {}", e)))?;

        let next_number = count + 1;
        Ok(format!("INT-{}-{:04}", year, next_number))
    }

    pub fn save(&self, report: &InterventionReport) -> Result<(), AppError> {
        // TODO(ADR-005): move to infrastructure repository
        self.db
            .execute(
                "INSERT INTO intervention_reports (id, intervention_id, report_number, generated_at, technician_id, technician_name, file_path, file_name, file_size, format, status, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    report.id,
                    report.intervention_id,
                    report.report_number,
                    report.generated_at,
                    report.technician_id,
                    report.technician_name,
                    report.file_path,
                    report.file_name,
                    report.file_size.map(|s| s as i64),
                    report.format,
                    report.status,
                    report.created_at,
                    report.updated_at,
                ],
            )
            .map_err(|e| AppError::Database(format!("Failed to save report: {}", e)))?;

        Ok(())
    }

    pub fn find_by_id(&self, id: &str) -> Result<Option<InterventionReport>, AppError> {
        let conn = self
            .db
            .get_connection()
            .map_err(|e| AppError::Database(format!("Failed to get connection: {}", e)))?;

        // TODO(ADR-005): move to infrastructure repository
        let result = conn
            .query_row(
                "SELECT id, intervention_id, report_number, generated_at, technician_id, technician_name, file_path, file_name, file_size, format, status, created_at, updated_at
                 FROM intervention_reports WHERE id = ?1",
                params![id],
                |row| helpers::row_to_report(row),
            );

        match result {
            Ok(report) => Ok(Some(report)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AppError::Database(format!("Failed to query report: {}", e))),
        }
    }

    pub fn find_by_intervention_id(
        &self,
        intervention_id: &str,
    ) -> Result<Option<InterventionReport>, AppError> {
        let conn = self
            .db
            .get_connection()
            .map_err(|e| AppError::Database(format!("Failed to get connection: {}", e)))?;

        // TODO(ADR-005): move to infrastructure repository
        let result = conn
            .query_row(
                "SELECT id, intervention_id, report_number, generated_at, technician_id, technician_name, file_path, file_name, file_size, format, status, created_at, updated_at
                 FROM intervention_reports WHERE intervention_id = ?1 ORDER BY created_at DESC LIMIT 1",
                params![intervention_id],
                |row| helpers::row_to_report(row),
            );

        match result {
            Ok(report) => Ok(Some(report)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AppError::Database(format!("Failed to query report: {}", e))),
        }
    }

    pub fn list(&self, limit: i32, offset: i32) -> Result<Vec<InterventionReport>, AppError> {
        // TODO(ADR-005): move to infrastructure repository
        self.db
            .query_multiple(
                "SELECT id, intervention_id, report_number, generated_at, technician_id, technician_name, file_path, file_name, file_size, format, status, created_at, updated_at
                 FROM intervention_reports ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
                params![limit, offset],
                |row| helpers::row_to_report(row),
            )
            .map_err(|e| AppError::Database(format!("Failed to list reports: {}", e)))
    }
}

// ── Private helpers ──────────────────────────────────────────────────────────

mod helpers {
    use super::InterventionReport;

    /// Map a single SQLite row to an [`InterventionReport`].
    pub(super) fn row_to_report(row: &rusqlite::Row<'_>) -> rusqlite::Result<InterventionReport> {
        let generated_at: i64 = row.get(3)?;
        let file_size: Option<i64> = row.get(8)?;

        Ok(InterventionReport {
            id: row.get(0)?,
            intervention_id: row.get(1)?,
            report_number: row.get(2)?,
            generated_at,
            technician_id: row.get(4)?,
            technician_name: row.get(5)?,
            file_path: row.get(6)?,
            file_name: row.get(7)?,
            file_size: file_size.map(|s| s as u64),
            format: row.get(9)?,
            status: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }
}

// ── IPC Commands ─────────────────────────────────────────────────────────────

/// ADR-018: Thin IPC layer
#[tauri::command]
#[instrument(skip(state))]
pub async fn reports_get_capabilities(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<ReportCapabilities>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    debug!("Getting report capabilities");
    let capabilities = DocumentsFacade::new(state.photo_service.clone(), state.db.clone())
        .get_capabilities();
    Ok(ApiResponse::success(capabilities).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn report_generate(
    state: AppState<'_>,
    intervention_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<InterventionReport>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Technician);
    let svc = crate::domains::documents::application::ReportApplicationService::new(
        state.db.clone(),
        state.intervention_service.clone(),
        state.client_service.clone(),
        state.photo_service.clone(),
    );
    let report = svc
        .generate_report(&intervention_id, &ctx.auth.to_user_session(), &state.app_config.app_data_dir)
        .await?;
    info!(
        report_number = %report.report_number,
        intervention_id = %intervention_id,
        "Intervention report generated"
    );
    Ok(ApiResponse::success(report).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn report_get(
    state: AppState<'_>,
    report_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Option<InterventionReport>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let facade = DocumentsFacade::new(state.photo_service.clone(), state.db.clone());
    let report = facade.get_report(&report_id)?;
    Ok(ApiResponse::success(report).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn report_get_by_intervention(
    state: AppState<'_>,
    intervention_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Option<InterventionReport>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let facade = DocumentsFacade::new(state.photo_service.clone(), state.db.clone());
    let report = facade.get_report_by_intervention(&intervention_id)?;
    Ok(ApiResponse::success(report).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn report_list(
    state: AppState<'_>,
    limit: Option<i32>,
    offset: Option<i32>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Vec<InterventionReport>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let facade = DocumentsFacade::new(state.photo_service.clone(), state.db.clone());
    let reports = facade.list_reports(
        limit.unwrap_or(crate::shared::constants::DEFAULT_USER_LIST_SIZE as i32),
        offset.unwrap_or(0),
    )?;
    Ok(ApiResponse::success(reports).with_correlation_id(Some(ctx.correlation_id)))
}
