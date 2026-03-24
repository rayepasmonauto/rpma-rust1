use std::sync::Arc;

use async_trait::async_trait;

use crate::db::Database;
use crate::shared::event_bus::{DomainEvent, DomainEventHandler};
use crate::shared::repositories::cache::Cache;
use crate::shared::services::event_bus::InMemoryEventBus;

use super::helper::NotificationHelper;
use super::message_service::MessageService;

/// Handles system-wide domain events and translates them into user notifications.
pub struct NotificationEventHandler {
    db: Arc<Database>,
    cache: Arc<Cache>,
    message_service: Arc<MessageService>,
    event_bus: Arc<InMemoryEventBus>,
}

impl NotificationEventHandler {
    pub fn new(
        db: Arc<Database>,
        cache: Arc<Cache>,
        message_service: Arc<MessageService>,
        event_bus: Arc<InMemoryEventBus>,
    ) -> Self {
        Self {
            db,
            cache,
            message_service,
            event_bus,
        }
    }
}

#[async_trait]
impl DomainEventHandler for NotificationEventHandler {
    async fn handle(&self, event: &DomainEvent) -> Result<(), String> {
        match event {
            DomainEvent::TaskAssigned {
                task_id,
                technician_id,
                ..
            } => {
                // Here we might not have the full task title readily available in the event
                // but we map what we have. In a real scenario we'd fetch the task or add it to the event.
                let task_title = format!("Tâche {}", task_id);
                if let Err(e) = NotificationHelper::create_task_assigned(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    technician_id,
                    task_id,
                    &task_title,
                )
                .await
                {
                    tracing::error!("Failed to handle TaskAssigned notification: {}", e);
                }
            }
            DomainEvent::TaskStatusChanged {
                task_id,
                new_status,
                user_id,
                ..
            } => {
                let task_title = format!("Tâche {}", task_id);
                if let Err(e) = NotificationHelper::create_task_updated(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    user_id,
                    task_id,
                    &task_title,
                    new_status,
                )
                .await
                {
                    tracing::error!("Failed to handle TaskStatusChanged notification: {}", e);
                }
            }
            DomainEvent::InterventionCreated {
                intervention_id,
                task_id,
                user_id,
                ..
            } => {
                if let Err(e) = NotificationHelper::create_intervention_created(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    user_id,
                    intervention_id,
                    task_id,
                )
                .await
                {
                    tracing::error!("Failed to handle InterventionCreated notification: {}", e);
                }
            }
            DomainEvent::QuoteCreated {
                quote_id,
                client_id,
                created_by,
                ..
            } => {
                let client_name = format!("Client {}", client_id);
                if let Err(e) = NotificationHelper::create_quote_created(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    created_by,
                    quote_id,
                    &client_name,
                )
                .await
                {
                    tracing::error!("Failed to handle QuoteCreated notification: {}", e);
                }
            }
            DomainEvent::QuoteAccepted {
                quote_id,
                client_id,
                accepted_by,
                ..
            } => {
                let client_name = format!("Client {}", client_id);
                if let Err(e) = NotificationHelper::create_quote_approved(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    accepted_by,
                    quote_id,
                    &client_name,
                )
                .await
                {
                    tracing::error!("Failed to handle QuoteAccepted notification: {}", e);
                }
            }
            DomainEvent::ClientCreated {
                client_id,
                name,
                user_id,
                ..
            } => {
                if let Err(e) = NotificationHelper::create_client_created(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    user_id,
                    client_id,
                    name,
                )
                .await
                {
                    tracing::error!("Failed to handle ClientCreated notification: {}", e);
                }
            }
            DomainEvent::SystemError {
                error_message,
                component,
                ..
            } => {
                // Use a default system user or broadcast? For now use a placeholder or admin ID
                let title = format!("Erreur Système: {}", component);
                if let Err(e) = NotificationHelper::create_system_alert(
                    &self.db,
                    &self.cache,
                    &self.message_service,
                    &self.event_bus,
                    "system",
                    &title,
                    error_message,
                )
                .await
                {
                    tracing::error!("Failed to handle SystemError notification: {}", e);
                }
            }
            _ => {}
        }
        Ok(())
    }

    fn interested_events(&self) -> Vec<&'static str> {
        vec![
            DomainEvent::TASK_ASSIGNED,
            DomainEvent::TASK_STATUS_CHANGED,
            DomainEvent::INTERVENTION_CREATED,
            DomainEvent::QUOTE_CREATED,
            DomainEvent::QUOTE_ACCEPTED,
            DomainEvent::CLIENT_CREATED,
            DomainEvent::SYSTEM_ERROR,
        ]
    }
}
