//! Organization IPC commands

use tracing::{debug, info, instrument};

use crate::commands::{ApiResponse, AppError, AppState, init_correlation_context};
use crate::domains::organizations::application::OrganizationService;
use crate::domains::organizations::domain::models::{
    Organization, OrganizationSettings, OnboardingData, OnboardingStatus,
    UpdateOrganizationRequest, UpdateOrganizationSettingsRequest,
};
use crate::shared::contracts::auth::UserRole;
use crate::authenticate;

#[derive(Debug, serde::Deserialize)]
pub struct UploadLogoRequest {
    pub session_token: String,
    pub file_path: Option<String>,
    pub base64_data: Option<String>,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_onboarding_status(
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<OnboardingStatus>, AppError> {
    debug!("Getting onboarding status");
    let correlation_id = init_correlation_context(&correlation_id, None);

    let service = OrganizationService::new(state.db.clone());
    let status = service.get_onboarding_status()?;

    Ok(ApiResponse::success(status).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn complete_onboarding(
    data: OnboardingData,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Organization>, AppError> {
    debug!("Completing onboarding");
    let correlation_id = init_correlation_context(&correlation_id, None);

    let service = OrganizationService::new(state.db.clone());
    let organization = service.complete_onboarding(&data)?;

    info!("Onboarding completed successfully");
    Ok(ApiResponse::success(organization).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_organization(
    session_token: String,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Organization>, AppError> {
    let current_user = authenticate!(&session_token, &state, UserRole::Viewer);
    let correlation_id = init_correlation_context(&correlation_id, Some(&current_user.user_id));
    debug!("Getting organization");

    let service = OrganizationService::new(state.db.clone());
    let organization = service.get_organization_or_default()?;

    Ok(ApiResponse::success(organization).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_organization(
    session_token: String,
    data: UpdateOrganizationRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Organization>, AppError> {
    let current_user = authenticate!(&session_token, &state, UserRole::Admin);
    let correlation_id = init_correlation_context(&correlation_id, Some(&current_user.user_id));
    info!("Updating organization");

    let service = OrganizationService::new(state.db.clone());
    let organization = service.update_organization(&current_user.into(), &data)?;

    Ok(ApiResponse::success(organization).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn upload_logo(
    request: UploadLogoRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<Organization>, AppError> {
    let current_user = authenticate!(&request.session_token, &state, UserRole::Admin);
    let correlation_id = init_correlation_context(&request.correlation_id, Some(&current_user.user_id));
    info!("Uploading logo");

    let service = OrganizationService::new(state.db.clone());
    let organization = service.upload_logo(&current_user.into(), request.file_path, request.base64_data)?;

    Ok(ApiResponse::success(organization).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_organization_settings(
    session_token: String,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<OrganizationSettings>, AppError> {
    let current_user = authenticate!(&session_token, &state, UserRole::Viewer);
    let correlation_id = init_correlation_context(&correlation_id, Some(&current_user.user_id));
    debug!("Getting organization settings");

    let service = OrganizationService::new(state.db.clone());
    let settings = service.get_settings()?;

    Ok(ApiResponse::success(settings).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_organization_settings(
    session_token: String,
    data: UpdateOrganizationSettingsRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<OrganizationSettings>, AppError> {
    let current_user = authenticate!(&session_token, &state, UserRole::Admin);
    let correlation_id = init_correlation_context(&correlation_id, Some(&current_user.user_id));
    info!("Updating organization settings");

    let service = OrganizationService::new(state.db.clone());
    let settings = service.update_settings(&current_user.into(), &data)?;

    Ok(ApiResponse::success(settings).with_correlation_id(Some(correlation_id)))
}
