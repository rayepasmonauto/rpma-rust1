//! Row-to-domain mapping for intervention entities.

use crate::db::FromSqlRow;
use crate::domains::interventions::domain::models::intervention::{
    Intervention, InterventionStatus, InterventionType,
};
use crate::domains::interventions::domain::models::step::{InterventionStep, StepStatus, StepType};
use crate::shared::contracts::common::{now, Timestamp, TimestampString};
use rusqlite::Row;
use std::str::FromStr;

/// Deserialize an `Option<String>` column that contains JSON into `Option<T>`.
/// Returns `None` if the column is NULL or if parsing fails.
fn parse_json_opt<T: serde::de::DeserializeOwned>(raw: Option<String>) -> Option<T> {
    raw.and_then(|s| serde_json::from_str(&s).ok())
}

/// Deserialize an `Option<String>` column that stores an enum variant as a bare
/// word into `Option<T>` by wrapping the value in JSON string quotes first.
/// Returns `None` if the column is NULL or if parsing fails.
fn parse_json_string_opt<T: serde::de::DeserializeOwned>(raw: Option<String>) -> Option<T> {
    raw.and_then(|s| serde_json::from_str(&format!(r#""{}""#, s)).ok())
}

impl FromSqlRow for Intervention {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        let ppf_zones = parse_json_opt(row.get::<_, Option<String>>("ppf_zones_config")?);

        let start_location_lat: Option<f64> = row.get("start_location_lat")?;
        let start_location_lon: Option<f64> = row.get("start_location_lon")?;
        let start_location_accuracy: Option<f64> = row.get("start_location_accuracy")?;
        let end_location_lat: Option<f64> = row.get("end_location_lat")?;
        let end_location_lon: Option<f64> = row.get("end_location_lon")?;
        let end_location_accuracy: Option<f64> = row.get("end_location_accuracy")?;

        Ok(Self {
            id: row
                .get::<_, Option<String>>("id")?
                .unwrap_or_else(|| crate::shared::utils::uuid::generate_uuid_string()),
            task_id: row
                .get::<_, Option<String>>("task_id")?
                .unwrap_or_else(|| "UNKNOWN".to_string()),
            task_number: row.get("task_number")?,
            status: {
                let status_str = row
                    .get::<_, Option<String>>("status")?
                    .unwrap_or_else(|| "pending".to_string());
                InterventionStatus::from_str(&status_str).unwrap_or(InterventionStatus::default())
            },
            vehicle_plate: row
                .get::<_, Option<String>>("vehicle_plate")?
                .unwrap_or_else(|| "UNKNOWN".to_string()),
            vehicle_model: row.get("vehicle_model")?,
            vehicle_make: row.get("vehicle_make")?,
            vehicle_year: row.get("vehicle_year")?,
            vehicle_color: row.get("vehicle_color")?,
            vehicle_vin: row.get("vehicle_vin")?,
            technician_id: row.get("technician_id")?,
            technician_name: row.get("technician_name")?,
            client_id: row.get("client_id")?,
            client_name: row.get("client_name")?,
            client_email: row.get("client_email")?,
            client_phone: row.get("client_phone")?,
            intervention_type: {
                let type_str = row
                    .get::<_, Option<String>>("intervention_type")?
                    .unwrap_or_else(|| "ppf".to_string());
                InterventionType::from_str(&type_str).unwrap_or(InterventionType::default())
            },
            current_step: row.get("current_step")?,
            completion_percentage: row.get("completion_percentage")?,
            ppf_zones_config: ppf_zones,
            ppf_zones_extended: parse_json_opt(row.get::<_, Option<String>>("ppf_zones_extended")?),
            film_type: parse_json_string_opt(row.get::<_, Option<String>>("film_type")?),
            film_brand: row.get("film_brand")?,
            film_model: row.get("film_model")?,
            scheduled_at: TimestampString(row.get("scheduled_at")?),
            started_at: TimestampString(row.get("started_at")?),
            completed_at: TimestampString(row.get("completed_at")?),
            paused_at: TimestampString(row.get("paused_at")?),
            estimated_duration: row.get("estimated_duration")?,
            actual_duration: row.get("actual_duration")?,
            weather_condition: parse_json_string_opt(row.get::<_, Option<String>>("weather_condition")?),
            lighting_condition: parse_json_string_opt(row.get::<_, Option<String>>("lighting_condition")?),
            work_location: parse_json_string_opt(row.get::<_, Option<String>>("work_location")?),
            temperature_celsius: row.get("temperature_celsius")?,
            humidity_percentage: row.get("humidity_percentage")?,
            start_location_lat,
            start_location_lon,
            start_location_accuracy,
            end_location_lat,
            end_location_lon,
            end_location_accuracy,
            customer_satisfaction: row.get("customer_satisfaction")?,
            quality_score: row.get("quality_score")?,
            final_observations: parse_json_opt(row.get::<_, Option<String>>("final_observations")?),
            customer_signature: row.get("customer_signature")?,
            customer_comments: row.get("customer_comments")?,
            metadata: parse_json_opt(row.get::<_, Option<String>>("metadata")?),
            notes: row.get("notes")?,
            special_instructions: row.get("special_instructions")?,
            device_info: parse_json_opt(row.get::<_, Option<String>>("device_info")?),
            app_version: row.get("app_version")?,
            synced: row.get::<_, Option<i32>>("synced")?.unwrap_or(0) == 1,
            last_synced_at: row.get("last_synced_at")?,
            sync_error: row.get("sync_error")?,
            created_at: row.get::<_, Option<i64>>("created_at")?.unwrap_or(now()),
            updated_at: row.get::<_, Option<i64>>("updated_at")?.unwrap_or(now()),
            created_by: row.get("created_by")?,
            updated_by: row.get("updated_by")?,
        })
    }
}

impl FromSqlRow for InterventionStep {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            intervention_id: row.get("intervention_id")?,
            step_number: row.get("step_number")?,
            step_name: row.get("step_name")?,
            step_type: {
                let type_str: String = row.get("step_type")?;
                StepType::from_str(&type_str).unwrap_or(StepType::default())
            },
            step_status: {
                let status_str: String = row.get("step_status")?;
                StepStatus::from_str(&status_str).unwrap_or(StepStatus::default())
            },
            description: row.get::<_, Option<String>>("description")?,
            instructions: parse_json_opt(row.get::<_, Option<String>>("instructions")?),
            quality_checkpoints: parse_json_opt(row.get::<_, Option<String>>("quality_checkpoints")?),
            is_mandatory: row.get::<_, i32>("is_mandatory")? == 1,
            requires_photos: row.get::<_, i32>("requires_photos")? == 1,
            min_photos_required: row.get("min_photos_required")?,
            max_photos_allowed: row.get("max_photos_allowed")?,
            started_at: TimestampString::new(row.get::<_, Option<Timestamp>>("started_at")?),
            completed_at: TimestampString::new(row.get::<_, Option<Timestamp>>("completed_at")?),
            paused_at: TimestampString::new(row.get::<_, Option<Timestamp>>("paused_at")?),
            duration_seconds: row.get::<_, Option<i32>>("duration_seconds")?,
            estimated_duration_seconds: row.get::<_, Option<i32>>("estimated_duration_seconds")?,
            step_data: parse_json_opt(row.get::<_, Option<String>>("step_data")?),
            collected_data: parse_json_opt(row.get::<_, Option<String>>("collected_data")?),
            measurements: parse_json_opt(row.get::<_, Option<String>>("measurements")?),
            observations: parse_json_opt(row.get::<_, Option<String>>("observations")?),
            photo_count: row.get("photo_count")?,
            required_photos_completed: row.get::<_, i32>("required_photos_completed")? == 1,
            photo_urls: parse_json_opt(row.get::<_, Option<String>>("photo_urls")?),
            validation_data: parse_json_opt(row.get::<_, Option<String>>("validation_data")?),
            validation_errors: parse_json_opt(row.get::<_, Option<String>>("validation_errors")?),
            validation_score: row.get::<_, Option<i32>>("validation_score")?,
            requires_supervisor_approval: row.get::<_, i32>("requires_supervisor_approval")? == 1,
            approved_by: row.get::<_, Option<String>>("approved_by")?,
            approved_at: TimestampString::new(row.get::<_, Option<Timestamp>>("approved_at")?),
            rejection_reason: row.get::<_, Option<String>>("rejection_reason")?,
            location_lat: row.get("location_lat")?,
            location_lon: row.get("location_lon")?,
            location_accuracy: row.get("location_accuracy")?,
            device_timestamp: TimestampString::new(
                row.get::<_, Option<Timestamp>>("device_timestamp")?,
            ),
            server_timestamp: TimestampString::new(
                row.get::<_, Option<Timestamp>>("server_timestamp")?,
            ),
            title: row.get::<_, Option<String>>("title")?,
            notes: row.get::<_, Option<String>>("notes")?,
            synced: row.get::<_, i32>("synced")? == 1,
            last_synced_at: TimestampString::new(
                row.get::<_, Option<Timestamp>>("last_synced_at")?,
            ),
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    }
}
