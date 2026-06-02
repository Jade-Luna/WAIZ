-- Add decline_reason column to pickups table
-- This column stores the reason why a household declined an offer

ALTER TABLE pickups
ADD COLUMN decline_reason TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN pickups.decline_reason IS 'Reason provided by household when declining an offer. Visible to junkshops for feedback.';
