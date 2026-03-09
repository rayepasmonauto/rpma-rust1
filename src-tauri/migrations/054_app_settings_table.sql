-- Migration 054: Create app_settings table for system-wide configuration
-- Stores global application settings in JSON format

CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY NOT NULL DEFAULT 'global',
    general_settings TEXT NOT NULL DEFAULT '{}',
    security_settings TEXT NOT NULL DEFAULT '{}',
    notifications_settings TEXT NOT NULL DEFAULT '{}',
    appearance_settings TEXT NOT NULL DEFAULT '{}',
    data_management_settings TEXT NOT NULL DEFAULT '{}',
    storage_settings TEXT NOT NULL DEFAULT '{}',
    business_rules TEXT NOT NULL DEFAULT '[]',
    security_policies TEXT NOT NULL DEFAULT '[]',
    integrations TEXT NOT NULL DEFAULT '[]',
    performance_configs TEXT NOT NULL DEFAULT '[]',
    business_hours TEXT NOT NULL DEFAULT '{}',
    updated_at INTEGER NOT NULL DEFAULT 0,
    updated_by TEXT
);

-- Insert default row if not exists
INSERT OR IGNORE INTO app_settings (id, general_settings, security_settings, notifications_settings, 
    appearance_settings, data_management_settings, storage_settings, business_rules, 
    security_policies, integrations, performance_configs, business_hours, updated_at)
VALUES ('global', '{}', '{}', '{}', '{}', '{}', '{}', '[]', '[]', '[]', '[]', '{}', 0);
