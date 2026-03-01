use crate::commands::{ApiResponse, AppError};

#[tauri::command]
pub async fn reports_get_capabilities(
    correlation_id: Option<String>,
) -> Result<
    ApiResponse<crate::domains::reports::domain::models::report_capabilities::ReportCapabilities>,
    AppError,
> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    let capabilities =
        crate::domains::reports::application::ReportsApplicationService::capabilities();
    Ok(ApiResponse::success(capabilities).with_correlation_id(Some(correlation_id)))
}
