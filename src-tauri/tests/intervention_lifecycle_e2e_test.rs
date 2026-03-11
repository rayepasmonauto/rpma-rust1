use std::sync::Arc;

use chrono::Utc;
use rpma_ppf_intervention::db::Database;
use rpma_ppf_intervention::shared::services::cross_domain::{
    ActionResult, AdvanceStepRequest, AuditEventType, AuditService, CreateTaskRequest,
    FinalizeInterventionRequest, InterventionService, StartInterventionRequest, TaskService,
    TaskStatus,
};

async fn setup_db() -> Arc<Database> {
    Arc::new(Database::new_in_memory().await.expect("in-memory db"))
}

#[tokio::test]
async fn intervention_lifecycle_start_advance_finalize_persists_and_audits() {
    let db = setup_db().await;
    let audit = AuditService::new(db.clone());
    audit.init().expect("init audit");

    let task_service = TaskService::new(db.clone());
    let intervention_service = InterventionService::new(db.clone());

    let task = task_service
        .create_task_async(
            CreateTaskRequest {
                vehicle_plate: "LIFECYCLE-001".to_string(),
                vehicle_model: "Model X".to_string(),
                ppf_zones: vec!["hood".to_string(), "door_left".to_string()],
                scheduled_date: Utc::now().to_rfc3339(),
                external_id: None,
                status: Some(TaskStatus::Pending),
                technician_id: Some("tech-lifecycle".to_string()),
                start_time: None,
                end_time: None,
                checklist_completed: Some(false),
                notes: Some("Lifecycle integration test".to_string()),
                title: Some("Lifecycle task".to_string()),
                vehicle_make: Some("Tesla".to_string()),
                vehicle_year: Some("2026".to_string()),
                vin: None,
                date_rdv: None,
                heure_rdv: None,
                lot_film: None,
                customer_name: Some("Lifecycle Customer".to_string()),
                customer_email: Some("life@example.com".to_string()),
                customer_phone: None,
                customer_address: None,
                custom_ppf_zones: None,
                template_id: None,
                workflow_id: None,
                task_number: None,
                creator_id: None,
                created_by: Some("tester".to_string()),
                description: None,
                priority: None,
                client_id: None,
                estimated_duration: Some(90),
                tags: None,
            },
            "tester",
        )
        .await
        .expect("create task");

    let started = intervention_service
        .start_intervention(
            StartInterventionRequest {
                task_id: task.id.clone(),
                intervention_number: None,
                ppf_zones: vec!["hood".to_string(), "door_left".to_string()],
                custom_zones: None,
                film_type: "premium".to_string(),
                film_brand: Some("TestBrand".to_string()),
                film_model: None,
                weather_condition: "clear".to_string(),
                lighting_condition: "good".to_string(),
                work_location: "shop".to_string(),
                temperature: None,
                humidity: None,
                technician_id: "tech-lifecycle".to_string(),
                assistant_ids: None,
                scheduled_start: Utc::now().to_rfc3339(),
                estimated_duration: 90,
                gps_coordinates: None,
                address: None,
                notes: Some("Start lifecycle flow".to_string()),
                customer_requirements: None,
                special_instructions: None,
            },
            "tester",
            "it-lifecycle",
        )
        .expect("start intervention");

    audit
        .log_intervention_event::<serde_json::Value, serde_json::Value>(
            AuditEventType::InterventionStarted,
            "tester",
            &started.intervention.id,
            "Intervention started for lifecycle flow",
            None,
            None,
            ActionResult::Success,
        )
        .expect("audit start");

    for step in &started.steps {
        intervention_service
            .advance_step(
                AdvanceStepRequest {
                    intervention_id: started.intervention.id.clone(),
                    step_id: step.id.clone(),
                    collected_data: serde_json::json!({ "ok": true, "step": step.step_number }),
                    photos: Some(vec!["step-photo".to_string()]),
                    notes: Some("Completed step".to_string()),
                    quality_check_passed: true,
                    issues: None,
                },
                "it-lifecycle",
                Some("tester"),
            )
            .await
            .expect("advance step");
    }

    intervention_service
        .finalize_intervention(
            FinalizeInterventionRequest {
                intervention_id: started.intervention.id.clone(),
                collected_data: Some(serde_json::json!({ "finalized": true })),
                photos: Some(vec!["final-photo".to_string()]),
                customer_satisfaction: Some(10),
                quality_score: Some(9),
                final_observations: Some(vec!["Done".to_string()]),
                customer_signature: Some("signed".to_string()),
                customer_comments: Some("Great".to_string()),
            },
            "it-lifecycle",
            Some("tester"),
        )
        .expect("finalize intervention");

    audit
        .log_intervention_event::<serde_json::Value, serde_json::Value>(
            AuditEventType::InterventionCompleted,
            "tester",
            &started.intervention.id,
            "Intervention finalized for lifecycle flow",
            None,
            None,
            ActionResult::Success,
        )
        .expect("audit finalize");

    let status: String = db
        .query_single_value(
            "SELECT status FROM interventions WHERE id = ?1",
            [started.intervention.id.clone()],
        )
        .expect("intervention status");
    assert_eq!(status, "completed");

    let completed_steps: i64 = db
        .query_single_value(
            "SELECT COUNT(*) FROM intervention_steps WHERE intervention_id = ?1 AND status = 'completed'",
            [started.intervention.id.clone()],
        )
        .expect("completed steps");
    assert_eq!(completed_steps as usize, started.steps.len());

    let audit_entries = audit
        .get_resource_history("intervention", &started.intervention.id, Some(20))
        .expect("audit history");
    assert!(
        audit_entries.iter().any(|e| e.event_type == AuditEventType::InterventionStarted)
            && audit_entries
                .iter()
                .any(|e| e.event_type == AuditEventType::InterventionCompleted),
        "expected start and completion audit entries"
    );

}
