//! Rate-limiter port contract for cross-domain use (ADR-003).
//!
//! Domains that need rate limiting depend on this trait, NOT on any concrete
//! infrastructure implementation from another domain.

/// Minimal rate-limiter abstraction for general endpoint protection.
pub trait RateLimiterPort: Send + Sync {
    /// Returns `Ok(true)` when the request is allowed, `Ok(false)` when the
    /// rate limit is exceeded, or `Err(...)` on an internal error.
    fn check_and_record(
        &self,
        identifier: &str,
        max_requests: u32,
        window_seconds: i64,
    ) -> Result<bool, String>;
}
