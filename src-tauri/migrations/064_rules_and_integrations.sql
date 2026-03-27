CREATE TABLE IF NOT EXISTS rule_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_key TEXT NOT NULL,
    trigger TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL,
    conditions_json TEXT NOT NULL DEFAULT '{}',
    actions_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS rule_execution_logs (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    entity_id TEXT,
    correlation_id TEXT NOT NULL,
    allowed INTEGER NOT NULL,
    message TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (rule_id) REFERENCES rule_definitions(id)
);

CREATE INDEX IF NOT EXISTS idx_rule_definitions_trigger_status
    ON rule_definitions(trigger, status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rule_execution_logs_rule_id
    ON rule_execution_logs(rule_id, created_at DESC);

CREATE TABLE IF NOT EXISTS integration_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    endpoint_url TEXT NOT NULL,
    headers_json TEXT NOT NULL DEFAULT '{}',
    subscribed_events_json TEXT NOT NULL DEFAULT '[]',
    encrypted_secret TEXT,
    status TEXT NOT NULL,
    last_tested_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_status
    ON integration_configs(status)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS integration_outbox (
    id TEXT PRIMARY KEY,
    integration_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    status TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    next_retry_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (integration_id) REFERENCES integration_configs(id)
);

CREATE INDEX IF NOT EXISTS idx_integration_outbox_status_retry
    ON integration_outbox(status, next_retry_at);
