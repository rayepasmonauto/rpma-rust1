//! Application layer for the Documents bounded context.
//!
//! Document-specific contracts will be added here as IPC handlers
//! are migrated; photo operations are exposed through the infrastructure layer.

pub(crate) mod report_export;
pub(crate) mod report_pdf;
pub(crate) mod report_view_model;
