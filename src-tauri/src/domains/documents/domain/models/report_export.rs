use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Individual intervention report result payload returned to frontend export flows.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct InterventionReportResult {
    pub success: bool,
    pub download_url: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub format: String,
    pub file_size: Option<u64>,
    #[ts(type = "string")]
    pub generated_at: DateTime<Utc>,
}

/// Aggregated intervention data required for PDF report generation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteInterventionData {
    pub intervention: crate::shared::services::cross_domain::Intervention,
    pub workflow_steps: Vec<crate::shared::services::cross_domain::InterventionStep>,
    pub photos: Vec<crate::shared::services::cross_domain::Photo>,
    pub client: Option<crate::shared::services::cross_domain::Client>,
}
