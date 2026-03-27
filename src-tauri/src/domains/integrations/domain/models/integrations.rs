use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "snake_case")]
pub enum IntegrationKind {
    Webhook,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "snake_case")]
pub enum IntegrationStatus {
    Draft,
    Active,
    Disabled,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "snake_case")]
pub enum DeliveryStatus {
    Pending,
    Processing,
    Retrying,
    Delivered,
    DeadLetter,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct IntegrationConfig {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub kind: IntegrationKind,
    pub status: IntegrationStatus,
    pub endpoint_url: String,
    #[ts(type = "Record<string, string>")]
    pub headers: std::collections::HashMap<String, String>,
    pub subscribed_events: Vec<String>,
    pub has_secret: bool,
    pub last_tested_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct CreateIntegrationRequest {
    pub name: String,
    pub description: Option<String>,
    pub endpoint_url: String,
    #[ts(type = "Record<string, string>")]
    pub headers: std::collections::HashMap<String, String>,
    pub subscribed_events: Vec<String>,
    pub secret_token: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, TS)]
pub struct UpdateIntegrationRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub endpoint_url: Option<String>,
    #[ts(type = "Record<string, string> | null")]
    pub headers: Option<std::collections::HashMap<String, String>>,
    pub subscribed_events: Option<Vec<String>>,
    pub status: Option<IntegrationStatus>,
    pub secret_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct TestIntegrationResponse {
    pub success: bool,
    pub message: String,
    pub tested_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct OutboundDelivery {
    pub id: String,
    pub integration_id: String,
    pub event_name: String,
    #[ts(type = "JsonValue")]
    pub payload: serde_json::Value,
    pub status: DeliveryStatus,
    pub attempt_count: i64,
    pub last_error: Option<String>,
    pub next_retry_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}
