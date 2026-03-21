//! Application-layer contracts (DTOs) for the Quotes bounded context.

use crate::domains::quotes::domain::models::quote::*;
use serde::Deserialize;
use ts_rs::TS;

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteCreateRequest {
    pub data: CreateQuoteRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteGetRequest {
    pub id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteListRequest {
    #[serde(default)]
    pub filters: QuoteQuery,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteUpdateRequest {
    pub id: String,
    pub data: UpdateQuoteRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteDeleteRequest {
    pub id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteItemAddRequest {
    pub quote_id: String,
    pub item: CreateQuoteItemRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteItemUpdateRequest {
    pub quote_id: String,
    pub item_id: String,
    pub data: UpdateQuoteItemRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteItemDeleteRequest {
    pub quote_id: String,
    pub item_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteStatusRequest {
    pub id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteDuplicateRequest {
    pub id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteAttachmentsGetRequest {
    pub quote_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteAttachmentCreateRequest {
    pub quote_id: String,
    pub data: CreateQuoteAttachmentRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteAttachmentUpdateRequest {
    pub quote_id: String,
    pub attachment_id: String,
    pub data: UpdateQuoteAttachmentRequest,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteAttachmentDeleteRequest {
    pub quote_id: String,
    pub attachment_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// TODO: document
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteAttachmentOpenRequest {
    pub attachment_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// Request to fetch aggregate quote statistics.
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteGetStatsRequest {
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// Request to convert an accepted quote into a task.
///
/// The `vehicle_*` and `scheduled_date` fields provide the data
/// needed to create the corresponding task at the IPC orchestration
/// layer.
#[derive(Deserialize, Debug, TS)]
#[serde(deny_unknown_fields)]
#[ts(export)]
pub struct QuoteConvertToTaskRequest {
    pub quote_id: String,
    pub vehicle_plate: String,
    pub vehicle_model: String,
    pub vehicle_make: Option<String>,
    pub vehicle_year: Option<String>,
    pub vehicle_vin: Option<String>,
    pub scheduled_date: Option<String>,
    pub ppf_zones: Option<Vec<String>>,
    #[serde(default)]
    pub correlation_id: Option<String>,
}
