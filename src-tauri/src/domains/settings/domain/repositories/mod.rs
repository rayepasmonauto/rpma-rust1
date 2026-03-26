//! Repository contracts for the settings domain (ADR-005).
//!
//! Traits are defined here in the domain layer (ADR-001).
//! Concrete implementations live in the infrastructure layer.

use std::collections::HashMap;

use crate::shared::repositories::base::RepoResult;

use crate::domains::settings::models::{
    AppSettings, CreateOrganizationRequest, Organization, OrganizationSettings,
    UpdateOrganizationRequest, UserSettings,
};

/// Repository contract for organization settings and onboarding persistence.
///
/// Concrete implementation: [`crate::domains::settings::infrastructure::OrganizationRepository`].
/// Tests may substitute a mock that implements this trait.
pub trait SettingsRepository: Send + Sync {
    /// Retrieve all organization key-value settings.
    fn get_organization_settings(&self) -> RepoResult<OrganizationSettings>;

    /// Persist a batch of organization key-value settings.
    fn update_organization_settings(&self, settings: &HashMap<String, String>) -> RepoResult<()>;

    /// Retrieve the organization record, or `None` before onboarding.
    fn get_organization(&self) -> RepoResult<Option<Organization>>;

    /// Create the organization record during the onboarding flow.
    fn create_organization(&self, data: &CreateOrganizationRequest) -> RepoResult<Organization>;

    /// Update the organization record with partial data.
    fn update_organization(&self, data: &UpdateOrganizationRequest) -> RepoResult<Organization>;

    /// Retrieve onboarding status: `(completed, current_step)`.
    fn get_onboarding_status(&self) -> RepoResult<(bool, i32)>;

    /// Mark onboarding as complete.
    fn complete_onboarding(&self) -> RepoResult<()>;

    /// Return `true` if at least one active Admin user exists.
    fn has_admin_users(&self) -> RepoResult<bool>;

    /// Promote the earliest active user to Admin role.
    /// Called once during the onboarding flow.
    fn promote_first_user_to_admin(&self) -> RepoResult<()>;
}

/// Repository contract for application-wide settings persistence.
///
/// Concrete implementation: [`crate::domains::settings::infrastructure::SqliteSettingsRepository`].
pub trait AppSettingsRepository: Send + Sync {
    /// Retrieve the global application settings record.
    fn get_app_settings(&self) -> RepoResult<AppSettings>;

    /// Persist the full application settings record atomically.
    fn save_app_settings(&self, settings: &AppSettings, user_id: &str) -> RepoResult<()>;
}

/// Repository contract for user-specific settings persistence.
///
/// Concrete implementation: [`crate::domains::settings::infrastructure::SqliteUserSettingsRepository`].
pub trait UserSettingsPort: Send + Sync {
    /// Retrieve settings for a given user, creating defaults if absent.
    fn get_user_settings(&self, user_id: &str) -> RepoResult<UserSettings>;

    /// Persist a user's settings record atomically.
    fn save_user_settings(&self, user_id: &str, settings: &UserSettings) -> RepoResult<()>;
}
