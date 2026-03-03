mod facade;
#[cfg(test)]
pub(crate) use facade::NotificationsFacade;
pub(crate) mod application;
#[cfg(feature = "export-types")]
pub mod domain;
#[cfg(not(feature = "export-types"))]
pub mod domain;
pub mod infrastructure;
pub mod ipc;
#[cfg(test)]
pub(crate) mod tests;

#[cfg(feature = "export-types")]
pub use application::{SendNotificationRequest, UpdateNotificationConfigRequest};
