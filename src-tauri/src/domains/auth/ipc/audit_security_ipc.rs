//! Security audit IPC commands
//!
//! ADR-018: Thin IPC layer — queries delegated to AuditService.
//! Exposes audit-event data to the admin security dashboard.

use crate::commands::{ApiResponse, AppError, AppState};
use crate::resolve_context;
use crate::shared::contracts::auth::UserRole;
use chrono::Utc;
// ARCH VIOLATION: `rusqlite` imported directly in the IPC layer. All DB access must live in
// infrastructure/. TODO: Create infrastructure/audit_repository.rs with query methods and
// expose them through an application/audit_service.rs; remove this import.
use rusqlite::params;
use serde::Serialize;
use tracing::instrument;

/// Security metrics derived from the audit_events table.
#[derive(Debug, Serialize)]
pub struct SecurityMetrics {
    pub total_events_today: i64,
    pub critical_alerts_today: i64,
    pub active_brute_force_attempts: i64,
    pub blocked_ips: i64,
    pub failed_auth_attempts_last_hour: i64,
    pub suspicious_activities_detected: i64,
}

/// A security event record returned to the frontend.
#[derive(Debug, Serialize)]
pub struct SecurityEventRecord {
    pub id: String,
    pub event_type: String,
    pub user_id: String,
    pub action: String,
    pub description: String,
    pub result: String,
    pub timestamp: String,
    pub ip_address: Option<String>,
}

/// A security alert derived from critical audit events.
#[derive(Debug, Serialize)]
pub struct SecurityAlert {
    pub id: String,
    pub event_id: String,
    pub title: String,
    pub description: String,
    pub severity: String,
    pub timestamp: String,
    pub acknowledged: bool,
    pub resolved: bool,
}

// ARCH VIOLATION: The set of event_type values that constitute a "security alert" is business
// logic (a domain policy) and must not be encoded as a constant in the IPC layer.
// TODO: Move SECURITY_ALERT_EVENT_TYPES to application/audit_service.rs or domain/policy.rs
// and reference it from there; remove from this file.
const SECURITY_ALERT_EVENT_TYPES: &[&str] = &[
    "AuthenticationFailure",
    "BruteForceAttempt",
    "SecurityViolation",
    "SuspiciousActivity",
    "RateLimitExceeded",
    "SqlInjectionAttempt",
    "XssAttempt",
    "PathTraversalAttempt",
];

// ARCH VIOLATION: Event-to-severity mapping is business logic that must not live in the IPC
// layer. TODO: Move `severity_for` to application/audit_service.rs (or domain/policy.rs) and
// call it from there; remove from this file.
fn severity_for(event_type: &str) -> &'static str {
    match event_type {
        "BruteForceAttempt" | "SecurityViolation" | "SqlInjectionAttempt"
        | "XssAttempt" | "PathTraversalAttempt" => "critical",
        "AuthenticationFailure" | "SuspiciousActivity" | "RateLimitExceeded" => "warning",
        _ => "info",
    }
}

// ARCH VIOLATION: `get_security_metrics` executes a raw multi-column SQL query
// (conn.query_row + params!) directly inside an IPC handler. DB access belongs in
// infrastructure/; orchestration and KPI derivation belong in application/.
// TODO: Add `AuditRepository::get_security_metrics(today_start_ms, last_hour_ms)` in
// infrastructure/audit_repository.rs, create `AuditService::security_metrics()` in
// application/audit_service.rs, and replace this body with a single delegate call.
/// Return today's security KPIs from the audit_events table.
///
/// ADR-018: Admin-only endpoint.
#[tauri::command]
#[instrument(skip(state))]
pub async fn get_security_metrics(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<SecurityMetrics>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);

    let now_ms = Utc::now().timestamp_millis();
    let today_start_ms = now_ms - (now_ms % 86_400_000); // floor to midnight UTC
    let last_hour_ms = now_ms - 3_600_000;

    let conn = state.db.get_connection().map_err(AppError::Database)?;

    let metrics = conn
        .query_row(
            r#"
            SELECT
                COUNT(CASE WHEN timestamp >= ?1 THEN 1 END)                                      AS total_events_today,
                COUNT(CASE WHEN event_type IN ('AuthenticationFailure','BruteForceAttempt','SecurityViolation','SuspiciousActivity')
                           AND timestamp >= ?1 THEN 1 END)                                       AS critical_alerts_today,
                COUNT(CASE WHEN event_type = 'BruteForceAttempt' AND timestamp >= ?1 THEN 1 END) AS active_brute_force_attempts,
                0                                                                                AS blocked_ips,
                COUNT(CASE WHEN event_type = 'AuthenticationFailure' AND timestamp >= ?2 THEN 1 END) AS failed_auth_attempts_last_hour,
                COUNT(CASE WHEN event_type IN ('SuspiciousActivity','SecurityViolation')
                           AND timestamp >= ?1 THEN 1 END)                                       AS suspicious_activities_detected
            FROM audit_events
            "#,
            params![today_start_ms, last_hour_ms],
            |row| {
                Ok(SecurityMetrics {
                    total_events_today: row.get(0)?,
                    critical_alerts_today: row.get(1)?,
                    active_brute_force_attempts: row.get(2)?,
                    blocked_ips: row.get(3)?,
                    failed_auth_attempts_last_hour: row.get(4)?,
                    suspicious_activities_detected: row.get(5)?,
                })
            },
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(ApiResponse::success(metrics).with_correlation_id(Some(ctx.correlation_id)))
}

// ARCH VIOLATION: `get_security_events` calls conn.prepare() + conn.query_map() with raw SQL
// directly inside an IPC handler. DB access belongs in infrastructure/.
// TODO: Add `AuditRepository::list_events(limit: i64) -> Vec<SecurityEventRecord>` in
// infrastructure/audit_repository.rs, wire through application/audit_service.rs, and replace
// this body with a single delegate call.
/// Return a paginated list of recent audit events.
///
/// ADR-018: Admin-only endpoint.
#[tauri::command]
#[instrument(skip(state))]
pub async fn get_security_events(
    limit: Option<i64>,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<Vec<SecurityEventRecord>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);

    let page_limit = limit.unwrap_or(50).min(200);

    let conn = state.db.get_connection().map_err(AppError::Database)?;
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, event_type, user_id, action, description, result, timestamp, ip_address
            FROM audit_events
            ORDER BY timestamp DESC
            LIMIT ?1
            "#,
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    let events = stmt
        .query_map(params![page_limit], |row| {
            let ts_ms: i64 = row.get(6)?;
            let ts = chrono::DateTime::from_timestamp_millis(ts_ms)
                .unwrap_or_else(Utc::now)
                .to_rfc3339();
            Ok(SecurityEventRecord {
                id: row.get(0)?,
                event_type: row.get(1)?,
                user_id: row.get(2)?,
                action: row.get(3)?,
                description: row.get(4)?,
                result: row.get(5)?,
                timestamp: ts,
                ip_address: row.get(7)?,
            })
        })
        .map_err(|e| AppError::Database(e.to_string()))?
        .filter_map(|r| r.ok())
        .collect::<Vec<_>>();

    Ok(ApiResponse::success(events).with_correlation_id(Some(ctx.correlation_id)))
}

// ARCH VIOLATION: `get_security_alerts` calls conn.prepare() + conn.query_map() with a
// dynamically-built SQL string directly in an IPC handler. DB access belongs in
// infrastructure/; alert-type filtering belongs in application/.
// TODO: Add `AuditRepository::list_alerts(event_types: &[&str], limit: i64)` in
// infrastructure/audit_repository.rs, create `AuditService::security_alerts()` in
// application/audit_service.rs (using the moved SECURITY_ALERT_EVENT_TYPES constant), and
// replace this body with a single delegate call.
/// Return recent security-specific audit events as alerts.
///
/// ADR-018: Admin-only endpoint.
#[tauri::command]
#[instrument(skip(state))]
pub async fn get_security_alerts(
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<Vec<SecurityAlert>>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);

    let placeholders = SECURITY_ALERT_EVENT_TYPES
        .iter()
        .enumerate()
        .map(|(i, _)| format!("?{}", i + 1))
        .collect::<Vec<_>>()
        .join(",");

    let sql = format!(
        r#"
        SELECT id, event_type, description, timestamp
        FROM audit_events
        WHERE event_type IN ({placeholders})
        ORDER BY timestamp DESC
        LIMIT 100
        "#
    );

    let conn = state.db.get_connection().map_err(AppError::Database)?;
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| AppError::Database(e.to_string()))?;

    let alerts = stmt
        .query_map(rusqlite::params_from_iter(SECURITY_ALERT_EVENT_TYPES.iter()), |row| {
            let event_type: String = row.get(1)?;
            let ts_ms: i64 = row.get(3)?;
            let ts = chrono::DateTime::from_timestamp_millis(ts_ms)
                .unwrap_or_else(Utc::now)
                .to_rfc3339();
            let id: String = row.get(0)?;
            let description: String = row.get(2)?;
            let severity = severity_for(&event_type).to_string();
            let title = event_type.clone();
            Ok(SecurityAlert {
                id: id.clone(),
                event_id: id,
                title,
                description,
                severity,
                timestamp: ts,
                acknowledged: false,
                resolved: false,
            })
        })
        .map_err(|e| AppError::Database(e.to_string()))?
        .filter_map(|r| r.ok())
        .collect::<Vec<_>>();

    Ok(ApiResponse::success(alerts).with_correlation_id(Some(ctx.correlation_id)))
}

/// Acknowledge a security alert (no-op: alert state is derived from audit events).
///
/// ADR-018: Admin-only endpoint.
#[tauri::command]
#[instrument(skip(state))]
pub async fn acknowledge_security_alert(
    alert_id: String,
    correlation_id: Option<String>,
    state: AppState<'_>,
) -> Result<ApiResponse<()>, AppError> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    tracing::debug!(alert_id = %alert_id, "Security alert acknowledge requested (no-op)");
    Ok(ApiResponse::success(()).with_correlation_id(Some(ctx.correlation_id)))
}
