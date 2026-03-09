-- Migration 035: Persistance des paramètres système globaux (AppSettings)
-- Remplace le stockage en mémoire (Mutex) par une table SQLite.
-- Une seule ligne avec id='global' représente la configuration de l'application.

CREATE TABLE IF NOT EXISTS app_settings (
    id                       TEXT    PRIMARY KEY DEFAULT 'global',
    general_settings         TEXT    NOT NULL DEFAULT '{}',
    security_settings        TEXT    NOT NULL DEFAULT '{}',
    notifications_settings   TEXT    NOT NULL DEFAULT '{}',
    appearance_settings      TEXT    NOT NULL DEFAULT '{}',
    data_management_settings TEXT    NOT NULL DEFAULT '{}',
    storage_settings         TEXT    NOT NULL DEFAULT '{}',
    business_rules           TEXT    NOT NULL DEFAULT '[]',
    security_policies        TEXT    NOT NULL DEFAULT '[]',
    integrations             TEXT    NOT NULL DEFAULT '[]',
    performance_configs      TEXT    NOT NULL DEFAULT '[]',
    business_hours           TEXT    NOT NULL DEFAULT '{}',
    updated_at               INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_by               TEXT
);

-- Garantit l'existence de la ligne 'global' dès la migration
INSERT OR IGNORE INTO app_settings (id, updated_at)
VALUES ('global', strftime('%s', 'now'));

CREATE INDEX IF NOT EXISTS idx_app_settings_updated ON app_settings(updated_at);
