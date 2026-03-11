use std::sync::Arc;

use rpma_ppf_intervention::db::Database;
use rpma_ppf_intervention::shared::repositories::Repositories;
use rpma_ppf_intervention::shared::services::cross_domain::{
    ActionResult, AuditEventType, AuditService, AuthService, CreateQuoteRequest, QuotesFacade,
    QuoteService, UserRole,
};
use rpma_ppf_intervention::shared::services::event_system::InMemoryEventBus;

async fn setup_db() -> Arc<Database> {
    Arc::new(Database::new_in_memory().await.expect("in-memory db"))
}

#[tokio::test]
async fn session_creation_rbac_enforcement_and_expiry_are_enforced() {
    let db = setup_db().await;
    let repos = Repositories::new(db.clone(), 64).await;

    let quote_service = Arc::new(QuoteService::new(
        repos.quote.clone(),
        db.clone(),
        Arc::new(InMemoryEventBus::new()),
    ));
    let quotes = QuotesFacade::new(quote_service);

    let auth = AuthService::new(db.as_ref().clone()).expect("auth service");
    auth.init().expect("init auth");

    let audit = AuditService::new(db.clone());
    audit.init().expect("init audit");

    let viewer = auth
        .create_account(
            "viewer@rpma.test",
            "viewer_user",
            "View",
            "Only",
            UserRole::Viewer,
            "SecurePass123!",
        )
        .expect("create viewer");

    let session = auth
        .authenticate("viewer@rpma.test", "SecurePass123!", Some("127.0.0.1"))
        .expect("authenticate");

    audit
        .log_security_event(
            AuditEventType::AuthenticationSuccess,
            &viewer.id,
            "viewer_login",
            Some("127.0.0.1"),
            Some("session created".to_string()),
            ActionResult::Success,
        )
        .expect("audit login");

    let rbac_err = quotes
        .create(
            &UserRole::Viewer,
            CreateQuoteRequest {
                client_id: "client-forbidden".to_string(),
                task_id: None,
                valid_until: None,
                notes: Some("should fail".to_string()),
                terms: None,
                vehicle_plate: Some("RBAC-001".to_string()),
                vehicle_make: None,
                vehicle_model: Some("Model".to_string()),
                vehicle_year: None,
                vehicle_vin: None,
                items: vec![],
            },
            &viewer.id,
        )
        .expect_err("viewer should not be allowed to create quote");
    assert!(
        format!("{rbac_err:?}").contains("Superviseurs")
            || format!("{rbac_err:?}").contains("Authorization"),
        "expected authorization failure, got: {rbac_err:?}"
    );

    audit
        .log_security_event(
            AuditEventType::AuthorizationDenied,
            &viewer.id,
            "quote_create_denied",
            Some("127.0.0.1"),
            Some("viewer denied quote creation".to_string()),
            ActionResult::Failed("forbidden".to_string()),
        )
        .expect("audit deny");

    db.execute(
        "UPDATE sessions SET expires_at = strftime('%s','now') * 1000 - 1000 WHERE id = ?1",
        [session.token.clone()],
    )
    .expect("expire session");

    let expired = auth.validate_session(&session.token);
    assert!(expired.is_err(), "session should be expired");

    let removed = auth.cleanup_expired_sessions().expect("cleanup expired");
    assert!(removed >= 1, "expected expired session cleanup");

    audit
        .log_security_event(
            AuditEventType::SecurityViolation,
            &viewer.id,
            "expired_session_cleanup",
            Some("127.0.0.1"),
            Some("expired session removed".to_string()),
            ActionResult::Success,
        )
        .expect("audit expiry");

    let security_history = audit
        .get_resource_history("security", "viewer_login", Some(20))
        .expect("security history");
    assert!(
        security_history
            .iter()
            .any(|e| e.event_type == AuditEventType::AuthenticationSuccess),
        "expected authentication audit entry"
    );
}
