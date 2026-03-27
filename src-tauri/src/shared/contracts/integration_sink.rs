use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::shared::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationDispatchRequest {
    pub event_name: String,
    pub payload: serde_json::Value,
    pub correlation_id: String,
    pub requested_integration_ids: Option<Vec<String>>,
}

#[async_trait]
pub trait IntegrationEventSink: Send + Sync {
    async fn enqueue(&self, request: IntegrationDispatchRequest) -> Result<usize, AppError>;

    async fn process_pending(&self, limit: usize) -> Result<usize, AppError>;
}
