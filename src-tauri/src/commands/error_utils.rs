//! Error handling utilities for commands
//!
//! This module provides common error handling patterns to reduce duplication
//! across command handlers. All utilities ensure that internal error details
//! are logged server-side but never leaked to the frontend.

use crate::commands::AppError;
use crate::shared::error;

/// Convert a database error into a sanitized AppError::Database.
///
/// The raw error is logged internally but the message returned to the frontend
/// is generic to prevent leaking database details.
pub fn db_error<E: std::fmt::Display>(operation: &str, error: E) -> AppError {
    error::map_database(operation, error)
}

/// Convert a database error into a sanitized AppError::Database with a standard message format.
pub fn db_op_error<E: std::fmt::Display>(operation: &str, error: E) -> AppError {
    error::map_database(operation, error)
}

/// Create a validation error (safe to return — contains user-actionable info)
pub fn validation_error<E: std::fmt::Display>(field: &str, error: E) -> AppError {
    error::map_validation(format!("Validation failed for '{}': {}", field, error))
}

/// Create an authorization error (safe to return — contains user-actionable info)
pub fn auth_error<E: std::fmt::Display>(operation: &str, error: E) -> AppError {
    error::map_forbidden(format!(
        "Authorization failed for '{}': {}",
        operation, error
    ))
}

/// Create a not found error (safe to return — contains user-actionable info)
pub fn not_found_error(resource: &str, id: &str) -> AppError {
    error::map_not_found(resource, id)
}

/// Create a sanitized internal error that logs the raw details.
pub fn internal_error<E: std::fmt::Display>(operation: &str, error: E) -> AppError {
    error::map_internal(operation, error)
}

/// Extension trait for Result types to provide convenient error mapping
pub trait ResultExt<T, E> {
    fn map_db_error(self, operation: &str) -> Result<T, AppError>
    where
        E: std::fmt::Display;
}

impl<T, E> ResultExt<T, E> for Result<T, E> {
    fn map_db_error(self, operation: &str) -> Result<T, AppError>
    where
        E: std::fmt::Display,
    {
        self.map_err(|e| db_op_error(operation, e))
    }
}
