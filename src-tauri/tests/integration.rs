//! Integration test harness entry point.
//!
//! Run with: `cd src-tauri && cargo test --test integration -- --nocapture`
//!
//! This file is the `[[test]]` entry point for the shared harness.
//! Domain-specific integration tests live in `tests/commands/` and have
//! their own `[[test]]` entries in `Cargo.toml`.

mod harness;

use chrono::Utc;
use rpma_ppf_intervention::domains::settings::UserSettingsRepository;
use rpma_ppf_intervention::shared::contracts::auth::UserRole;
use rpma_ppf_intervention::shared::contracts::notification::NotificationSender;
use rusqlite::params;

fn insert_test_user(app: &harness::app::TestApp, user_id: &str, role: &str) {
    app.db
        .execute(
            "INSERT INTO users (id, email, username, password_hash, first_name, last_name, full_name, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                user_id,
                format!("{user_id}@rpma.test"),
                user_id,
                "test-password-hash",
                "Test",
                "User",
                "Test User",
                role,
                1,
                Utc::now().timestamp_millis(),
                Utc::now().timestamp_millis(),
            ],
        )
        .expect("test user insert should succeed");
}

fn seeded_task_id(app: &harness::app::TestApp) -> String {
    app.db
        .query_single_value("SELECT id FROM tasks WHERE vehicle_plate = ?", params!["SEED-001"])
        .expect("seeded task lookup should succeed")
}

// ── Harness smoke tests ───────────────────────────────────────────────────────

#[tokio::test]
async fn test_harness_new_initialises_without_panic() {
    let _app = harness::app::TestApp::new().await;
}

#[tokio::test]
async fn test_harness_seeded_initialises_without_panic() {
    let _app = harness::app::TestApp::seeded().await;
}

#[tokio::test]
async fn test_harness_admin_ctx_has_admin_role() {
    let app = harness::app::TestApp::new().await;
    let ctx = app.admin_ctx();
    assert_eq!(*ctx.role(), UserRole::Admin);
}

#[tokio::test]
async fn test_harness_technician_ctx_has_technician_role() {
    let app = harness::app::TestApp::new().await;
    let ctx = app.technician_ctx();
    assert_eq!(*ctx.role(), UserRole::Technician);
}

#[tokio::test]
async fn test_harness_supervisor_ctx_has_supervisor_role() {
    let app = harness::app::TestApp::new().await;
    let ctx = app.supervisor_ctx();
    assert_eq!(*ctx.role(), UserRole::Supervisor);
}

#[tokio::test]
async fn test_harness_viewer_ctx_has_viewer_role() {
    let app = harness::app::TestApp::new().await;
    let ctx = app.viewer_ctx();
    assert_eq!(*ctx.role(), UserRole::Viewer);
}

#[tokio::test]
async fn test_harness_inject_and_clear_session() {
    let app = harness::app::TestApp::new().await;
    app.inject_session(UserRole::Admin);
    let session = app
        .state
        .session_store
        .get()
        .expect("session should be present after inject");
    assert_eq!(session.role, UserRole::Admin);

    app.clear_session();
    assert!(
        app.state.session_store.get().is_err(),
        "session store should be empty after clear_session()"
    );
}

#[tokio::test]
async fn test_harness_db_is_queryable() {
    let app = harness::app::TestApp::new().await;
    let count: i64 = app
        .db
        .query_single_value("SELECT COUNT(*) FROM tasks", [])
        .expect("tasks table should exist after migrations");
    assert_eq!(count, 0, "fresh database should have zero tasks");
}

#[tokio::test]
async fn test_harness_two_apps_are_isolated() {
    let app1 = harness::app::TestApp::new().await;
    let app2 = harness::app::TestApp::new().await;

    app1.db
        .execute(
            "INSERT INTO tasks (id, task_number, title, vehicle_plate, vehicle_model, ppf_zones, \
             scheduled_date, status, created_at, updated_at) \
             VALUES ('iso-test-id','TSK-ISO-001','Isolation task','ISO-1','Model','[\"hood\"]', \
             '2025-01-01T00:00:00Z','pending', \
             strftime('%s','now')*1000, strftime('%s','now')*1000)",
            [],
        )
        .expect("insert into app1");

    let count: i64 = app2
        .db
        .query_single_value("SELECT COUNT(*) FROM tasks WHERE id='iso-test-id'", [])
        .expect("query app2");
    assert_eq!(count, 0, "app2 database must be isolated from app1");
}

#[tokio::test]
async fn test_in_app_message_creates_notification_for_recipient() {
    let app = harness::app::TestApp::seeded().await;
    insert_test_user(&app, "test-user-Technician", "technician");
    let task_id = seeded_task_id(&app);

    let sent = app
        .state
        .message_service
        .send_message_raw(
            "in_app".to_string(),
            Some("task_assigned".to_string()),
            Some("test-user-Technician".to_string()),
            None,
            None,
            Some("Nouvelle affectation".to_string()),
            "Vous avez une nouvelle tache".to_string(),
            Some(task_id.clone()),
            None,
            Some("normal".to_string()),
            None,
            Some("test-corr".to_string()),
        )
        .await
        .expect("message should be queued");

    assert!(!sent.id.is_empty(), "message id should be returned");

    let count: i64 = app
        .db
        .query_single_value(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND entity_id = ?",
            rusqlite::params!["test-user-Technician", task_id],
        )
        .expect("notification count query should succeed");

    assert_eq!(count, 1, "recipient should receive one in-app notification");
}

#[tokio::test]
async fn test_in_app_message_skips_notification_when_category_disabled() {
    let app = harness::app::TestApp::seeded().await;
    let technician_id = "test-user-Technician";
    insert_test_user(&app, technician_id, "technician");
    let task_id = seeded_task_id(&app);
    let user_settings_repo = UserSettingsRepository::new(app.db.clone());
    let mut settings = user_settings_repo
        .get_user_settings(technician_id)
        .expect("default settings should be created");
    settings.notifications.task_completed = false;
    user_settings_repo
        .save_user_settings(technician_id, &settings)
        .expect("settings update should succeed");

    let sent = app
        .state
        .message_service
        .send_message_raw(
            "in_app".to_string(),
            Some("task_completed".to_string()),
            Some(technician_id.to_string()),
            None,
            None,
            Some("Tache terminee".to_string()),
            "Une tache vient d'etre terminee".to_string(),
            Some(task_id.clone()),
            None,
            Some("normal".to_string()),
            None,
            Some("test-corr".to_string()),
        )
        .await
        .expect("message should be queued");

    assert!(!sent.id.is_empty(), "message id should be returned");

    let count: i64 = app
        .db
        .query_single_value(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND entity_id = ? AND type = ?",
            rusqlite::params![technician_id, task_id, "task_completed"],
        )
        .expect("notification count query should succeed");

    assert_eq!(
        count, 0,
        "disabled task_completed preference must suppress in-app notification"
    );
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

#[test]
fn test_fixtures_client_fixture_has_correct_name() {
    let req = harness::fixtures::client_fixture("Acme Corp");
    assert_eq!(req.name, "Acme Corp");
}

#[test]
fn test_fixtures_task_fixture_has_correct_plate() {
    let req = harness::fixtures::task_fixture("TEST-001");
    assert_eq!(req.vehicle_plate, "TEST-001");
}

#[test]
fn test_fixtures_unique_id_produces_distinct_values() {
    let a = harness::fixtures::unique_id();
    let b = harness::fixtures::unique_id();
    assert_ne!(a, b);
}
