//! Cross-domain facade for the `rules` domain (ADR-002, ADR-003).
//!
//! Keep this surface minimal — only expose what other domains truly need.
//! Prefer `shared/contracts/` for type-only sharing.

/// Facade for the `Rules` domain.
pub struct RulesFacade;
