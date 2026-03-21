-- Migration 061: Task checklist items
--
-- Stores individual checklist item definitions and their completion state per task.
-- Replaces the localStorage-based workaround in PoseDetail.tsx.

CREATE TABLE IF NOT EXISTS task_checklist_items (
    id          TEXT     NOT NULL PRIMARY KEY,
    task_id     TEXT     NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    description TEXT     NOT NULL,
    position    INTEGER  NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,   -- 0 = false, 1 = true
    completed_at INTEGER,                       -- Unix ms timestamp, NULL if not completed
    completed_by TEXT,                          -- user_id who completed it
    notes       TEXT,
    created_at  INTEGER  NOT NULL,
    updated_at  INTEGER  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_task_id
    ON task_checklist_items (task_id);
