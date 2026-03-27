use crate::domains::interventions::domain::models::intervention::Intervention;
use crate::domains::interventions::domain::models::step::InterventionStep;
use rusqlite::types::Value;

/// Serialized intervention fields ready for database storage.
pub(super) struct InterventionDbFields {
    pub(super) status: String,
    pub(super) intervention_type: String,
    pub(super) weather_condition: Option<String>,
    pub(super) lighting_condition: Option<String>,
    pub(super) work_location: Option<String>,
    pub(super) film_type: Option<String>,
    pub(super) ppf_zones_config_json: Option<String>,
    pub(super) ppf_zones_extended_json: Option<String>,
    pub(super) final_observations_json: Option<String>,
    pub(super) metadata_json: Option<String>,
    pub(super) device_info_json: Option<String>,
}

impl InterventionDbFields {
    pub(super) fn from_intervention(intervention: &Intervention) -> Self {
        Self {
            status: intervention.status.to_string(),
            intervention_type: intervention.intervention_type.to_string(),
            weather_condition: intervention
                .weather_condition
                .as_ref()
                .map(|wc| wc.to_string()),
            lighting_condition: intervention
                .lighting_condition
                .as_ref()
                .map(|lc| lc.to_string()),
            work_location: intervention.work_location.as_ref().map(|wl| wl.to_string()),
            film_type: intervention.film_type.as_ref().map(|ft| ft.to_string()),
            ppf_zones_config_json: intervention
                .ppf_zones_config
                .as_ref()
                .map(|zones| serde_json::to_string(zones).unwrap_or_default()),
            ppf_zones_extended_json: intervention
                .ppf_zones_extended
                .as_ref()
                .map(|zones| serde_json::to_string(zones).unwrap_or_default()),
            final_observations_json: intervention
                .final_observations
                .as_ref()
                .map(|obs| serde_json::to_string(obs).unwrap_or_default()),
            metadata_json: intervention
                .metadata
                .as_ref()
                .map(|meta| serde_json::to_string(meta).unwrap_or_default()),
            device_info_json: intervention
                .device_info
                .as_ref()
                .map(|info| serde_json::to_string(info).unwrap_or_default()),
        }
    }
}

/// Serialized step fields ready for database storage.
pub(super) struct StepDbFields {
    pub(super) step_type: String,
    pub(super) step_status: String,
    pub(super) instructions_json: Option<String>,
    pub(super) quality_checkpoints_json: Option<String>,
    pub(super) step_data_json: Option<String>,
    pub(super) collected_data_json: Option<String>,
    pub(super) measurements_json: Option<String>,
    pub(super) observations_json: Option<String>,
    pub(super) photo_urls_json: Option<String>,
    pub(super) validation_data_json: Option<String>,
    pub(super) validation_errors_json: Option<String>,
}

impl StepDbFields {
    pub(super) fn from_step(step: &InterventionStep) -> Self {
        Self {
            step_type: step.step_type.to_string(),
            step_status: step.step_status.to_string(),
            instructions_json: step
                .instructions
                .as_ref()
                .and_then(|i| serde_json::to_string(i).ok()),
            quality_checkpoints_json: step
                .quality_checkpoints
                .as_ref()
                .and_then(|qc| serde_json::to_string(qc).ok()),
            step_data_json: step
                .step_data
                .as_ref()
                .and_then(|sd| serde_json::to_string(sd).ok()),
            collected_data_json: step
                .collected_data
                .as_ref()
                .and_then(|cd| serde_json::to_string(cd).ok()),
            measurements_json: step
                .measurements
                .as_ref()
                .and_then(|m| serde_json::to_string(m).ok()),
            observations_json: step
                .observations
                .as_ref()
                .and_then(|obs| serde_json::to_string(obs).ok()),
            photo_urls_json: step
                .photo_urls
                .as_ref()
                .and_then(|urls| serde_json::to_string(urls).ok()),
            validation_data_json: step
                .validation_data
                .as_ref()
                .and_then(|vd| serde_json::to_string(vd).ok()),
            validation_errors_json: step
                .validation_errors
                .as_ref()
                .and_then(|ve| serde_json::to_string(ve).ok()),
        }
    }
}

pub(super) const INSERT_INTERVENTION_SQL: &str =
    "INSERT INTO interventions (
        id, task_id, status, vehicle_plate, vehicle_model, vehicle_make, vehicle_year,
        vehicle_color, vehicle_vin, client_id, client_name, client_email, client_phone,
        technician_id, technician_name, intervention_type, current_step, completion_percentage,
        ppf_zones_config, ppf_zones_extended, film_type, film_brand, film_model,
        scheduled_at, started_at, completed_at, paused_at, estimated_duration, actual_duration,
        weather_condition, lighting_condition, work_location, temperature_celsius, humidity_percentage,
        start_location_lat, start_location_lon, start_location_accuracy,
        end_location_lat, end_location_lon, end_location_accuracy,
        customer_satisfaction, quality_score, final_observations, customer_signature, customer_comments,
        metadata, notes, special_instructions, device_info, app_version,
        synced, last_synced_at, sync_error, created_at, updated_at, created_by, updated_by, task_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

pub(super) const UPDATE_INTERVENTION_SQL: &str =
    "UPDATE interventions SET
        status = ?, vehicle_plate = ?, vehicle_model = ?, vehicle_make = ?, vehicle_year = ?,
        vehicle_color = ?, vehicle_vin = ?, client_id = ?, client_name = ?, client_email = ?, client_phone = ?,
        technician_id = ?, technician_name = ?, intervention_type = ?, current_step = ?, completion_percentage = ?,
        ppf_zones_config = ?, ppf_zones_extended = ?, film_type = ?, film_brand = ?, film_model = ?,
        scheduled_at = ?, started_at = ?, completed_at = ?, paused_at = ?, estimated_duration = ?, actual_duration = ?,
        weather_condition = ?, lighting_condition = ?, work_location = ?, temperature_celsius = ?, humidity_percentage = ?,
        start_location_lat = ?, start_location_lon = ?, start_location_accuracy = ?,
        end_location_lat = ?, end_location_lon = ?, end_location_accuracy = ?,
        customer_satisfaction = ?, quality_score = ?, final_observations = ?, customer_signature = ?, customer_comments = ?,
        metadata = ?, notes = ?, special_instructions = ?, device_info = ?, app_version = ?,
        synced = ?, last_synced_at = ?, sync_error = ?, updated_at = ?, updated_by = ?
    WHERE id = ?";

pub(super) const STEP_UPSERT_SQL: &str =
    "INSERT OR REPLACE INTO intervention_steps (
        id, intervention_id, step_number, step_name, step_type, step_status,
        description, instructions, quality_checkpoints, is_mandatory, requires_photos,
        min_photos_required, max_photos_allowed, started_at, completed_at, paused_at,
        duration_seconds, estimated_duration_seconds, step_data, collected_data, measurements,
        observations, photo_count, required_photos_completed, photo_urls, validation_data,
        validation_errors, validation_score, requires_supervisor_approval, approved_by,
        approved_at, rejection_reason, location_lat, location_lon, location_accuracy,
        device_timestamp, server_timestamp, title, notes, synced, last_synced_at,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

pub(super) const SELECT_STEP_FIELDS_SQL: &str =
    "SELECT id, intervention_id, step_number, step_name, step_type, step_status,
            description, instructions, quality_checkpoints, is_mandatory, requires_photos,
            min_photos_required, max_photos_allowed, started_at, completed_at, paused_at,
            duration_seconds, estimated_duration_seconds, step_data, collected_data, measurements,
            observations, photo_count, required_photos_completed, photo_urls, validation_data,
            validation_errors, validation_score, requires_supervisor_approval, approved_by,
            approved_at, rejection_reason, location_lat, location_lon, location_accuracy,
            device_timestamp, server_timestamp, title, notes, synced, last_synced_at,
            created_at, updated_at
     FROM intervention_steps";

/// Build the params array for an INSERT intervention statement.
pub(super) fn insert_intervention_params(
    intervention: &Intervention,
    fields: &InterventionDbFields,
) -> Vec<Value> {
    vec![
        intervention.id.clone().into(),
        intervention.task_id.clone().into(),
        fields.status.clone().into(),
        intervention.vehicle_plate.clone().into(),
        intervention.vehicle_model.clone().into(),
        intervention.vehicle_make.clone().into(),
        intervention.vehicle_year.clone().into(),
        intervention.vehicle_color.clone().into(),
        intervention.vehicle_vin.clone().into(),
        intervention.client_id.clone().into(),
        intervention.client_name.clone().into(),
        intervention.client_email.clone().into(),
        intervention.client_phone.clone().into(),
        intervention.technician_id.clone().into(),
        intervention.technician_name.clone().into(),
        fields.intervention_type.clone().into(),
        intervention.current_step.into(),
        intervention.completion_percentage.into(),
        fields.ppf_zones_config_json.clone().into(),
        fields.ppf_zones_extended_json.clone().into(),
        fields.film_type.clone().into(),
        intervention.film_brand.clone().into(),
        intervention.film_model.clone().into(),
        intervention.scheduled_at.inner().into(),
        intervention.started_at.inner().into(),
        intervention.completed_at.inner().into(),
        intervention.paused_at.inner().into(),
        intervention.estimated_duration.into(),
        intervention.actual_duration.into(),
        fields.weather_condition.clone().into(),
        fields.lighting_condition.clone().into(),
        fields.work_location.clone().into(),
        intervention.temperature_celsius.into(),
        intervention.humidity_percentage.into(),
        intervention.start_location_lat.into(),
        intervention.start_location_lon.into(),
        intervention.start_location_accuracy.into(),
        intervention.end_location_lat.into(),
        intervention.end_location_lon.into(),
        intervention.end_location_accuracy.into(),
        intervention.customer_satisfaction.into(),
        intervention.quality_score.into(),
        fields.final_observations_json.clone().into(),
        intervention.customer_signature.clone().into(),
        intervention.customer_comments.clone().into(),
        fields.metadata_json.clone().into(),
        intervention.notes.clone().into(),
        intervention.special_instructions.clone().into(),
        fields.device_info_json.clone().into(),
        intervention.app_version.clone().into(),
        intervention.synced.into(),
        intervention.last_synced_at.into(),
        intervention.sync_error.clone().into(),
        intervention.created_at.into(),
        intervention.updated_at.into(),
        intervention.created_by.clone().into(),
        intervention.updated_by.clone().into(),
        intervention.task_number.clone().into(),
    ]
}

/// Build the params array for an UPDATE intervention statement.
pub(super) fn update_intervention_params(
    intervention: &Intervention,
    fields: &InterventionDbFields,
) -> Vec<Value> {
    vec![
        fields.status.clone().into(),
        intervention.vehicle_plate.clone().into(),
        intervention.vehicle_model.clone().into(),
        intervention.vehicle_make.clone().into(),
        intervention.vehicle_year.clone().into(),
        intervention.vehicle_color.clone().into(),
        intervention.vehicle_vin.clone().into(),
        intervention.client_id.clone().into(),
        intervention.client_name.clone().into(),
        intervention.client_email.clone().into(),
        intervention.client_phone.clone().into(),
        intervention.technician_id.clone().into(),
        intervention.technician_name.clone().into(),
        fields.intervention_type.clone().into(),
        intervention.current_step.into(),
        intervention.completion_percentage.into(),
        fields.ppf_zones_config_json.clone().into(),
        fields.ppf_zones_extended_json.clone().into(),
        fields.film_type.clone().into(),
        intervention.film_brand.clone().into(),
        intervention.film_model.clone().into(),
        intervention.scheduled_at.inner().into(),
        intervention.started_at.inner().into(),
        intervention.completed_at.inner().into(),
        intervention.paused_at.inner().into(),
        intervention.estimated_duration.into(),
        intervention.actual_duration.into(),
        fields.weather_condition.clone().into(),
        fields.lighting_condition.clone().into(),
        fields.work_location.clone().into(),
        intervention.temperature_celsius.into(),
        intervention.humidity_percentage.into(),
        intervention.start_location_lat.into(),
        intervention.start_location_lon.into(),
        intervention.start_location_accuracy.into(),
        intervention.end_location_lat.into(),
        intervention.end_location_lon.into(),
        intervention.end_location_accuracy.into(),
        intervention.customer_satisfaction.into(),
        intervention.quality_score.into(),
        fields.final_observations_json.clone().into(),
        intervention.customer_signature.clone().into(),
        intervention.customer_comments.clone().into(),
        fields.metadata_json.clone().into(),
        intervention.notes.clone().into(),
        intervention.special_instructions.clone().into(),
        fields.device_info_json.clone().into(),
        intervention.app_version.clone().into(),
        intervention.synced.into(),
        intervention.last_synced_at.into(),
        intervention.sync_error.clone().into(),
        intervention.updated_at.into(),
        intervention.updated_by.clone().into(),
        intervention.id.clone().into(),
    ]
}

pub(super) fn step_upsert_params(step: &InterventionStep, fields: &StepDbFields) -> Vec<Value> {
    vec![
        step.id.clone().into(),
        step.intervention_id.clone().into(),
        step.step_number.into(),
        step.step_name.clone().into(),
        fields.step_type.clone().into(),
        fields.step_status.clone().into(),
        step.description.clone().into(),
        fields.instructions_json.clone().into(),
        fields.quality_checkpoints_json.clone().into(),
        step.is_mandatory.into(),
        step.requires_photos.into(),
        step.min_photos_required.into(),
        step.max_photos_allowed.into(),
        step.started_at.inner().into(),
        step.completed_at.inner().into(),
        step.paused_at.inner().into(),
        step.duration_seconds.into(),
        step.estimated_duration_seconds.into(),
        fields.step_data_json.clone().into(),
        fields.collected_data_json.clone().into(),
        fields.measurements_json.clone().into(),
        fields.observations_json.clone().into(),
        step.photo_count.into(),
        step.required_photos_completed.into(),
        fields.photo_urls_json.clone().into(),
        fields.validation_data_json.clone().into(),
        fields.validation_errors_json.clone().into(),
        step.validation_score.into(),
        step.requires_supervisor_approval.into(),
        step.approved_by.clone().into(),
        step.approved_at.inner().into(),
        step.rejection_reason.clone().into(),
        step.location_lat.into(),
        step.location_lon.into(),
        step.location_accuracy.into(),
        step.device_timestamp.inner().into(),
        step.server_timestamp.inner().into(),
        step.title.clone().into(),
        step.notes.clone().into(),
        step.synced.into(),
        step.last_synced_at.inner().into(),
        step.created_at.into(),
        step.updated_at.into(),
    ]
}
