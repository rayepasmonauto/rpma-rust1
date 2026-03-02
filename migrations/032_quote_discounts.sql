-- Migration 032: Add discount fields to quotes
-- Adds support for quote-level discounts (percentage and fixed amount)
-- Adds new quote statuses for conversion workflow

-- Add discount fields
ALTER TABLE quotes ADD COLUMN discount_type TEXT
  CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE quotes ADD COLUMN discount_value INTEGER DEFAULT 0;
ALTER TABLE quotes ADD COLUMN discount_amount INTEGER DEFAULT 0;

-- Create index for discount type filtering
CREATE INDEX IF NOT EXISTS idx_quotes_discount_type ON quotes(discount_type);
