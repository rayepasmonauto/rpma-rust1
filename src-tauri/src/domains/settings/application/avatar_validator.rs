//! Application-layer validation for avatar uploads (ADR-018).
//!
//! Business rules for avatar files are defined here, NOT in the IPC handler.

use crate::shared::ipc::errors::AppError;

/// Supported avatar image MIME types.
pub const SUPPORTED_FORMATS: [&str; 3] = ["image/png", "image/jpeg", "image/gif"];

/// Maximum avatar file size in bytes (5 MB).
pub const MAX_FILE_SIZE_BYTES: usize = 5 * 1024 * 1024;

/// Validate an avatar upload request at the application layer.
///
/// Returns `Ok(())` when the upload is acceptable, or an `AppError::Validation`
/// describing why it was rejected.
pub fn validate_avatar_upload(mime_type: &str, image_data: &[u8]) -> Result<(), AppError> {
    if !SUPPORTED_FORMATS.contains(&mime_type) {
        return Err(AppError::Validation(format!(
            "Unsupported image format: {}. Supported: PNG, JPEG, GIF",
            mime_type
        )));
    }
    if image_data.len() > MAX_FILE_SIZE_BYTES {
        return Err(AppError::Validation(format!(
            "Image too large. Maximum size is {}MB",
            MAX_FILE_SIZE_BYTES / (1024 * 1024)
        )));
    }
    Ok(())
}
