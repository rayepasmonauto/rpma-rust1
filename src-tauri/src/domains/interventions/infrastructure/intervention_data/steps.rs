use super::InterventionDataService;
use crate::db::{InterventionError, InterventionResult};
use crate::domains::interventions::domain::models::intervention::Intervention;
use crate::domains::interventions::domain::models::step::InterventionStep;
use crate::domains::interventions::infrastructure::intervention_types::AdvanceStepRequest;
use rusqlite::Transaction;

fn normalize_note(note: Option<&str>) -> Option<String> {
    note.and_then(|value| {
        let trimmed = value.trim();
        (!trimmed.is_empty()).then(|| trimmed.to_string())
    })
}

fn extract_note_from_collected_data(value: &serde_json::Value) -> Option<String> {
    value
        .as_object()
        .and_then(|data| data.get("notes"))
        .and_then(|note| note.as_str())
        .and_then(|note| normalize_note(Some(note)))
}

fn mirror_note_into_collected_data(
    collected_data: &serde_json::Value,
    note: Option<&str>,
) -> serde_json::Value {
    let resolved_note = normalize_note(note).or_else(|| extract_note_from_collected_data(collected_data));

    match collected_data {
        serde_json::Value::Null => match resolved_note {
            Some(note) => serde_json::json!({ "notes": note }),
            None => serde_json::Value::Null,
        },
        serde_json::Value::Object(map) => {
            let mut next_map = map.clone();
            match resolved_note {
                Some(note) => {
                    next_map.insert("notes".to_string(), serde_json::Value::String(note));
                }
                None => {
                    next_map.remove("notes");
                }
            }
            serde_json::Value::Object(next_map)
        }
        _ => collected_data.clone(),
    }
}

pub(crate) fn sync_step_note(
    step: &mut InterventionStep,
    collected_data: &serde_json::Value,
    explicit_note: Option<&str>,
) {
    let mirrored_data = mirror_note_into_collected_data(collected_data, explicit_note);
    step.notes = normalize_note(explicit_note).or_else(|| extract_note_from_collected_data(&mirrored_data));
    step.collected_data = Some(mirrored_data.clone());
    step.step_data = Some(mirrored_data);
}

pub(super) fn initialize_workflow_steps_with_tx(
    service: &InterventionDataService,
    tx: &Transaction,
    intervention: &Intervention,
) -> InterventionResult<Vec<InterventionStep>> {
    use crate::domains::interventions::infrastructure::workflow_strategy::{
        WorkflowContext, WorkflowStrategyFactory,
    };

    let workflow_context = WorkflowContext {
        intervention: intervention.clone(),
        user_id: "system".to_string(),
        environment_conditions: None,
    };

    let strategy = WorkflowStrategyFactory::create_strategy(intervention, &workflow_context);
    let workflow_result = strategy
        .initialize_workflow_sync(intervention, &workflow_context)
        .map_err(|e| InterventionError::Database(format!("Failed to initialize workflow: {}", e)))?;

    service.save_steps_batch_with_tx(tx, &workflow_result.steps)?;

    Ok(workflow_result.steps)
}

pub(super) fn update_step_with_data(
    step: &mut InterventionStep,
    request: &AdvanceStepRequest,
) -> InterventionResult<()> {
    sync_step_note(step, &request.collected_data, request.notes.as_deref());

    if let Some(photos) = &request.photos {
        step.photo_count = photos.len() as i32;
        step.photo_urls = Some(photos.clone());
    }

    if let Some(mut data) = step.collected_data.clone() {
        if let Some(obj) = data.as_object_mut() {
            obj.insert(
                "quality_check_passed".to_string(),
                serde_json::Value::Bool(request.quality_check_passed),
            );
            if let Some(issues) = &request.issues {
                obj.insert(
                    "issues".to_string(),
                    serde_json::to_value(issues).unwrap_or(serde_json::Value::Array(vec![])),
                );
            }
            sync_step_note(
                step,
                &serde_json::Value::Object(obj.clone()),
                request.notes.as_deref(),
            );
        }
    }

    Ok(())
}
