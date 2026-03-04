-- Migration: Remove quote sharing data
-- The public link sharing feature has been removed.
-- Quotes are now shareable ONLY via exported PDF.
-- This migration clears all sharing-related data.

-- Clear all sharing data from quotes
UPDATE quotes SET
    public_token = NULL,
    shared_at = NULL,
    view_count = 0,
    last_viewed_at = NULL,
    customer_message = NULL
WHERE public_token IS NOT NULL
   OR shared_at IS NOT NULL
   OR view_count > 0
   OR last_viewed_at IS NOT NULL
   OR customer_message IS NOT NULL;

-- Drop the partial index on public_token (no longer used)
DROP INDEX IF EXISTS idx_quotes_public_token;
