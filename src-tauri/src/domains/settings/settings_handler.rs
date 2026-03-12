//! Flattened IPC handlers for global App Settings.

use std::sync::Arc;
use tracing::{debug, info, instrument, error};

use crate::commands::{ApiResponse, AppError, AppState};
use crate::shared::contracts::auth::UserRole;
use crate::resolve_context;
use super::models::*;
use super::settings_repository::SettingsRepository;

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_app_settings(
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let settings = repository.get_app_settings_db()
        .map_err(|e| AppError::Database(format!("Failed to get app settings: {}", e)))?;

    Ok(ApiResponse::success(settings).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_general_settings(
    state: AppState<'_>,
    settings: GeneralSettings,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.general = settings;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    info!("General settings updated");
    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_security_settings(
    state: AppState<'_>,
    settings: SecuritySettings,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.security = settings;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    info!("Security settings updated");
    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_notification_settings(
    state: AppState<'_>,
    settings: NotificationSettings,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.notifications = settings;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    info!("Notification settings updated");
    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

// ── System Config Commands ──────────────────────────────────────────────────

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_business_rules(
    state: AppState<'_>,
    rules: Vec<serde_json::Value>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.business_rules = rules;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_security_policies(
    state: AppState<'_>,
    policies: Vec<serde_json::Value>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.security_policies = policies;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_integrations(
    state: AppState<'_>,
    integrations: Vec<serde_json::Value>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.integrations = integrations;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_performance_configs(
    state: AppState<'_>,
    configs: Vec<serde_json::Value>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.performance_configs = configs;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_business_hours(
    state: AppState<'_>,
    hours: serde_json::Value,
    correlation_id: Option<String>,
) -> Result<ApiResponse<AppSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    let repository = SettingsRepository::new(state.db.clone());

    let mut current = repository.get_app_settings_db()?;
    current.business_hours = hours;
    repository.save_app_settings_db(&current, &ctx.auth.user_id)?;

    Ok(ApiResponse::success(current).with_correlation_id(Some(ctx.correlation_id)))
}
