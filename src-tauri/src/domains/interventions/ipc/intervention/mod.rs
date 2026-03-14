//! Intervention command modules
//!
//! This module contains all intervention-related command operations,
//! split into specialized modules for better maintainability.

pub mod data_access;
pub mod queries;
pub mod relationships;
pub mod workflow;

// Re-export all commands for backward compatibility
#[allow(unused_imports)]
pub use data_access::*;
#[allow(unused_imports)]
pub use queries::*;
#[allow(unused_imports)]
pub use relationships::*;
#[allow(unused_imports)]
pub use workflow::*;

// Authorization helpers live in the application layer (ADR compliance).
// `can_access_own_or_privileged` is used in tests within child modules.
#[allow(unused_imports)]
pub(crate) use crate::domains::interventions::application::authorization::can_access_own_or_privileged;
