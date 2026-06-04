-- Add archive support to listings table
-- This migration adds columns to support soft-delete archiving of listings

ALTER TABLE listings
ADD COLUMN is_archived BOOLEAN DEFAULT false;

ALTER TABLE listings
ADD COLUMN archived_at TIMESTAMP;

-- Add comments for clarity
COMMENT ON COLUMN listings.is_archived IS 'Soft-delete flag: false=active, true=archived. Allows hiding old/inactive listings while preserving data for audit trails.';
COMMENT ON COLUMN listings.archived_at IS 'Timestamp when the listing was archived. Useful for audit trails and sorting.';
