//! Repository contracts for the calendar domain (ADR-005).
//!
//! Concrete implementations live in the infrastructure layer.

use crate::shared::repositories::base::RepoResult;
use async_trait::async_trait;
use crate::domains::calendar::models::CalendarEvent;

/// Query contract for calendar-event range lookups.
///
/// Implemented by [`crate::domains::calendar::infrastructure::calendar_repository::CalendarRepository`].
#[async_trait]
pub trait CalendarEventQueries: Send + Sync {
    /// Return all non-deleted events whose `start_datetime` falls at or after
    /// `from` **and** whose `end_datetime` falls at or before `to`, where both
    /// bounds are Unix epoch **milliseconds**.
    ///
    /// When `technician_id` is `Some`, only events assigned to that technician
    /// are included.
    async fn find_events_in_range(
        &self,
        from: i64,
        to: i64,
        technician_id: Option<&str>,
    ) -> RepoResult<Vec<CalendarEvent>>;
}
