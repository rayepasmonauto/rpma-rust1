use crate::domains::reports::domain::models::report_capabilities::ReportCapabilities;

pub struct ReportsFacade;

impl ReportsFacade {
    pub fn get_capabilities() -> ReportCapabilities {
        crate::domains::reports::application::ReportsApplicationService::capabilities()
    }
}
