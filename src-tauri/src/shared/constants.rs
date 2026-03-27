/// Default number of items per page for most list queries.
pub const DEFAULT_PAGE_SIZE: i64 = 20;

/// Default number of users returned by user-list queries.
pub const DEFAULT_USER_LIST_SIZE: i64 = 50;

/// Default timezone string used when no timezone is provided.
pub const DEFAULT_TIMEZONE: &str = "UTC";

/// Number of minutes a user is locked out after too many failed auth attempts.
pub const RATE_LIMIT_LOCKOUT_MINUTES: i64 = 15;

/// Seconds before a client CRUD operation is considered timed out.
pub const CLIENT_OPERATION_TIMEOUT_SECS: u64 = 30;

/// Maximum minutes in the past that a scheduled start time may be set.
pub const MAX_PAST_START_MINUTES: i64 = 5;

/// Estimated duration (seconds) for a PPF inspection workflow step (15 min).
pub const WORKFLOW_DURATION_INSPECTION_SECS: i32 = 900;

/// Estimated duration (seconds) for a PPF repair/installation workflow step (30 min).
pub const WORKFLOW_DURATION_REPAIR_SECS: i32 = 1800;

/// Estimated duration (seconds) for a PPF final-check workflow step (5 min).
pub const WORKFLOW_DURATION_FINAL_CHECK_SECS: i32 = 300;

/// Application brand name used in logs, metadata, and UI signatures.
pub const APP_BRAND: &str = "RPMA v2";

/// Short proprietary watermark shown in the UI and app metadata.
pub const APP_WATERMARK: &str = "RPMA v2 - Proprietary";

/// Copyright notice embedded in the binary metadata and startup logs.
pub const APP_COPYRIGHT_NOTICE: &str = "Copyright (c) 2026 RPMA v2. All rights reserved.";

/// License descriptor used by the application metadata payload.
pub const APP_LICENSE_NAME: &str = "Proprietary";
