//! Notification commands for Tauri
//!
//! Only in-app notifications are functional. Push/Email/SMS channels
//! are not implemented — see the in-app notification and message
//! sub-modules for the working notification surface.

use crate::commands::{ApiResponse, AppError, AppState};
use crate::resolve_context;
use crate::domains::notifications::application::{
    SendNotificationRequest, UpdateNotificationConfigRequest,
};
use crate::domains::notifications::domain::models::notification::{
    NotificationChannel, NotificationConfig, NotificationType, TemplateVariables,
};
use crate::domains::notifications::infrastructure::notification::NotificationService;
use lazy_static::lazy_static;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, instrument};

lazy_static! {
    static ref NOTIFICATION_SERVICE: Arc<Mutex<Option<NotificationService>>> =
        Arc::new(Mutex::new(None));
}

/// Initialize the notification service with configuration.
///
/// Currently only stores configuration; actual delivery is limited
/// to in-app notifications.
#[tauri::command]
#[instrument(skip(config, state))]
pub async fn initialize_notification_service(
    config: UpdateNotificationConfigRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<()>, AppError> {
    let ctx = resolve_context!(&state, &config.correlation_id);

    let notification_config = NotificationConfig {
        email: None,
        sms: None,
        push_enabled: false,
        quiet_hours_start: config.quiet_hours_start.clone(),
        quiet_hours_end: config.quiet_hours_end.clone(),
        timezone: config
            .timezone
            .clone()
            .unwrap_or_else(|| "Europe/Paris".to_string()),
    };

    let service = NotificationService::new(notification_config);
    let mut global_service = NOTIFICATION_SERVICE.lock().await;
    *global_service = Some(service);

    info!("Notification service initialized (in-app only)");
    Ok(ApiResponse::success(()).with_correlation_id(Some(ctx.correlation_id)))
}

/// Send a notification (in-app only).
#[tauri::command]
#[instrument(skip(state, request), fields(user_id = %request.user_id))]
pub async fn send_notification(
    request: SendNotificationRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<()>, AppError> {
    let ctx = resolve_context!(&state, &request.correlation_id);

    let service_guard = NOTIFICATION_SERVICE.lock().await;
    let service = service_guard.as_ref().ok_or(AppError::Configuration(
        "Notification service not initialized".to_string(),
    ))?;

    service
        .send_notification(
            request.user_id,
            request.notification_type,
            request.recipient,
            request.variables,
        )
        .await
        .map_err(|e| {
            error!(error = %e, "Failed to send notification");
            AppError::Internal(e)
        })?;

    Ok(ApiResponse::success(()).with_correlation_id(Some(ctx.correlation_id)))
}

/// Test notification configuration.
///
/// Push/Email/SMS channels are not available — returns an error for those.
#[tauri::command]
#[instrument(skip(state))]
pub async fn test_notification_config(
    recipient: String,
    channel: NotificationChannel,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<String>, AppError> {
    let _ctx = resolve_context!(&state, &correlation_id);

    match channel {
        NotificationChannel::Email | NotificationChannel::Sms | NotificationChannel::Push => {
            Err(AppError::NotImplemented(
                "Only in-app notifications are available. Email/SMS/Push channels are not implemented.".to_string(),
            ))
        }
    }
}

/// Get notification service status.
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
            "email_configured": false,
            "sms_configured": false,
            "push_enabled": false,
        })
    } else {
        serde_json::json!({
            "initialized": false
        })
    };

    Ok(ApiResponse::success(config).with_correlation_id(Some(ctx.correlation_id)))
}
