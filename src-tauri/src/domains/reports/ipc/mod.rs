use crate::authenticate;
use crate::commands::{ApiResponse, AppError, AppState};
use tracing::debug;

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn reports_get_capabilities(
    session_token: String,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<
    ApiResponse<crate::domains::reports::domain::models::report_capabilities::ReportCapabilities>,
    AppError,
> {
    let correlation_id = crate::commands::init_correlation_context(&correlation_id, None);
    debug!("Getting report capabilities");

    let current_user = authenticate!(&session_token, &state);
    crate::commands::update_correlation_context_user(&current_user.user_id);

    let capabilities =
        crate::domains::reports::application::ReportsApplicationService::capabilities();
    Ok(ApiResponse::success(capabilities).with_correlation_id(Some(correlation_id)))
}
