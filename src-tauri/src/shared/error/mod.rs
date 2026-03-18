//! Shared error types and mapping helpers for bounded contexts.
#![allow(dead_code)]

mod app_error;

pub use app_error::{AppError, AppResult};

pub(crate) fn map_validation(message: impl Into<String>) -> AppError {
    AppError::Validation(message.into())
}

pub(crate) fn map_auth(message: impl Into<String>) -> AppError {
    AppError::Authentication(message.into())
}

pub(crate) fn map_forbidden(message: impl Into<String>) -> AppError {
    AppError::Authorization(message.into())
}

pub(crate) fn map_not_found(resource: &str, id: impl AsRef<str>) -> AppError {
    AppError::NotFound(format!("{} '{}' not found", resource, id.as_ref()))
}

pub(crate) fn map_internal(context: &str, error: impl std::fmt::Display) -> AppError {
    AppError::internal_sanitized(context, error)
}

pub(crate) fn map_internal_error(context: &str, error: impl std::fmt::Display) -> AppError {
    map_internal(context, error)
}

pub(crate) fn map_database(context: &str, error: impl std::fmt::Display) -> AppError {
    AppError::db_sanitized(context, error)
}

/// Convert a string error to an AppError, inferring the appropriate error type
/// from keywords in the message.
///
/// Useful as a `.map_err` adapter when the upstream error is an opaque `String`.
pub fn convert_to_app_error(error: String) -> AppError {
    // Database operation errors
    if error.contains("Failed to get")
        || error.contains("Failed to query")
        || error.contains("Failed to insert")
        || error.contains("Failed to update")
        || error.contains("Failed to delete")
        || error.contains("Database operation failed")
        || error.contains("query")
        || error.contains("execute")
        || error.contains("prepare")
    {
        return AppError::Database(error);
    }

    // Validation errors
    if error.contains("validation")
        || error.contains("invalid")
        || error.contains("cannot")
        || error.contains("must be")
    {
        return AppError::Validation(error);
    }

    // Default to internal error for unknown types
    AppError::Internal(error)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_to_app_error_database() {
        let err = convert_to_app_error("Failed to get record".to_string());
        assert!(matches!(err, AppError::Database(_)));

        let err = convert_to_app_error("Failed to query tasks".to_string());
        assert!(matches!(err, AppError::Database(_)));
    }

    #[test]
    fn test_convert_to_app_error_validation() {
        let err = convert_to_app_error("invalid input".to_string());
        assert!(matches!(err, AppError::Validation(_)));

        let err = convert_to_app_error("value must be positive".to_string());
        assert!(matches!(err, AppError::Validation(_)));
    }

    #[test]
    fn test_convert_to_app_error_internal() {
        let err = convert_to_app_error("something went wrong".to_string());
        assert!(matches!(err, AppError::Internal(_)));
    }
}
