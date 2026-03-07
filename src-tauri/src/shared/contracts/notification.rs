//! Shared contract for sending notifications across bounded contexts.
//!
//! This trait allows domains (e.g. tasks) to send notifications without
//! depending directly on the notifications infrastructure.

use async_trait::async_trait;

use crate::shared::ipc::errors::AppError;

/// Minimal information about a sent message returned to callers.
pub struct SentMessage {
    pub id: String,
}

/// Port for sending notifications across bounded-context boundaries.
#[async_trait]
#[allow(clippy::too_many_arguments)]
pub trait NotificationSender: Send + Sync {
    /// Send a message without exposing domain-specific request types.
    async fn send_message_raw(
        &self,
        message_type: String,
        recipient_id: Option<String>,
        recipient_email: Option<String>,
        recipient_phone: Option<String>,
        subject: Option<String>,
        body: String,
        task_id: Option<String>,
        client_id: Option<String>,
        priority: Option<String>,
        scheduled_at: Option<i64>,
        correlation_id: Option<String>,
    ) -> Result<SentMessage, AppError>;
}
