-- Migration 033: Add quote attachments table
-- Adds support for attaching files (images, documents) to quotes

-- Create quote_attachments table
CREATE TABLE IF NOT EXISTS quote_attachments (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    attachment_type TEXT NOT NULL DEFAULT 'other'
        CHECK (attachment_type IN ('image', 'document', 'other')),
    description TEXT,
    created_at INTEGER NOT NULL,
    created_by TEXT,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_quote_attachments_quote_id ON quote_attachments(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_attachments_type ON quote_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_quote_attachments_created_at ON quote_attachments(created_at);