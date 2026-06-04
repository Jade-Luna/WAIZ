-- Add archive support to pickups table
-- This migration adds columns to support soft-delete archiving of pickup transactions

ALTER TABLE pickups
ADD COLUMN is_archived BOOLEAN DEFAULT false;

ALTER TABLE pickups
ADD COLUMN archived_at TIMESTAMP;

-- Add comments for clarity
COMMENT ON COLUMN pickups.is_archived IS 'Soft-delete flag: false=active, true=archived. Allows hiding old/completed transactions while preserving data for audit trails.';
COMMENT ON COLUMN pickups.archived_at IS 'Timestamp when the transaction was archived. Useful for audit trails and sorting.';
