//! Task history IPC commands
//!
//! Thin IPC adapter (ADR-018) — delegates to the application-layer
//! [`TaskHistoryService`] instead of accessing repositories directly.

use crate::commands::{ApiResponse, AppError, AppState};
use crate::domains::tasks::application::services::task_history_service::TaskHistoryService;
use crate::domains::tasks::domain::models::task::TaskHistory;
use crate::resolve_context;
use serde::Deserialize;
use tracing::debug;

/// Request to retrieve the status-change history for a task.
#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct GetTaskHistoryRequest {
    pub task_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// Construct a per-request [`TaskHistoryService`] from shared application state.
fn history_service(state: &AppState<'_>) -> TaskHistoryService {
    TaskHistoryService::new(
        state.task_service.clone(),
        state.repositories.task_history.clone(),
    )
}

/// Retrieve the full status-change history for a task.
///
/// ADR-018: Thin IPC layer — resolves context, delegates to the
/// application-layer service, and maps the result into an `ApiResponse`.
#[tauri::command]
#[tracing::instrument(skip(state))]
pub async fn get_task_history(
    request: GetTaskHistoryRequest,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<Vec<TaskHistory>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    debug!(task_id = %request.task_id, "get_task_history");

    let service = history_service(&state);
    let history = service.get_by_task_id(&request.task_id).await?;

    Ok(ApiResponse::success(history).with_correlation_id(Some(ctx.correlation_id.clone())))
}
