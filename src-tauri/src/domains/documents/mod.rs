mod facade;
pub(crate) use facade::DocumentsCommand;
pub(crate) use facade::DocumentsFacade;
pub(crate) use facade::DocumentsResponse;
pub(crate) use facade::DocumentsServices;
pub(crate) mod application;
#[cfg(feature = "export-types")]
pub mod domain;
#[cfg(not(feature = "export-types"))]
pub(crate) mod domain;
pub(crate) mod infrastructure;
pub(crate) mod ipc;
#[cfg(test)]
pub(crate) mod tests;
