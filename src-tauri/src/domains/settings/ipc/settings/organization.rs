//! Organization IPC commands (merged from `domains/organizations`)

use tracing::{debug, info, instrument};

use crate::commands::{ApiResponse, AppError, AppState, init_correlation_context};
use crate::domains::settings::domain::models::organization::{
    Organization, OrganizationSettings, OnboardingData, OnboardingStatus,
    UpdateOrganizationRequest, UpdateOrganizationSettingsRequest,
};
use crate::domains::settings::infrastructure::settings::organization_repository::OrganizationRepository;
use crate::shared::contracts::auth::UserRole;
use crate::resolve_context;

#[derive(Debug, serde::Deserialize)]
pub struct UploadLogoRequest {
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

    let repo = OrganizationRepository::new(state.db.clone());
    let (completed, current_step) = repo.get_onboarding_status()?;
    let has_organization = repo.get_organization()?.is_some();
    let has_admin_user = repo.has_admin_users()?;

    let status = OnboardingStatus { completed, current_step, has_organization, has_admin_user };
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

    data.validate().map_err(|e| AppError::Validation(e))?;

    let repo = OrganizationRepository::new(state.db.clone());
    if repo.get_organization()?.is_some() {
        return Err(AppError::Validation("Organization already exists".to_string()));
    }

    let organization = repo.create_organization(&data.organization)?;
    repo.complete_onboarding()?;

    info!("Onboarding completed for organization: {}", organization.name);
    Ok(ApiResponse::success(organization).with_correlation_id(Some(correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_organization(
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Organization>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Viewer);
    debug!("Getting organization");

    let repo = OrganizationRepository::new(state.db.clone());
    let organization = repo.get_organization()?.ok_or_else(|| {
        AppError::NotFound("Organization not found. Please complete onboarding.".to_string())
    })?;

    Ok(ApiResponse::success(organization).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_organization(
    data: UpdateOrganizationRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Organization>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    info!("Updating organization");

    let repo = OrganizationRepository::new(state.db.clone());
    let organization = repo.update_organization(&data)?;

    Ok(ApiResponse::success(organization).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn upload_logo(
    request: UploadLogoRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<Organization>, AppError> {
    let ctx = resolve_context!(&state, &request.correlation_id, UserRole::Admin);
    info!("Uploading logo");

    let repo = OrganizationRepository::new(state.db.clone());
    let update = UpdateOrganizationRequest {
        logo_url: request.file_path,
        logo_data: request.base64_data,
        ..Default::default()
    };
    let organization = repo.update_organization(&update)?;

    Ok(ApiResponse::success(organization).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn get_organization_settings(
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<OrganizationSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Viewer);
    debug!("Getting organization settings");

    let repo = OrganizationRepository::new(state.db.clone());
    let settings = repo.get_all_settings()?;

    Ok(ApiResponse::success(settings).with_correlation_id(Some(ctx.correlation_id)))
}

#[tauri::command]
#[instrument(skip(state))]
pub async fn update_organization_settings(
    data: UpdateOrganizationSettingsRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<OrganizationSettings>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    info!("Updating organization settings");

    let repo = OrganizationRepository::new(state.db.clone());
    repo.update_settings(&data.settings)?;
    let settings = repo.get_all_settings()?;

    Ok(ApiResponse::success(settings).with_correlation_id(Some(ctx.correlation_id)))
}
