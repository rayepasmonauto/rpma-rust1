use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct ReportCapabilities {
    pub version: String,
    pub status: String,
    pub available_exports: Vec<String>,
}
