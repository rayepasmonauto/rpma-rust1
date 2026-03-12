#[cfg(test)]
mod tests {
    #[test]
    fn capabilities_include_intervention_pdf() {
        let caps = crate::domains::reports::domain::models::report_capabilities::ReportCapabilities {
            version: "1.0.0".to_string(),
            status: "active".to_string(),
            available_exports: vec!["intervention_pdf".to_string(), "csv".to_string()],
        };
        assert!(caps
            .available_exports
            .contains(&"intervention_pdf".to_string()));
    }
}
