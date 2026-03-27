//! Re-exports of repository contracts from the domain layer (ADR-001).
//!
//! The canonical location for these traits is `domain/repositories`.
//! This module preserves backward compatibility for existing infrastructure imports.

pub use crate::domains::settings::domain::repositories::{
    AppSettingsRepository, SettingsRepository, UserSettingsPort,
};
