#[cfg(test)]
mod tests {
    #[test]
    fn capabilities_are_exposed() {
        let caps = crate::domains::reports::ReportsFacade::get_capabilities();
        assert_eq!(caps.status, "scaffold");
    }
}
