//! Session revocation port contract (ADR-003).
//!
//! Domains that need to invalidate user sessions depend on this trait,
//! NOT on any concrete `auth` infrastructure type.

/// Minimal port for revoking all active sessions belonging to a user.
pub trait SessionRevocationPort: Send + Sync + std::fmt::Debug {
    /// Delete all active sessions for the given user ID.
    ///
    /// Returns the number of sessions deleted, or an error string on failure.
    fn delete_user_sessions(&self, user_id: &str) -> Result<usize, String>;
}
