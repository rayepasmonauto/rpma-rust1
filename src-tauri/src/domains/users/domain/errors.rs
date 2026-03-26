//! Domain-level errors for the users bounded context (ADR-019).

use thiserror::Error;

/// Errors that can occur in user-management domain logic.
#[derive(Debug, Error)]
pub enum UsersDomainError {
    #[error("{0}")]
    Authorization(String),
}
