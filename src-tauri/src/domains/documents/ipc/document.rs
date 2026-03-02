//! Tauri IPC commands for the Documents bounded context.
//!
//! Exposes photo storage and retrieval operations to the frontend.

use crate::authenticate;
use crate::commands::{ApiResponse, AppState};
use crate::domains::documents::domain::models::photo::Photo;
use crate::domains::documents::domain::models::report_export::InterventionReportResult;
use crate::domains::documents::infrastructure::photo::{
    GetPhotosRequest, GetPhotosResponse, PhotoMetadataUpdate, StorePhotoRequest, StorePhotoResponse,
};
use crate::domains::documents::infrastructure::report_export as report_export_service;
use crate::shared::contracts::auth::UserRole;
use tracing::{error, info, instrument};

/// Store a new photo for an intervention step.
#[tauri::command]
#[instrument(skip(state, session_token, image_data))]
pub async fn document_store_photo(
    state: AppState<'_>,
    session_token: String,
    request: StorePhotoRequest,
    image_data: Vec<u8>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<StorePhotoResponse>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let _current_user = authenticate!(&session_token, &state, UserRole::Technician);
    crate::commands::update_correlation_context_user(&_current_user.user_id);

    match state.photo_service.store_photo(request, image_data).await {
        Ok(response) => {
            info!(photo_id = %response.photo.id, "Photo stored");
            Ok(ApiResponse::success(response).with_correlation_id(Some(correlation_id.clone())))
        }
        Err(e) => {
            error!(error = %e, "Failed to store photo");
            Err(crate::commands::AppError::Internal(e.to_string()))
        }
    }
}

/// Retrieve a list of photos with optional filters.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn document_get_photos(
    state: AppState<'_>,
    session_token: String,
    request: GetPhotosRequest,
    correlation_id: Option<String>,
) -> Result<ApiResponse<GetPhotosResponse>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let _current_user = authenticate!(&session_token, &state);
    crate::commands::update_correlation_context_user(&_current_user.user_id);

    match state.photo_service.get_photos(request) {
        Ok(response) => {
            Ok(ApiResponse::success(response).with_correlation_id(Some(correlation_id.clone())))
        }
        Err(e) => {
            error!(error = %e, "Failed to get photos");
            Err(crate::commands::AppError::Internal(e.to_string()))
        }
    }
}

/// Get a single photo by its ID.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn document_get_photo(
    state: AppState<'_>,
    session_token: String,
    photo_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Option<Photo>>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let _current_user = authenticate!(&session_token, &state);
    crate::commands::update_correlation_context_user(&_current_user.user_id);

    match state.photo_service.get_photo(&photo_id) {
        Ok(photo) => {
            Ok(ApiResponse::success(photo).with_correlation_id(Some(correlation_id.clone())))
        }
        Err(e) => {
            error!(error = %e, photo_id = %photo_id, "Failed to get photo");
            Err(crate::commands::AppError::Internal(e.to_string()))
        }
    }
}

/// Delete a photo by its ID.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn document_delete_photo(
    state: AppState<'_>,
    session_token: String,
    photo_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<()>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let _current_user = authenticate!(&session_token, &state, UserRole::Technician);
    crate::commands::update_correlation_context_user(&_current_user.user_id);

    match state.photo_service.delete_photo(&photo_id) {
        Ok(()) => {
            info!(photo_id = %photo_id, "Photo deleted");
            Ok(ApiResponse::success(()).with_correlation_id(Some(correlation_id.clone())))
        }
        Err(e) => {
            error!(error = %e, photo_id = %photo_id, "Failed to delete photo");
            Err(crate::commands::AppError::Internal(e.to_string()))
        }
    }
}

/// Read binary photo data by photo ID.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn document_get_photo_data(
    state: AppState<'_>,
    session_token: String,
    photo_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Vec<u8>>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let _current_user = authenticate!(&session_token, &state);
    crate::commands::update_correlation_context_user(&_current_user.user_id);

    match state.photo_service.read_photo_data(&photo_id) {
        Ok(data) => {
            Ok(ApiResponse::success(data).with_correlation_id(Some(correlation_id.clone())))
        }
        Err(e) => {
            error!(error = %e, photo_id = %photo_id, "Failed to read photo data");
            Err(crate::commands::AppError::Internal(e.to_string()))
        }
    }
}

/// Update photo metadata.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn document_update_photo_metadata(
    state: AppState<'_>,
    session_token: String,
    photo_id: String,
    updates: PhotoMetadataUpdate,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Photo>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let _current_user = authenticate!(&session_token, &state, UserRole::Technician);
    crate::commands::update_correlation_context_user(&_current_user.user_id);

    match state
        .photo_service
        .update_photo_metadata(&photo_id, updates)
    {
        Ok(photo) => {
            info!(photo_id = %photo_id, "Photo metadata updated");
            Ok(ApiResponse::success(photo).with_correlation_id(Some(correlation_id.clone())))
        }
        Err(e) => {
            error!(error = %e, photo_id = %photo_id, "Failed to update photo metadata");
            Err(crate::commands::AppError::Internal(e.to_string()))
        }
    }
}

/// Export an intervention report to a generated PDF in app-managed storage.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn export_intervention_report(
    state: AppState<'_>,
    session_token: String,
    intervention_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<InterventionReportResult>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let current_user = authenticate!(&session_token, &state);
    crate::commands::update_correlation_context_user(&current_user.user_id);

    let intervention_data = report_export_service::get_intervention_with_details(
        &intervention_id,
        &state.db,
        Some(&state.intervention_service),
        Some(&state.client_service),
    )
    .await?;

    report_export_service::check_intervention_export_permissions(
        intervention_data.intervention.technician_id.clone(),
        &current_user,
    )?;

    let result =
        report_export_service::export_intervention_report(&intervention_data, &state.app_data_dir)
            .await?;

    Ok(ApiResponse::success(result).with_correlation_id(Some(correlation_id)))
}

/// Save an intervention report directly to a user-selected path.
#[tauri::command]
#[instrument(skip(state, session_token))]
pub async fn save_intervention_report(
    state: AppState<'_>,
    session_token: String,
    intervention_id: String,
    file_path: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<String>, crate::commands::AppError> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let current_user = authenticate!(&session_token, &state);
    crate::commands::update_correlation_context_user(&current_user.user_id);

    let intervention_data = report_export_service::get_intervention_with_details(
        &intervention_id,
        &state.db,
        Some(&state.intervention_service),
        Some(&state.client_service),
    )
    .await?;

    report_export_service::check_intervention_export_permissions(
        intervention_data.intervention.technician_id.clone(),
        &current_user,
    )?;

    let saved_path =
        report_export_service::save_intervention_report(&intervention_data, &file_path).await?;

    Ok(ApiResponse::success(saved_path).with_correlation_id(Some(correlation_id)))
}
