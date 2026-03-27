//! Task checklist item IPC commands.
//!
//! Exposes three thin Tauri commands (ADR-018):
//! - `task_checklist_items_get`  — list all items for a task
//! - `task_checklist_item_update` — toggle completion state
//! - `task_checklist_item_create` — add a new item
//!
//! All business logic is delegated to the application-layer
//! [`TaskChecklistService`] so that IPC handlers remain thin adapters.

use serde::Deserialize;
use tracing::{debug, error, instrument};

use crate::commands::{ApiResponse, AppError, AppState};
use crate::domains::tasks::application::services::task_checklist_service::TaskChecklistService;
use crate::domains::tasks::domain::models::task::{
    ChecklistItem, CreateChecklistItemRequest, UpdateChecklistItemRequest,
};
use crate::resolve_context;

// ---------------------------------------------------------------------------
// Helper: construct a per-request application service from shared state
// ---------------------------------------------------------------------------

/// Build a [`TaskChecklistService`] from the shared `AppState`.
fn checklist_service(state: &AppState<'_>) -> TaskChecklistService {
    TaskChecklistService::new(state.db.clone())
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

/// Request to list checklist items for a task.
#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct TaskChecklistItemsGetRequest {
    pub task_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// Request to update a single checklist item.
#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct TaskChecklistItemUpdateRequest {
    pub item_id: String,
    pub task_id: String,
    pub data: UpdateChecklistItemRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// Request to create a new checklist item.
#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct TaskChecklistItemCreateRequest {
    pub data: CreateChecklistItemRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

// ---------------------------------------------------------------------------
// IPC command handlers (thin adapters — ADR-018)
// ---------------------------------------------------------------------------

/// List all checklist items for a task.
#[tauri::command]
#[instrument(skip(state))]
pub async fn task_checklist_items_get(
    request: TaskChecklistItemsGetRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<Vec<ChecklistItem>>, AppError> {
    debug!(task_id = %request.task_id, "task_checklist_items_get");
    let ctx = resolve_context!(&state, &request.correlation_id);
    let correlation_id = ctx.correlation_id.clone();

    let service = checklist_service(&state);
    match service.list_for_task(&request.task_id) {
        Ok(items) => Ok(ApiResponse::success(items).with_correlation_id(Some(correlation_id))),
        Err(e) => {
            error!(error = %e, "Failed to list checklist items");
            Ok(ApiResponse::error(e).with_correlation_id(Some(correlation_id)))
        }
    }
}

/// Toggle the completion state of a checklist item.
#[tauri::command]
#[instrument(skip(state))]
pub async fn task_checklist_item_update(
    request: TaskChecklistItemUpdateRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<ChecklistItem>, AppError> {
    debug!(item_id = %request.item_id, task_id = %request.task_id, "task_checklist_item_update");
    let ctx = resolve_context!(&state, &request.correlation_id);
    let correlation_id = ctx.correlation_id.clone();
    let user_id = ctx.user_id().to_string();

    let service = checklist_service(&state);
    match service.update_item(&request.item_id, &request.task_id, &user_id, request.data) {
        Ok(item) => Ok(ApiResponse::success(item).with_correlation_id(Some(correlation_id))),
        Err(e) => {
            error!(error = %e, "Failed to update checklist item");
            Ok(ApiResponse::error(e).with_correlation_id(Some(correlation_id)))
        }
    }
}

/// Create a new checklist item for a task.
#[tauri::command]
#[instrument(skip(state))]
pub async fn task_checklist_item_create(
    request: TaskChecklistItemCreateRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<ChecklistItem>, AppError> {
    debug!(task_id = %request.data.task_id, "task_checklist_item_create");
    let ctx = resolve_context!(&state, &request.correlation_id);
    let correlation_id = ctx.correlation_id.clone();

    let service = checklist_service(&state);
    match service.create_item(request.data) {
        Ok(item) => Ok(ApiResponse::success(item).with_correlation_id(Some(correlation_id))),
        Err(e) => {
            error!(error = %e, "Failed to create checklist item");
            Ok(ApiResponse::error(e).with_correlation_id(Some(correlation_id)))
        }
    }
}
