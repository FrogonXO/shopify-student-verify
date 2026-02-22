-- Run this in your Neon SQL editor
-- Replaces the boolean 'reminded' column with 'reminder_count' integer

ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Copy existing data (reminded=true becomes 1)
UPDATE orders SET reminder_count = 1 WHERE reminded = true;

-- Drop the old column
ALTER TABLE orders DROP COLUMN IF EXISTS reminded;
