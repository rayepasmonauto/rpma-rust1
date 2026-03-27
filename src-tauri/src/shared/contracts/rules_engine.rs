use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::shared::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleCheckRequest {
    pub trigger: String,
    pub entity_id: Option<String>,
    pub payload: serde_json::Value,
    pub user_id: String,
    pub correlation_id: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RuleCheckOutcome {
    pub allowed: bool,
    pub matched_rule_ids: Vec<String>,
    pub message: Option<String>,
}

#[async_trait]
pub trait BlockingRuleEngine: Send + Sync {
    async fn evaluate(&self, request: &RuleCheckRequest) -> Result<RuleCheckOutcome, AppError>;
}
