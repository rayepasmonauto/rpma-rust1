//! Domain-level errors for the auth bounded context (ADR-019).

use thiserror::Error;

/// Errors that can occur in authentication/signup domain logic.
#[derive(Debug, Error)]
pub enum AuthDomainError {
    #[error("{0}")]
    InvalidCredentials(String),
    #[error("{0}")]
    Validation(String),
    #[error("{0}")]
    Internal(String),
}
