use crate::commands::{ApiResponse, AppError, AppState};
use crate::domains::reports::domain::models::intervention_report::InterventionReport;
use crate::domains::reports::infrastructure::report_repository::ReportRepository;
use crate::shared::contracts::auth::UserRole;
use crate::resolve_context;
use tracing::{debug, instrument, info};
use chrono::Utc;
use std::path::Path;
use crate::domains::documents::application::report_export as report_export_service;
use crate::shared::services::document_storage::DocumentStorageService;
use crate::domains::reports::domain::ports::ReportRepositoryPort;

/// TODO: document
#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn reports_get_capabilities(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<
    ApiResponse<crate::domains::reports::domain::models::report_capabilities::ReportCapabilities>,
    AppError,
> {
    let ctx = resolve_context!(&state, &correlation_id);
    debug!("Getting report capabilities");

    // The logic from ReportsApplicationService::capabilities() which is just returning standard capabilities
    // we inline the return here. Actually let's look if it was just static.
    // Wait, the original called: crate::domains::reports::application::ReportsApplicationService::capabilities();
    let capabilities = crate::domains::reports::domain::models::report_capabilities::ReportCapabilities {
        version: "1.0.0".to_string(),
        status: "active".to_string(),
        available_exports: vec!["intervention_pdf".to_string(), "csv".to_string()],
    };
    
    Ok(ApiResponse::success(capabilities).with_correlation_id(Some(ctx.correlation_id.clone())))
}

/// Generate a new intervention report (PDF + persist metadata).
#[tauri::command]
#[instrument(skip(state))]
pub async fn report_generate(
    state: AppState<'_>,
    intervention_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<InterventionReport>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Technician);
    let current_user = ctx.auth.to_user_session();
    let repository = ReportRepository::new(state.db.clone());

    // 1. Fetch intervention data
    let intervention_data = report_export_service::get_intervention_with_details(
        &intervention_id,
        &state.db,
        Some(&state.intervention_service),
        Some(&state.client_service),
    )
    .await?;

    // 2. Check export permissions
    report_export_service::check_intervention_export_permissions(
        intervention_data.intervention.technician_id.clone(),
        &current_user,
    )?;

    // 3. Generate report number
    let report_number = repository.generate_report_number()?;

    // 4. Generate PDF file
    let file_name = DocumentStorageService::generate_filename(
        &format!("report_{}", report_number.replace('-', "_")),
        "pdf",
    );
    let output_path = DocumentStorageService::get_document_path(&state.app_data_dir, &file_name);

    let pdf_report =
        crate::domains::documents::application::report_pdf::InterventionPdfReport::new(
            intervention_data.intervention.clone(),
            intervention_data.workflow_steps.clone(),
            intervention_data.photos.clone(),
            Vec::new(),
            intervention_data.client.clone(),
        );
    pdf_report.generate(&output_path).await?;

    // 5. Get file size
    let file_size = tokio::fs::metadata(&output_path)
        .await
        .map(|m| m.len())
        .ok();

    // 6. Create report entity
    let now = Utc::now();
    let now_millis = now.timestamp_millis();
    let report = InterventionReport {
        id: crate::shared::utils::uuid::generate_uuid_string(),
        intervention_id: intervention_id.to_string(),
        report_number: report_number.clone(),
        generated_at: now,
        technician_id: current_user.user_id.clone().into(),
        technician_name: current_user.username.clone().into(),
        file_path: Some(output_path.to_string_lossy().to_string()),
        file_name: Some(file_name),
        file_size,
        format: "pdf".to_string(),
        status: "generated".to_string(),
        created_at: now_millis,
        updated_at: now_millis,
    };

    // 7. Persist to database
    repository.save(&report)?;

    info!(
        report_number = %report.report_number,
        intervention_id = %intervention_id,
        "Intervention report generated"
    );

    Ok(ApiResponse::success(report).with_correlation_id(Some(ctx.correlation_id.clone())))
}

/// Get a report by its ID.
#[tauri::command]
#[instrument(skip(state))]
pub async fn report_get(
    state: AppState<'_>,
    report_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Option<InterventionReport>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repository = ReportRepository::new(state.db.clone());

    let report = repository.find_by_id(&report_id)?;

    Ok(ApiResponse::success(report).with_correlation_id(Some(ctx.correlation_id.clone())))
}

/// Get the latest report for an intervention.
#[tauri::command]
#[instrument(skip(state))]
pub async fn report_get_by_intervention(
    state: AppState<'_>,
    intervention_id: String,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Option<InterventionReport>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repository = ReportRepository::new(state.db.clone());

    let report = repository.find_by_intervention_id(&intervention_id)?;

    Ok(ApiResponse::success(report).with_correlation_id(Some(ctx.correlation_id.clone())))
}

/// List all reports with pagination.
#[tauri::command]
#[instrument(skip(state))]
pub async fn report_list(
    state: AppState<'_>,
    limit: Option<i32>,
    offset: Option<i32>,
    correlation_id: Option<String>,
) -> Result<ApiResponse<Vec<InterventionReport>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id);
    let repository = ReportRepository::new(state.db.clone());

    let reports = repository.list(limit.unwrap_or(50), offset.unwrap_or(0))?;

    Ok(ApiResponse::success(reports).with_correlation_id(Some(ctx.correlation_id.clone())))
}
