//! Unified notification handler for Tauri commands.

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, instrument};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::commands::{ApiResponse, AppError, AppState, init_correlation_context};
use crate::resolve_context;
use crate::domains::notifications::domain::models::message::*;
use crate::domains::notifications::domain::models::notification::{Notification, NotificationConfig};
use crate::domains::notifications::infrastructure::notification::NotificationService as InfraNotificationService;
use crate::domains::notifications::infrastructure::notification_in_app_repository::NotificationRepository;
use crate::shared::repositories::base::Repository;

lazy_static! {
    static ref NOTIFICATION_SERVICE: Arc<Mutex<Option<InfraNotificationService>>> =
        Arc::new(Mutex::new(None));
}

/// Request to update notification config
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNotificationConfigRequest {
    pub quiet_hours_start: Option<String>,
    pub quiet_hours_end: Option<String>,
    pub timezone: Option<String>,
    pub correlation_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetNotificationsResponse {
    pub notifications: Vec<Notification>,
    pub unread_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SuccessResponse {
    pub success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNotificationRequest {
    pub user_id: String,
    pub r#type: String,
    pub title: String,
    pub message: String,
    pub entity_type: String,
    pub entity_id: String,
    pub entity_url: String,
    pub correlation_id: Option<String>,
}

// --- MESSAGE COMMANDS ---

#[tracing::instrument(skip_all)]
#[tauri::command]
pub async fn message_send(
    request: SendMessageRequest,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<Message>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let msg = state
        .message_service
        .send_message(&request)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(ApiResponse::success(msg).with_correlation_id(Some(ctx.correlation_id)))
}

#[tracing::instrument(skip_all)]
#[tauri::command]
pub async fn message_get_list(
    query: MessageQuery,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<MessageListResponse>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let list = state
        .message_service
        .get_messages(&query)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(ApiResponse::success(list).with_correlation_id(Some(ctx.correlation_id)))
}

#[tracing::instrument(skip_all)]
#[tauri::command]
pub async fn message_mark_read(
    message_id: String,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<()>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    state
        .message_service
        .mark_read(&message_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(ApiResponse::success(()).with_correlation_id(Some(ctx.correlation_id)))
}

#[tracing::instrument(skip_all)]
#[tauri::command]
pub async fn message_get_templates(
    category: Option<String>,
    message_type: Option<String>,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<Vec<MessageTemplate>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let templates = state
        .message_service
        .get_templates(category.as_deref(), message_type.as_deref())
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(ApiResponse::success(templates).with_correlation_id(Some(ctx.correlation_id)))
}

#[tracing::instrument(skip_all)]
#[tauri::command]
pub async fn message_get_preferences(
    user_id: String,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<NotificationPreferences>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let prefs = state
        .message_service
        .get_preferences(&user_id)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(ApiResponse::success(prefs).with_correlation_id(Some(ctx.correlation_id)))
}

#[tracing::instrument(skip_all)]
#[tauri::command]
pub async fn message_update_preferences(
    user_id: String,
    updates: UpdateNotificationPreferencesRequest,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<NotificationPreferences>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let prefs = state
        .message_service
        .update_preferences(&user_id, &updates)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(ApiResponse::success(prefs).with_correlation_id(Some(ctx.correlation_id)))
}

// --- NOTIFICATION INFRA COMMANDS ---

#[tauri::command]
#[instrument(skip(config, state))]
pub async fn initialize_notification_service(
    config: UpdateNotificationConfigRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<()>, AppError> {
    let ctx = resolve_context!(&state, &config.correlation_id);

    let notification_config = NotificationConfig {
        quiet_hours_start: config.quiet_hours_start.clone(),
        quiet_hours_end: config.quiet_hours_end.clone(),
        timezone: config
            .timezone
            .clone()
            .unwrap_or_else(|| "Europe/Paris".to_string()),
    };

    let service = InfraNotificationService::new(notification_config);
    let mut global_service = NOTIFICATION_SERVICE.lock().await;
    *global_service = Some(service);

    info!("Notification service initialized (in-app only)");
    Ok(ApiResponse::success(()).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_notification_status(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<serde_json::Value>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let service_guard = NOTIFICATION_SERVICE.lock().await;

    let config = if service_guard.is_some() {
        serde_json::json!({
            "initialized": true,
            "channels": ["in_app"],
        })
    } else {
        serde_json::json!({
            "initialized": false
        })
    };

    Ok(ApiResponse::success(config).with_correlation_id(Some(ctx.correlation_id)))
}

// --- IN-APP NOTIFICATION COMMANDS ---

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_notifications(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<GetNotificationsResponse>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repo = NotificationRepository::new(state.db.clone(), state.repositories.cache.clone());
    
    let notifications = repo
        .find_by_user(&ctx.auth.user_id, 50)
        .await
        .map_err(|e| {
            error!(error = %e, "Failed to get notifications");
            AppError::Database("Failed to get notifications".to_string())
        })?;

    let unread_count = repo
        .count_unread(&ctx.auth.user_id)
        .await
        .unwrap_or(0);

    info!(
        user_id = %ctx.auth.user_id,
        count = notifications.len(),
        unread = unread_count,
        "Retrieved notifications"
    );

    Ok(ApiResponse::success(GetNotificationsResponse {
        notifications,
        unread_count,
    })
    .with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state), fields(notification_id = %id))]
pub async fn mark_notification_read(
    id: String,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<SuccessResponse>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repo = NotificationRepository::new(state.db.clone(), state.repositories.cache.clone());
    
    repo.mark_read(&id).await.map_err(|e| {
        error!(error = %e, notification_id = %id, "Failed to mark notification as read");
        AppError::Database("Failed to mark notification as read".to_string())
    })?;

    info!(notification_id = %id, "Notification marked as read");
    Ok(ApiResponse::success(SuccessResponse { success: true })
        .with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn mark_all_notifications_read(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<SuccessResponse>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repo = NotificationRepository::new(state.db.clone(), state.repositories.cache.clone());
    
    repo.mark_all_read(&ctx.auth.user_id).await.map_err(|e| {
        error!(error = %e, user_id = %ctx.auth.user_id, "Failed to mark all notifications as read");
        AppError::Database("Failed to mark all notifications as read".to_string())
    })?;

    info!(user_id = %ctx.auth.user_id, "All notifications marked as read");
    Ok(ApiResponse::success(SuccessResponse { success: true })
        .with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state), fields(notification_id = %id))]
pub async fn delete_notification(
    id: String,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<SuccessResponse>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repo = NotificationRepository::new(state.db.clone(), state.repositories.cache.clone());
    
    repo.delete(&id).await.map_err(|e| {
        error!(error = %e, notification_id = %id, "Failed to delete notification");
        AppError::Database("Failed to delete notification".to_string())
    })?;

    info!(notification_id = %id, "Notification deleted");
    Ok(ApiResponse::success(SuccessResponse { success: true })
        .with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state, request))]
pub async fn create_notification(
    request: CreateNotificationRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<Notification>, AppError> {
    let correlation_id = init_correlation_context(&request.correlation_id, None);
    let user_id = request.user_id.clone();
    let notification_type = request.r#type.clone();

    let notification = Notification::new(
        user_id.clone(),
        notification_type.clone(),
        request.title,
        request.message,
        request.entity_type,
        request.entity_id,
        request.entity_url,
    );

    let repo = NotificationRepository::new(state.db.clone(), state.repositories.cache.clone());
    let created = repo.save(notification).await.map_err(|e| {
        error!(error = %e, user_id = %user_id, "Failed to create notification");
        AppError::Database("Failed to create notification".to_string())
    })?;

    info!(
        user_id = %user_id,
        notification_type = %notification_type,
        notification_id = %created.id,
        "Notification created"
    );

    Ok(ApiResponse::success(created).with_correlation_id(Some(correlation_id)))
}
