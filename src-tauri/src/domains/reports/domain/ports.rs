use crate::commands::AppResult;
use crate::domains::reports::domain::models::intervention_report::InterventionReport;

/// Port for report persistence operations
pub trait ReportRepositoryPort: Send + Sync {
    /// Generate the next report number in INT-YYYY-NNNN format.
    fn generate_report_number(&self) -> AppResult<String>;

    /// Save a new intervention report record.
    fn save(&self, report: &InterventionReport) -> AppResult<()>;

    /// Find a report by its ID.
    fn find_by_id(&self, id: &str) -> AppResult<Option<InterventionReport>>;

    /// Find a report by intervention ID (returns the latest one).
    fn find_by_intervention_id(&self, intervention_id: &str) -> AppResult<Option<InterventionReport>>;

    /// List all reports, ordered by creation date (newest first).
    fn list(&self, limit: i32, offset: i32) -> AppResult<Vec<InterventionReport>>;
}
